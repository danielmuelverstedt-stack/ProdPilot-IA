"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ErrorBanner, secondaryButton } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { useErpImportActive } from "@/features/planning/hooks/useErpImportActive";
import { useWorkshopOperations } from "@/features/planning/hooks/useWorkshopOperations";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { PhotoThumbnail } from "@/components/ui/PhotoThumbnail";
import { useMachinePhotos } from "@/features/machines/services/machine-photo-store";
import { buildDemoMachineReview, buildErpMachineReview, type MeetingMachineReviewGroup } from "@/features/meetings/services/meeting-machine-review";
import type { ActionContextLink } from "@/features/demo/types/demo";

const OPERATIONS_PER_MACHINE = 5;

/**
 * Étape « OF planifiés par machine » de la réunion de production : les 5 OF les plus
 * prioritaires actuellement planifiés sur chaque machine, avec leur désignation, pour aller en
 * revue. Bascule automatiquement entre le planning ERP réel (import actif) et le repli
 * démonstration, comme la fiche OF (`WorkOrderDetail.tsx`).
 */
export function MeetingMachineReview({ origine }: { origine: string }) {
  const { hasActiveImport, isLoading: isCheckingImport } = useErpImportActive();
  if (isCheckingImport) return <p className="mt-4 text-sm text-slate-500">Vérification de la source du planning…</p>;
  return hasActiveImport ? <ErpMachineReview origine={origine} /> : <DemoMachineReview origine={origine} />;
}

function ErpMachineReview({ origine }: { origine: string }) {
  const { settings } = useSettings();
  const machines = settings.production.machines;
  const { allRows, isLoading, error } = useWorkshopOperations(machines, []);
  const groups = useMemo(() => buildErpMachineReview(allRows, machines, OPERATIONS_PER_MACHINE), [allRows, machines]);
  if (isLoading) return <p className="mt-4 text-sm text-slate-500">Chargement du planning…</p>;
  if (error) return <ErrorBanner>{error}</ErrorBanner>;
  return <MachineReviewList origine={origine} groups={groups} />;
}

function DemoMachineReview({ origine }: { origine: string }) {
  const data = useDemoData();
  const groups = useMemo(() => buildDemoMachineReview(data.planning, data.machines, data.workOrders, OPERATIONS_PER_MACHINE), [data.planning, data.machines, data.workOrders]);
  return <MachineReviewList origine={origine} groups={groups} />;
}

function MachineReviewList({ origine, groups }: { origine: string; groups: MeetingMachineReviewGroup[] }) {
  const photos = useMachinePhotos();
  const [actionTarget, setActionTarget] = useState<{ workOrderId: string } | null>(null);
  if (!groups.length) return <p className="mt-4 text-sm text-slate-600">Aucun OF planifié sur une machine active pour le moment.</p>;
  return <div className="mt-4 grid gap-4">
    {actionTarget ? <ActionFormDialog origine={origine} contextLink={buildContextLink(actionTarget.workOrderId)} onClose={() => setActionTarget(null)} /> : null}
    {groups.map((group) => <article key={group.machineId} className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-white">
      <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-slate-50 px-4 py-3">
        <PhotoThumbnail photoDataUrl={photos[group.machineId]} alt={group.machineLabel} size="md" />
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{group.machineLabel}</h3>
          <p className="text-xs text-slate-500">{group.rows.length} OF à revoir</p>
        </div>
      </div>
      <ul className="grid gap-2 p-3">
        {group.rows.map((row, index) => <li key={`${group.machineId}-${row.workOrderId}`} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-slate-500 ring-1 ring-inset ring-[var(--app-border)]" aria-hidden="true">{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block"><Link href={`/of/${row.workOrderId}`} className="font-semibold text-[var(--app-primary)]">{row.workOrderId}</Link> · {row.description}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{row.customerName} · Article {row.articleCode} · Qté {row.quantity != null ? row.quantity.toLocaleString("fr-BE") : "—"}</span>
          </span>
          <button type="button" className={`${secondaryButton} shrink-0`} title="Créer une action liée à cet OF" onClick={() => setActionTarget({ workOrderId: row.workOrderId })}>+ Action</button>
        </li>)}
      </ul>
    </article>)}
  </div>;
}

function buildContextLink(workOrderId: string): ActionContextLink {
  return { module: "workOrder", id: workOrderId, label: workOrderId, href: `/of/${workOrderId}` };
}
