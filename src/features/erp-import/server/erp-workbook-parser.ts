import "server-only";

import { readSheet, type CellValue, type Row } from "read-excel-file/node";
import {
  ERP_DETAILS_HEADERS,
  ERP_DETAILS_OPTIONAL_HEADERS,
  ERP_MAX_ROWS,
  ERP_TOP_HEADERS,
  assertExpectedHeaders,
  normalizeErpHeader,
} from "@/features/erp-import/config/macro-range-profile";
import type { ErpOperation, ErpWorkOrder } from "@/features/erp-import/types/erp-import";
import { operationIdentityService } from "@/features/erp-import/services/operation-identity-service";
import { extractDetailsMachineFields } from "@/features/erp-import/services/details-machine-mapping";

type NullableCellValue = CellValue | null | undefined;

export interface ParsedErpWorkbookPair {
  topRows: Row[];
  detailsRows: Row[];
  workOrders: ErpWorkOrder[];
  operations: ErpOperation[];
}

export async function parseErpWorkbookPair(top: Buffer, details: Buffer): Promise<ParsedErpWorkbookPair> {
  const [topRows, detailsRows] = await Promise.all([readSheet(top), readSheet(details)]);
  validateSheet(topRows, ERP_TOP_HEADERS, "REQ_MacroGamme_Top.xlsx");
  validateSheet(detailsRows, ERP_DETAILS_HEADERS, "REQ_MacroGamme_Details.xlsx", ERP_DETAILS_OPTIONAL_HEADERS);

  return {
    topRows,
    detailsRows,
    workOrders: parseWorkOrders(topRows),
    operations: parseOperations(detailsRows),
  };
}

function validateSheet(rows: Row[], headers: readonly string[], fileName: string, optionalHeaders: readonly string[] = []): void {
  if (!rows.length) throw new Error(`${fileName} est vide.`);
  if (rows.length - 1 > ERP_MAX_ROWS) throw new Error(`${fileName} dépasse la limite de ${ERP_MAX_ROWS.toLocaleString("fr-BE")} lignes.`);
  assertExpectedHeaders(rows[0], headers, fileName, optionalHeaders);
}

function parseWorkOrders(rows: Row[]): ErpWorkOrder[] {
  const headers = headerIndex(rows[0]);
  const byId = new Map<string, ErpWorkOrder>();
  const workOrders: ErpWorkOrder[] = [];
  rows.slice(1).forEach((row, index) => {
    const id = requiredIdentifier(cell(row, headers, "Num_OF"), "Num_OF", index + 2);
    const sourceRow = index + 2;
    const orderLine = {
      sourceRow,
      customerName: requiredString(cell(row, headers, "Nom"), "Nom", sourceRow),
      customerOrderNumber: identifier(cell(row, headers, "CDE_Client_Num")),
      customerOrderLine: identifier(cell(row, headers, "CDE_Client_Poste")),
      confirmedDueDate: dateOnly(cell(row, headers, "Délai_Confirmé")),
      requestedDueDate: dateOnly(cell(row, headers, "Délais")),
      quantity: finiteNumber(cell(row, headers, "Qté_Cdée")),
      customerReference: optionalString(cell(row, headers, "Réf_Cde_Client")),
      lineStatus: identifier(cell(row, headers, "Statut_Ligne_Cde")),
      customerOrderDetailId: identifier(cell(row, headers, "IDCde_Clients_Detail")),
    };
    const existing = byId.get(id);
    if (existing) {
      existing.sourceRows.push(sourceRow);
      existing.orderLines.push(orderLine);
      return;
    }
    const workOrder: ErpWorkOrder = {
      id,
      status: optionalString(cell(row, headers, "Status")),
      newDelayLabel: optionalString(cell(row, headers, "Nouveau_Délais")),
      articleCode: requiredString(cell(row, headers, "Code_Article"), "Code_Article", index + 2),
      description: optionalString(cell(row, headers, "Description")),
      articleId: identifier(cell(row, headers, "IDArticles")),
      articleGroupId: identifier(cell(row, headers, "IDArticle_Grp_1")),
      customerName: orderLine.customerName,
      customerOrderNumber: orderLine.customerOrderNumber,
      customerOrderLine: orderLine.customerOrderLine,
      confirmedDueDate: orderLine.confirmedDueDate,
      requestedDueDate: orderLine.requestedDueDate,
      quantity: orderLine.quantity,
      customerReference: orderLine.customerReference,
      orderStatus: optionalString(cell(row, headers, "OF_Cde")),
      lineStatus: orderLine.lineStatus,
      responsible: optionalString(cell(row, headers, "Resp_Cde_OF")) ?? "",
      customerOrderDetailId: orderLine.customerOrderDetailId,
      sourceRow,
      sourceRows: [sourceRow],
      orderLines: [orderLine],
    };
    byId.set(id, workOrder);
    workOrders.push(workOrder);
  });
  return workOrders;
}

