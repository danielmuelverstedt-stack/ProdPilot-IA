import type { ErpWorkOrder, OperationView } from "@/features/erp-import/types/erp-import";
import type { WorkOrder } from "@/features/demo/types/demo";
import type { UserSettings } from "@/features/settings/types/settings";
import type { PalletLabelFields } from "@/features/pallet-label/types/pallet-label";

export function emptyLabelFields(ofNumber: string): PalletLabelFields {
  return { ofNumber, client: "", quantity: "", articleCode: "", description: "", planNumber: "" };
}

export function buildLabelFieldsFromDemoWorkOrder(order: WorkOrder | undefined, ofNumber: string): PalletLabelFields {
  if (!order) return emptyLabelFields(ofNumber);
  return { ofNumber: order.id, client: order.customer, quantity: String(order.quantity), articleCode: order.article, description: order.description, planNumber: "" };
}

/**
 * `fallbackRow` couvre les opérations ERP orphelines (sans ligne Top associée) : `workOrder` y est
 * alors `null` ou réduit à un résumé, mais la ligne d'opération porte encore article et description.
 */
export function buildLabelFieldsFromErpWorkOrder(workOrder: ErpWorkOrder | null, fallbackRow: OperationView | undefined, ofNumber: string): PalletLabelFields {
  const customer = workOrder?.customerName ?? fallbackRow?.workOrder?.customerName ?? "";
  const quantity = workOrder?.quantity ?? fallbackRow?.workOrder?.quantity ?? null;
  const articleCode = workOrder?.articleCode ?? fallbackRow?.articleCode ?? "";
  const description = workOrder?.description ?? fallbackRow?.description ?? "";
  if (!customer && !articleCode && !description && quantity === null) return emptyLabelFields(ofNumber);
  return { ofNumber, client: customer, quantity: quantity !== null ? String(quantity) : "", articleCode, description: description ?? "", planNumber: "" };
}

/** Initiales de l'utilisateur actif, pour le visa d'édition de l'affiche (ex. « DM »). */
export function deriveVisaInitials(users: UserSettings[]): string {
  const active = users.find((user) => user.active);
  if (!active) return "";
  return `${active.firstName.charAt(0)}${active.lastName.charAt(0)}`.toUpperCase();
}
