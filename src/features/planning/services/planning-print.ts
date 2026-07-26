import { formatEuropeanDate } from "@/components/ui/ModuleUi";
import type { PlanningBlock, PlanningMachine } from "@/features/planning/types/planning";
import type { PrintColumnSettings, PrintSettings } from "@/features/settings/types/settings";

const HEADER_CONTENT = {
  logo: "logo",
  company: "company",
  dateTime: "datetime",
} as const;

export function getPlanningPrintConfiguration(print: PrintSettings): {
  tableColumns: PrintColumnSettings[];
  showLogo: boolean;
  showCompany: boolean;
  showDateTime: boolean;
} {
  const visible = [...print.columns].filter((column) => column.visible).sort((a, b) => a.order - b.order);
  const visibleHeaderIds = new Set(visible.filter((column) => column.placement === "header").map((column) => column.id));
  return {
    tableColumns: visible.filter((column) => column.placement === "table"),
    showLogo: visibleHeaderIds.has(HEADER_CONTENT.logo),
    showCompany: visibleHeaderIds.has(HEADER_CONTENT.company),
    showDateTime: visibleHeaderIds.has(HEADER_CONTENT.dateTime),
  };
}

export function getPlanningPrintValue(columnId: string, block: PlanningBlock, machine: PlanningMachine): string {
  const commonValues: Record<string, string> = {
    machine: machine.displayName,
    "planned-time": block.durationHours === null ? "Non disponible" : `${block.durationHours.toLocaleString("fr-BE")} h`,
    "planned-date": formatEuropeanDate(`${block.date}T12:00:00.000Z`),
    comments: block.comments,
    completed: "□",
    problem: "□",
  };
  if (block.source === "task") {
    return { ...commonValues, operation: `${block.display.label} · ${block.label}` }[columnId] ?? "—";
  }
  if (block.source === "erp-operation") {
    return {
      ...commonValues,
      "work-order": block.operationView.workOrderId,
      customer: block.operationView.workOrder?.customerName ?? "Client inconnu",
      article: block.operationView.articleCode,
      description: block.operationView.description ?? "",
      operation: `Op. ${block.operationView.operationNumber} · ${block.operationView.description ?? "Sans description"}`,
      priority: `${block.operationView.effectivePriority}`,
      "delivery-date": block.operationView.dueDate ? formatEuropeanDate(`${block.operationView.dueDate}T12:00:00.000Z`) : "—",
    }[columnId] ?? "—";
  }
  return {
    ...commonValues,
    "work-order": block.order.id,
    customer: block.order.customer,
    article: block.order.article,
    description: block.order.description,
    quantity: String(block.order.quantity),
    operation: `OP${block.operation.number} · ${block.operation.description}`,
    priority: block.priority.label,
    "delivery-date": formatEuropeanDate(`${block.order.dueDate}T12:00:00.000Z`),
  }[columnId] ?? "—";
}
