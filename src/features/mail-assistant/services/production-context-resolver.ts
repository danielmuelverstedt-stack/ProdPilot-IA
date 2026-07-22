import type { WorkOrder } from "@/features/demo/types/demo";
import type { MailAiProductionContext } from "@/features/ai/types/mail-ai";

/** Résout un OF ou un client mentionné en texte libre vers un contexte de production compact, sans transmettre de données inutiles. */
export function resolveProductionContext(text: string, workOrders: WorkOrder[]): MailAiProductionContext | null {
  const ofMatch = text.match(/\bOF-\d+\b/i);
  if (ofMatch) {
    const order = workOrders.find((item) => item.id.toLocaleUpperCase("fr") === ofMatch[0].toLocaleUpperCase("fr"));
    if (order) return toProductionContext(order);
  }
  const normalized = text.toLocaleLowerCase("fr");
  const byCustomer = workOrders.find((item) => item.customer.length > 2 && normalized.includes(item.customer.toLocaleLowerCase("fr")));
  return byCustomer ? toProductionContext(byCustomer) : null;
}

function toProductionContext(order: WorkOrder): MailAiProductionContext {
  return { workOrderId: order.id, customer: order.customer, article: order.article, dueDate: order.dueDate, status: order.status, project: order.project };
}
