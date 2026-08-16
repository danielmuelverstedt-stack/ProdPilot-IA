import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage } from "pdf-lib";
import type { MeetingMachineReviewGroup } from "./meeting-machine-review";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 34;

export interface GeneratedMailAttachment {
  filename: string;
  mimeType: "application/pdf";
  base64: string;
}

function shortDate(value: string | null): string {
  if (!value) return "Non planifie";
  return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(value));
}

function period(start: string | null, end: string | null): string {
  const from = shortDate(start);
  const to = end ? shortDate(end) : null;
  return to && to !== from ? `${from} - ${to}` : from;
}

function fitText(value: string, maxLength: number): string {
  const safe = value.normalize("NFC").replace(/[–—→]/g, "-").replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
  return safe.length > maxLength ? `${safe.slice(0, Math.max(1, maxLength - 3))}...` : safe;
}

async function embedPhoto(pdf: PDFDocument, dataUrl: string | undefined): Promise<PDFImage | null> {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
  if (!match) return null;
  try {
    if (match[1] === "image/png") return await pdf.embedPng(match[2]);
    if (match[1] === "image/jpeg") return await pdf.embedJpg(match[2]);
    const jpeg = await convertWebpToJpeg(dataUrl);
    return jpeg ? await pdf.embedJpg(jpeg) : null;
  } catch { return null; }
}

async function convertWebpToJpeg(dataUrl: string): Promise<string | null> {
  if (typeof document === "undefined") return null;
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9).split(",")[1] ?? null);
    };
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

function drawHeader(page: PDFPage, title: string, date: string, bold: Awaited<ReturnType<PDFDocument["embedFont"]>>) {
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 72, width: PAGE_WIDTH, height: 72, color: rgb(0.19, 0.18, 0.51) });
  page.drawText("PREPARATION DE REUNION", { x: MARGIN, y: PAGE_HEIGHT - 29, size: 9, font: bold, color: rgb(0.78, 0.8, 1) });
  page.drawText(`${fitText(title, 60)} - ${date}`, { x: MARGIN, y: PAGE_HEIGHT - 53, size: 18, font: bold, color: rgb(1, 1, 1) });
}

export async function buildMeetingPlanningPdf(title: string, date: string, groups: MeetingMachineReviewGroup[], photos: Record<string, string>): Promise<GeneratedMailAttachment> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(page, title, date, bold);
  let y = PAGE_HEIGHT - 96;

  if (!groups.length) page.drawText("Aucun OF planifie par machine.", { x: MARGIN, y, size: 12, font: regular, color: rgb(0.39, 0.45, 0.55) });
  for (const group of groups) {
    const blockHeight = 76 + Math.max(1, group.rows.slice(0, 3).length) * 30;
    if (y - blockHeight < 35) { page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]); drawHeader(page, title, date, bold); y = PAGE_HEIGHT - 96; }
    page.drawRectangle({ x: MARGIN, y: y - blockHeight, width: PAGE_WIDTH - MARGIN * 2, height: blockHeight, borderColor: rgb(0.87, 0.89, 0.94), borderWidth: 1, color: rgb(1, 1, 1) });
    const photo = await embedPhoto(pdf, photos[group.machineId]);
    if (photo) {
      const scale = Math.min(70 / photo.width, 48 / photo.height);
      page.drawImage(photo, { x: MARGIN + 10, y: y - 58, width: photo.width * scale, height: photo.height * scale });
    } else page.drawRectangle({ x: MARGIN + 10, y: y - 58, width: 70, height: 48, color: rgb(0.93, 0.95, 1) });
    page.drawText(fitText(group.machineLabel, 52), { x: MARGIN + 94, y: y - 28, size: 15, font: bold, color: rgb(0.06, 0.09, 0.16) });
    page.drawText("3 OF prioritaires maximum", { x: MARGIN + 94, y: y - 45, size: 9, font: regular, color: rgb(0.39, 0.45, 0.55) });
    const columns = [MARGIN + 10, MARGIN + 82, MARGIN + 190, MARGIN + 310, MARGIN + 510, MARGIN + 570];
    const labels = ["OF", "Client", "Article", "Description", "Qte", "Planning"];
    page.drawRectangle({ x: MARGIN, y: y - 76, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: rgb(0.93, 0.95, 1) });
    labels.forEach((label, index) => page.drawText(label, { x: columns[index], y: y - 70, size: 8, font: bold, color: rgb(0.28, 0.33, 0.43) }));
    group.rows.slice(0, 3).forEach((row, index) => {
      const rowY = y - 95 - index * 30;
      const values = [row.workOrderId, row.customerName, row.articleCode, row.description, row.quantity == null ? "-" : String(row.quantity), period(row.plannedStartAt, row.plannedEndAt)];
      const limits = [12, 18, 20, 32, 8, 25];
      values.forEach((value, column) => page.drawText(fitText(value, limits[column]), { x: columns[column], y: rowY, size: 8.5, font: column === 0 ? bold : regular, color: column === 0 ? rgb(0.19, 0.18, 0.51) : rgb(0.2, 0.25, 0.33) }));
    });
    y -= blockHeight + 12;
  }

  const pages = pdf.getPages();
  pages.forEach((current, index) => current.drawText(`Page ${index + 1}/${pages.length}`, { x: PAGE_WIDTH - 75, y: 16, size: 8, font: regular, color: rgb(0.58, 0.64, 0.72) }));
  const bytes = await pdf.save();
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return { filename: `planning-machines-${date.replace(/\D/g, "-")}.pdf`, mimeType: "application/pdf", base64: btoa(binary) };
}
