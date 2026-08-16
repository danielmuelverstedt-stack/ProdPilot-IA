import { groupOperationsByMachineId, sortOperations } from "../../planning/services/workshop-view-service.ts";
import { createDefaultWorkshopFilters } from "../../planning/services/workshop-view-preferences.ts";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { MachineSettings } from "@/features/settings/types/settings";
import type { Machine, PlannedOperation, WorkOrder } from "@/features/demo/types/demo";

export interface MeetingMachineReviewRow {
  workOrderId: string;
  description: string;
  customerName: string;
  articleCode: string;
  quantity: number | null;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
}

export interface MeetingMachineReviewGroup {
  machineId: string;
  machineLabel: string;
  rows: MeetingMachineReviewRow[];
}

/**
 * Les `limit` OF les plus prioritaires actuellement planifiés sur chaque machine active et
 * visible, avec leur désignation, pour la revue en réunion de production. Réutilise le
 * regroupement et le tri déjà utilisés par l'Atelier (`groupOperationsByMachineId`/
 * `sortOperations`) : aucune règle de correspondance machine ou de tri par priorité n'est
 * redéfinie ici.
 */
export function buildErpMachineReview(rows: OperationView[], machines: MachineSettings[], limit: number): MeetingMachineReviewGroup[] {
  const { byMachineId } = groupOperationsByMachineId(rows, machines, createDefaultWorkshopFilters());
  return machines
    .filter((machine) => !machine.deleted && machine.active && machine.visible && byMachineId.has(machine.id))
    .sort((a, b) => a.order - b.order)
    .map((machine) => {
      const operations = sortOperations(byMachineId.get(machine.id) ?? [], { column: "priority", direction: "asc" }).slice(0, limit);
      return { machineId: machine.id, machineLabel: machine.displayName, rows: operations.map((operation) => ({ workOrderId: operation.workOrderId, description: operation.description || "Sans description", customerName: operation.workOrder?.customerName || "Client inconnu", articleCode: operation.articleCode || "—", quantity: operation.workOrder?.quantity ?? null, plannedStartAt: operation.plannedDate ?? null, plannedEndAt: null })) };
    })
    .filter((group) => group.rows.length > 0);
}

/** Repli démonstration (aucun import ERP actif) : même principe sur le planning et le catalogue machine de démonstration, triés chronologiquement faute de priorité numérique dans ce modèle. */
export function buildDemoMachineReview(planning: PlannedOperation[], machines: Machine[], workOrders: WorkOrder[], limit: number): MeetingMachineReviewGroup[] {
  const byMachineId = new Map<string, PlannedOperation[]>();
  [...planning].sort((a, b) => a.startAt.localeCompare(b.startAt)).forEach((item) => {
    const list = byMachineId.get(item.machineId) ?? [];
    list.push(item);
    byMachineId.set(item.machineId, list);
  });
  return machines
    .filter((machine) => byMachineId.has(machine.id))
    .map((machine) => {
      const items = (byMachineId.get(machine.id) ?? []).slice(0, limit);
      const rows = items.map((item) => {
        const order = workOrders.find((candidate) => candidate.id === item.workOrderId);
        const operation = order?.operations.find((candidate) => candidate.id === item.operationId);
        return { workOrderId: item.workOrderId, description: operation?.description || order?.description || "Sans description", customerName: order?.customer || "Client inconnu", articleCode: order?.article || "—", quantity: order?.quantity ?? null, plannedStartAt: item.startAt, plannedEndAt: item.endAt };
      });
      return { machineId: machine.id, machineLabel: machine.displayName, rows };
    })
    .filter((group) => group.rows.length > 0);
}