function parseOperations(rows: Row[]): ErpOperation[] {
  const headers = headerIndex(rows[0]);
  const occurrences = new Map<string, number>();
  const firstByFingerprint = new Map<string, string>();
  return rows.slice(1).map((row, index) => {
    const sourceRow = index + 2;
    const workOrderId = requiredIdentifier(cell(row, headers, "Num_OF"), "Num_OF", sourceRow);
    const operationNumber = finiteNumber(cell(row, headers, "Operation_Num"));
    const taskCode = identifier(cell(row, headers, "Code_Tâche"));
    const baseId = operationIdentityService.createStableId({ workOrderId, operationNumber, taskCode });
    const occurrence = (occurrences.get(baseId) ?? 0) + 1;
    occurrences.set(baseId, occurrence);
    const actualStartAt = dateTime(cell(row, headers, "debut_reel"));
    const actualEndAt = dateTime(cell(row, headers, "fin_reel"));
    const operationStatusId = finiteNumber(cell(row, headers, "IDOperation_Status"));
    const id = operationIdentityService.createOperationId(baseId, occurrence);
    const fingerprint = JSON.stringify(row.map((value) => value instanceof Date ? value.toISOString() : value));
    const duplicateOf = firstByFingerprint.get(fingerprint) ?? null;
    if (!duplicateOf) firstByFingerprint.set(fingerprint, id);
    const machineFields = extractDetailsMachineFields(row, headers);
    return {
      id,
      stableId: baseId,
      erpStatus: "Active",
      workOrderId,
      operationNumber,
      operationStatusId,
      taskCode,
      actualStartAt,
      actualEndAt,
      subcontracted: finiteNumber(cell(row, headers, "ST")) !== 0,
      orderStatus: requiredString(cell(row, headers, "Status"), "Status", sourceRow),
      erpDueDate: dateOnly(cell(row, headers, "Nouveau_Délais")),
      articleCode: requiredString(cell(row, headers, "Code_Article"), "Code_Article", sourceRow),
      description: optionalString(cell(row, headers, "Description")),
      macroRangeCode: identifier(cell(row, headers, "Macro_Gamme")),
      erpPriority: finiteNumber(cell(row, headers, "Priorite")),
      ...machineFields,
      normalizedStatus: normalizeStatus(operationStatusId, actualStartAt, actualEndAt),
      sourceRow,
      duplicateOf,
    };
  });
}

function normalizeStatus(statusId: number, actualStartAt: string | null, actualEndAt: string | null): ErpOperation["normalizedStatus"] {
  if (actualEndAt) return "completed";
  if (actualStartAt) return "in-progress";
  // Les libellés métier correspondant aux codes 1 à 5 ne sont pas présents dans l’export.
  // Le code brut reste disponible ; aucune signification non confirmée n’est inventée ici.
  void statusId;
  return "unknown";
}

function headerIndex(row: Row): Map<string, number> {
  return new Map(row.map((value, index) => [normalizeErpHeader(value), index]));
}

function cell(row: Row, headers: Map<string, number>, name: string): NullableCellValue {
  const index = headers.get(normalizeErpHeader(name));
  return index === undefined ? undefined : row[index];
}

function requiredString(value: NullableCellValue, column: string, row: number): string {
  const result = optionalString(value);
  if (!result) throw new Error(`La colonne ${column} est vide à la ligne ${row}.`);
  return result;
}

function requiredIdentifier(value: NullableCellValue, column: string, row: number): string {
  const result = identifier(value);
  if (!result) throw new Error(`La colonne ${column} est vide à la ligne ${row}.`);
  return result;
}

function optionalString(value: NullableCellValue): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim() || null;
}

function identifier(value: NullableCellValue): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

function finiteNumber(value: NullableCellValue): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOnly(value: NullableCellValue): string | null {
  const date = asDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
}

function dateTime(value: NullableCellValue): string | null {
  const date = asDate(value);
  return date ? date.toISOString() : null;
}

function asDate(value: NullableCellValue): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  return null;
}
