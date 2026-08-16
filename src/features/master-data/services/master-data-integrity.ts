import type { MaintenanceProblem, Meeting, ProductionAction } from "@/features/demo/types/demo";
import type { createMasterDataResolver } from "./master-data-resolver.ts";

type MasterDataResolver = ReturnType<typeof createMasterDataResolver>;
export type MasterDataKind = "contact" | "machine" | "of";

export interface BrokenMasterDataReference {
  ownerType: "action" | "meeting" | "maintenanceProblem";
  ownerId: string;
  kind: MasterDataKind;
  referenceId: string;
}

/** Contrôle en lecture seule : aucune référence cassée n'est réparée ou supprimée automatiquement. */
export function auditMasterDataReferences(input: {
  resolver: MasterDataResolver;
  actions?: readonly ProductionAction[];
  meetings?: readonly Meeting[];
  maintenanceProblems?: readonly MaintenanceProblem[];
}): BrokenMasterDataReference[] {
  const issues: BrokenMasterDataReference[] = [];
  const check = (ownerType: BrokenMasterDataReference["ownerType"], ownerId: string, kind: MasterDataKind, referenceId: string | null | undefined) => {
    if (!referenceId) return;
    const resolution = kind === "contact" ? input.resolver.contact(referenceId) : kind === "machine" ? input.resolver.machine(referenceId) : input.resolver.workOrder(referenceId);
    if (resolution.status === "missing") issues.push({ ownerType, ownerId, kind, referenceId });
  };

  for (const action of input.actions ?? []) {
    check("action", action.id, "contact", action.responsableContactId);
    for (const link of action.contextLinks) {
      if (link.module === "machine" || link.module === "maintenance") check("action", action.id, "machine", link.id);
      if (link.module === "workOrder") check("action", action.id, "of", link.id);
    }
  }
  for (const meeting of input.meetings ?? []) {
    check("meeting", meeting.id, "contact", meeting.responsableContactId);
    meeting.participants.forEach((participant) => check("meeting", meeting.id, "contact", participant.contactId));
    meeting.criticalWorkOrderIds.forEach((id) => check("meeting", meeting.id, "of", id));
    meeting.fieldPoints.forEach((point) => {
      check("meeting", meeting.id, "contact", point.participantContactId);
      check("meeting", meeting.id, "contact", point.authorContactId);
      point.machineIds.forEach((id) => check("meeting", meeting.id, "machine", id));
      point.workOrderIds.forEach((id) => check("meeting", meeting.id, "of", id));
    });
  }
  for (const problem of input.maintenanceProblems ?? []) check("maintenanceProblem", problem.id, "machine", problem.machineId);
  return issues;
}
