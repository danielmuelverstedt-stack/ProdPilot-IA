"use client";

import { useMemo, type ReactNode } from "react";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { buildDemoMachineReview, buildErpMachineReview, type MeetingMachineReviewGroup } from "@/features/meetings/services/meeting-machine-review";
import { useErpImportActive } from "@/features/planning/hooks/useErpImportActive";
import { useWorkshopOperations } from "@/features/planning/hooks/useWorkshopOperations";
import { useSettings } from "@/features/settings/components/SettingsProvider";

/** Charge la même projection planning que la revue machine, puis la fournit aux documents de réunion. */
export function MeetingMachinePlanningLoader({ limit, children }: { limit: number; children: (groups: MeetingMachineReviewGroup[]) => ReactNode }) {
  const { hasActiveImport, isLoading } = useErpImportActive();
  if (isLoading) return <LoadingLabel>Préparation du planning machines…</LoadingLabel>;
  return hasActiveImport ? <ErpPlanning limit={limit}>{children}</ErpPlanning> : <DemoPlanning limit={limit}>{children}</DemoPlanning>;
}

function ErpPlanning({ limit, children }: { limit: number; children: (groups: MeetingMachineReviewGroup[]) => ReactNode }) {
  const { settings } = useSettings();
  const machines = settings.production.machines;
  const { allRows, isLoading, error } = useWorkshopOperations(machines, []);
  const groups = useMemo(() => buildErpMachineReview(allRows, machines, limit), [allRows, limit, machines]);
  if (isLoading) return <LoadingLabel>Chargement des OF planifiés par machine…</LoadingLabel>;
  return <>{children(groups)}{error ? <p className="mt-2 text-xs text-amber-700">Le planning ERP n’a pas pu être ajouté : {error}</p> : null}</>;
}

function DemoPlanning({ limit, children }: { limit: number; children: (groups: MeetingMachineReviewGroup[]) => ReactNode }) {
  const data = useDemoData();
  const groups = useMemo(() => buildDemoMachineReview(data.planning, data.machines, data.workOrders, limit), [data.machines, data.planning, data.workOrders, limit]);
  return children(groups);
}

function LoadingLabel({ children }: { children: ReactNode }) { return <p className="mt-4 text-xs text-slate-500">{children}</p>; }
