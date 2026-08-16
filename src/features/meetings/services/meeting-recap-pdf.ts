import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import type { GeneratedMailAttachment } from "./meeting-planning-pdf";
import { groupMeetingRecapSection, parseMeetingRecapDocument } from "./meeting-recap-presentation.ts";

export interface MeetingRecapPdfBranding { companyName?: string; footerText?: string; logoDataUrl?: string }

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const NAVY = rgb(0.055, 0.11, 0.19);
const TEAL = rgb(0.02, 0.48, 0.45);
const BLUE = rgb(0.15, 0.35, 0.68);
const AMBER = rgb(0.85, 0.48, 0.08);
const SLATE = rgb(0.28, 0.34, 0.42);
const PAPER = rgb(0.985, 0.988, 0.99);
const BORDER = rgb(0.86, 0.89, 0.91);
const MUTED = rgb(0.42, 0.48, 0.55);

function safe(value: string): string {
  return value.normalize("NFC").replace(/[–—→•✓⚠]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?");
}

function wrap(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) { lines.push(current); current = word; }
    else current = candidate;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

async function embedLogo(pdf: PDFDocument, dataUrl?: string) {
  if (!dataUrl) return null;
  try {
    const [metadata, payload] = dataUrl.split(",");
    if (!payload) return null;
    const bytes = Uint8Array.from(atob(payload), (character) => character.charCodeAt(0));
    return /png/i.test(metadata) ? await pdf.embedPng(bytes) : /jpe?g/i.test(metadata) ? await pdf.embedJpg(bytes) : null;
  } catch { return null; }
}

function sectionAccent(title: string): RGB {
  if (/action/i.test(title)) return BLUE;
  if (/maintenance|parking/i.test(title)) return AMBER;
  if (/terrain/i.test(title)) return TEAL;
  return NAVY;
}

export async function buildMeetingRecapPdf(title: string, documentBody: string, branding: MeetingRecapPdfBranding = {}): Promise<GeneratedMailAttachment> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(pdf, branding.logoDataUrl);
  const recap = parseMeetingRecapDocument(documentBody);
  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = 0;

  function newPage(continuation = false) {
    if (continuation) page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAPER });
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 10, width: PAGE_WIDTH, height: 10, color: TEAL });
    if (continuation) {
      page.drawText(safe((branding.companyName || "ProdPilot IA").toUpperCase()), { x: MARGIN, y: 802, size: 8, font: bold, color: TEAL });
      page.drawText("COMPTE RENDU  /  SUITE", { x: PAGE_WIDTH - MARGIN - 112, y: 802, size: 8, font: bold, color: MUTED });
      page.drawLine({ start: { x: MARGIN, y: 790 }, end: { x: PAGE_WIDTH - MARGIN, y: 790 }, thickness: 0.7, color: BORDER });
      y = 758;
    } else y = 778;
  }
  function ensure(height: number) { if (y - height < 62) newPage(true); }
  newPage();
  page.drawRectangle({ x: 0, y: 635, width: PAGE_WIDTH, height: 197, color: NAVY });
  page.drawRectangle({ x: 0, y: 635, width: 10, height: 197, color: TEAL });
  if (logo) {
    const scale = Math.min(112 / logo.width, 30 / logo.height);
    page.drawRectangle({ x: MARGIN, y: 778, width: logo.width * scale + 16, height: logo.height * scale + 12, color: rgb(1, 1, 1) });
    page.drawImage(logo, { x: MARGIN + 8, y: 784, width: logo.width * scale, height: logo.height * scale });
  } else page.drawText(safe((branding.companyName || "ProdPilot IA").toUpperCase()), { x: MARGIN, y: 795, size: 9, font: bold, color: rgb(0.5, 0.84, 0.82) });
  page.drawText("RAPPORT DE RÉUNION", { x: MARGIN, y: 747, size: 8, font: bold, color: rgb(0.48, 0.83, 0.8) });
  const titleLines = wrap(title || recap.title, bold, 22, CONTENT_WIDTH - 4);
  titleLines.slice(0, 2).forEach((line, index) => page.drawText(line, { x: MARGIN, y: 711 - index * 27, size: 22, font: bold, color: rgb(1, 1, 1) }));
  page.drawLine({ start: { x: MARGIN, y: 663 }, end: { x: PAGE_WIDTH - MARGIN, y: 663 }, thickness: 0.6, color: rgb(0.22, 0.31, 0.41) });
  const participantLines = wrap(recap.participants, regular, 8.5, CONTENT_WIDTH - 88);
  page.drawText("PARTICIPANTS", { x: MARGIN, y: 646, size: 7, font: bold, color: rgb(0.48, 0.83, 0.8) });
  participantLines.slice(0, 2).forEach((line, index) => page.drawText(safe(line), { x: MARGIN + 88, y: 646 - index * 10.5, size: 8.5, font: regular, color: rgb(0.84, 0.88, 0.91) }));

  const metrics = [["DOSSIERS", recap.metrics.dossiers, NAVY], ["DÉCISIONS", recap.metrics.decisions, TEAL], ["ACTIONS", recap.metrics.actions, BLUE], ["TERRAIN", recap.metrics.terrain, AMBER]] as const;
  const cardGap = 10;
  const cardWidth = (CONTENT_WIDTH - cardGap * 3) / 4;
  metrics.forEach(([label, value, accent], index) => {
    const x = MARGIN + index * (cardWidth + cardGap);
    page.drawRectangle({ x, y: 558, width: cardWidth, height: 58, color: rgb(1, 1, 1), borderColor: BORDER, borderWidth: 0.7 });
    page.drawRectangle({ x, y: 610, width: cardWidth, height: 6, color: accent });
    page.drawText(String(value), { x: x + 14, y: 579, size: 19, font: bold, color: NAVY });
    page.drawText(safe(label), { x: x + 14, y: 566, size: 6.8, font: bold, color: MUTED });
  });
  y = 526;
  page.drawText("SYNTHÈSE OPÉRATIONNELLE", { x: MARGIN, y, size: 7.5, font: bold, color: TEAL });
  page.drawLine({ start: { x: MARGIN + 132, y: y + 2 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 2 }, thickness: 0.6, color: BORDER });
  y -= 28;

  for (const [sectionIndex, section] of recap.sections.entries()) {
    const accent = sectionAccent(section.title);
    const groups = groupMeetingRecapSection(section);
    const preparedGroups = groups.map((sourceGroup) => {
      let group = sourceGroup;
      if (/^Actions créées/i.test(section.title)) {
        const action = sourceGroup.title.match(/^(.*?)\s+[—-]\s+(.+?),\s*échéance\s+(.+?)\s+\((.+)\)$/i);
        if (action) group = { title: action[1], details: [`Responsable : ${action[2]}`, `Échéance : ${action[3]}`, `Statut : ${action[4]}`, ...sourceGroup.details] };
      }
      const titleLines = wrap(group.title, bold, 9.3, CONTENT_WIDTH - 62);
      const details = group.details.map((detail) => {
        const match = detail.match(/^([^:]{2,28})\s*:\s*(.*)$/);
        const label = match?.[1] ?? "Note";
        const value = match?.[2] ?? detail;
        const decision = /^Décision$/i.test(label);
        return { label, valueLines: wrap(value, decision ? bold : regular, 8.3, CONTENT_WIDTH - 144), decision };
      });
      const compactAction = /^Actions créées/i.test(section.title) && details.length >= 3;
      return { ...group, titleLines, details, compactAction, height: compactAction ? 24 + titleLines.length * 12 + 14 : 24 + titleLines.length * 12 + details.reduce((sum, detail) => sum + Math.max(14, detail.valueLines.length * 10.5) + 5, 0) };
    });
    ensure(42 + (preparedGroups[0]?.height ?? 24));
    page.drawRectangle({ x: MARGIN, y: y - 2, width: 25, height: 25, color: accent });
    page.drawText(String(sectionIndex + 1).padStart(2, "0"), { x: MARGIN + 6, y: y + 6, size: 8, font: bold, color: rgb(1, 1, 1) });
    page.drawText(safe(section.title.toUpperCase()), { x: MARGIN + 36, y: y + 5, size: 10, font: bold, color: NAVY });
    page.drawLine({ start: { x: MARGIN + 36, y: y - 5 }, end: { x: PAGE_WIDTH - MARGIN, y: y - 5 }, thickness: 1, color: accent });
    y -= 38;
    for (const [groupIndex, group] of preparedGroups.entries()) {
      ensure(group.height + 10);
      const groupTop = y;
      page.drawRectangle({ x: MARGIN, y: y - group.height + 10, width: CONTENT_WIDTH, height: group.height, color: rgb(1, 1, 1), borderColor: BORDER, borderWidth: 0.65 });
      page.drawRectangle({ x: MARGIN, y: y - group.height + 10, width: 4, height: group.height, color: accent });
      page.drawText(String(groupIndex + 1).padStart(2, "0"), { x: MARGIN + 15, y, size: 7.5, font: bold, color: accent });
      for (const line of group.titleLines) { page.drawText(safe(line), { x: MARGIN + 39, y, size: 9.3, font: bold, color: NAVY }); y -= 12; }
      if (group.compactAction) {
        const columnWidth = (CONTENT_WIDTH - 50) / 3;
        group.details.slice(0, 3).forEach((detail, detailIndex) => {
          const x = MARGIN + 39 + detailIndex * columnWidth;
          page.drawText(safe(detail.label.toUpperCase()), { x, y: y - 1, size: 6.4, font: bold, color: MUTED });
          page.drawText(safe(detail.valueLines[0] ?? "-"), { x, y: y - 13, size: 8.1, font: regular, color: detailIndex === 2 ? accent : SLATE, maxWidth: columnWidth - 10 });
        });
        y = groupTop - group.height + 4;
        continue;
      }
      if (group.details.length) y -= 4;
      for (const detail of group.details) {
        const rowHeight = Math.max(14, detail.valueLines.length * 10.5) + 3;
        if (detail.decision) {
          page.drawRectangle({ x: MARGIN + 12, y: y - rowHeight + 6, width: CONTENT_WIDTH - 24, height: rowHeight + 1, color: rgb(0.8, 0.93, 0.91) });
          page.drawRectangle({ x: MARGIN + 12, y: y - rowHeight + 6, width: 3, height: rowHeight + 1, color: TEAL });
        }
        page.drawText(safe(detail.label.toUpperCase()), { x: MARGIN + 20, y, size: 6.6, font: bold, color: detail.decision ? TEAL : MUTED });
        detail.valueLines.forEach((line, index) => page.drawText(safe(line), { x: MARGIN + 104, y: y - index * 10.5, size: 8.3, font: detail.decision ? bold : regular, color: detail.decision ? rgb(0.02, 0.32, 0.3) : SLATE }));
        y -= rowHeight + 5;
      }
      y -= 15;
    }
    y -= 13;
  }

  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    item.drawLine({ start: { x: MARGIN, y: 44 }, end: { x: PAGE_WIDTH - MARGIN, y: 44 }, thickness: 0.6, color: BORDER });
    item.drawText(safe(branding.footerText || "Document interne généré par ProdPilot IA"), { x: MARGIN, y: 27, size: 7, font: regular, color: MUTED, maxWidth: 390 });
    item.drawText(`${String(index + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`, { x: 515, y: 27, size: 7, font: bold, color: NAVY });
  });
  const bytes = await pdf.save();
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return { filename: "compte-rendu-reunion.pdf", mimeType: "application/pdf", base64: btoa(binary) };
}
