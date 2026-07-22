import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { ERP_DETAILS_FILE_NAME, ERP_MAX_FILE_SIZE_BYTES, ERP_TOP_FILE_NAME } from "@/features/erp-import/config/macro-range-profile";
import { erpImportRepository } from "@/features/erp-import/server/erp-import-repository";
import { parseErpWorkbookPair } from "@/features/erp-import/server/erp-workbook-parser";
import type { ErpImportSummary } from "@/features/erp-import/types/erp-import";

export async function importErpFiles(files: File[]): Promise<ErpImportSummary> {
  const startedAt = new Date().toISOString();
  if (files.length !== 2) throw new Error("Sélectionnez exactement les deux exports ERP attendus.");
  const topFile = files.find((file) => file.name.toLocaleLowerCase("fr") === ERP_TOP_FILE_NAME.toLocaleLowerCase("fr"));
  const detailsFile = files.find((file) => file.name.toLocaleLowerCase("fr") === ERP_DETAILS_FILE_NAME.toLocaleLowerCase("fr"));
  if (!topFile || !detailsFile) throw new Error(`Les fichiers doivent être nommés ${ERP_TOP_FILE_NAME} et ${ERP_DETAILS_FILE_NAME}.`);
  validateFile(topFile);
  validateFile(detailsFile);

  const [topBuffer, detailsBuffer] = await Promise.all([
    fileToBuffer(topFile),
    fileToBuffer(detailsFile),
  ]);
  assertXlsxSignature(topBuffer, topFile.name);
  assertXlsxSignature(detailsBuffer, detailsFile.name);
  assertSafeXlsxArchive(topBuffer, topFile.name);
  assertSafeXlsxArchive(detailsBuffer, detailsFile.name);

  const topHash = sha256(topBuffer);
  const detailsHash = sha256(detailsBuffer);
  const combinedHash = [topHash, detailsHash].sort().join(":");
  const duplicate = await erpImportRepository.findDuplicate(combinedHash);
  if (duplicate) throw new Error(`Ces deux exports ont déjà été importés le ${formatDateTime(duplicate.importedAt)}.`);

  const parsed = await parseErpWorkbookPair(topBuffer, detailsBuffer);
  const workOrderIds = new Set(parsed.workOrders.map((order) => order.id));
  const linkedOperationCount = parsed.operations.filter((operation) => workOrderIds.has(operation.workOrderId)).length;
  const duplicateOperationCount = parsed.operations.filter((operation) => operation.duplicateOf !== null).length;
  const missingMachineCount = parsed.operations.filter((operation) => operation.erpMachineCode === null || operation.erpMachineCode === "0").length;
  const issueCount = (parsed.operations.length - linkedOperationCount) + duplicateOperationCount + missingMachineCount;
  const importedAt = new Date().toISOString();
  const summary: ErpImportSummary = {
    id: `erp-import-${importedAt.replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`,
    importedAt,
    status: "accepted",
    files: [
      { kind: "top", name: ERP_TOP_FILE_NAME, sha256: topHash, size: topFile.size, rowCount: parsed.topRows.length - 1 },
      { kind: "details", name: ERP_DETAILS_FILE_NAME, sha256: detailsHash, size: detailsFile.size, rowCount: parsed.operations.length },
    ],
    workOrderCount: parsed.workOrders.length,
    operationCount: parsed.operations.length,
    linkedOperationCount,
    issueCount,
    duplicateOf: null,
  };
  await erpImportRepository.activateImport({
    summary,
    workOrders: parsed.workOrders,
    operations: parsed.operations,
    topBuffer,
    detailsBuffer,
    startedAt,
  });
  return summary;
}

function validateFile(file: File): void {
  if (file.size <= 0) throw new Error(`${file.name} est vide.`);
  if (file.size > ERP_MAX_FILE_SIZE_BYTES) throw new Error(`${file.name} dépasse la limite de 20 Mo.`);
  if (!file.name.toLocaleLowerCase("fr").endsWith(".xlsx")) throw new Error(`${file.name} n’est pas un fichier Excel .xlsx.`);
}

async function fileToBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
}

function assertXlsxSignature(buffer: Buffer, name: string): void {
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new Error(`${name} n’est pas un classeur XLSX valide.`);
}

function assertSafeXlsxArchive(buffer: Buffer, name: string): void {
  let offset = 0;
  let entries = 0;
  let uncompressedBytes = 0;
  while (offset <= buffer.length - 46) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) { offset += 1; continue; }
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    uncompressedBytes += buffer.readUInt32LE(offset + 24);
    entries += 1;
    if (entries > 10_000 || uncompressedBytes > 150 * 1024 * 1024) throw new Error(`${name} dépasse les limites de sécurité d’un classeur XLSX.`);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  if (!entries) throw new Error(`${name} ne contient pas d’archive XLSX lisible.`);
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(value));
}
