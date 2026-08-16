import type { Contact, WorkOrder } from "@/features/demo/types/demo";
import type { ErpWorkOrder } from "@/features/erp-import/types/erp-import";
import type { MachineSettings } from "@/features/settings/types/settings";

export type ReferenceResolution<T> =
  | { status: "found"; id: string; entity: T }
  | { status: "missing"; id: string; entity: null }
  | { status: "unassigned"; id: null; entity: null };

export interface MasterDataSources {
  contacts?: readonly Contact[];
  machines?: readonly MachineSettings[];
  demoWorkOrders?: readonly WorkOrder[];
  erpWorkOrders?: readonly ErpWorkOrder[];
}

function resolveFrom<T>(index: ReadonlyMap<string, T>, id: string | null | undefined): ReferenceResolution<T> {
  if (!id) return { status: "unassigned", id: null, entity: null };
  const entity = index.get(id);
  return entity ? { status: "found", id, entity } : { status: "missing", id, entity: null };
}

/** Index de lecture unique : les entités restent détenues et modifiées par leur référentiel propriétaire. */
export function createMasterDataResolver(sources: MasterDataSources) {
  const contacts = new Map((sources.contacts ?? []).map((entity) => [entity.id, entity]));
  const machines = new Map((sources.machines ?? []).map((entity) => [entity.id, entity]));
  const demoWorkOrders = new Map((sources.demoWorkOrders ?? []).map((entity) => [entity.id, entity]));
  const erpWorkOrders = new Map((sources.erpWorkOrders ?? []).map((entity) => [entity.id, entity]));
  return {
    contact: (id: string | null | undefined) => resolveFrom(contacts, id),
    machine: (id: string | null | undefined) => resolveFrom(machines, id),
    workOrder(id: string | null | undefined): ReferenceResolution<ErpWorkOrder | WorkOrder> {
      if (!id) return { status: "unassigned", id: null, entity: null };
      const entity = erpWorkOrders.get(id) ?? demoWorkOrders.get(id);
      return entity ? { status: "found", id, entity } : { status: "missing", id, entity: null };
    },
  };
}

export function missingReferenceLabel(kind: "contact" | "machine" | "of", id: string): string {
  const labels = { contact: "Contact", machine: "Machine", of: "OF" } as const;
  return `${labels[kind]} introuvable (${id})`;
}
