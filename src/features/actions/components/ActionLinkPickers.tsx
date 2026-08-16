"use client";

import { useMemo, useState } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import type { ActionContextLink } from "@/features/demo/types/demo";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { createMasterDataResolver } from "@/features/master-data/services/master-data-resolver";

/**
 * Sélecteurs pour rattacher une action à un ou plusieurs autres éléments de l'application — jamais
 * de copie de l'action, uniquement des références (`ActionContextLink`) ajoutées une à une via
 * `onAdd`. Partagé par `ActionFormDialog` (création) et `ActionQuickEditPanel` (édition rapide
 * depuis une réunion) pour ne jamais dupliquer cette logique de sélection.
 */
export function ActionLinkPickers({ onAdd }: { onAdd: (link: ActionContextLink) => void }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const references = useMemo(() => createMasterDataResolver({ machines: settings.production.machines, demoWorkOrders: data.workOrders }), [data.workOrders, settings.production.machines]);
  const [machineId, setMachineId] = useState("");
  const [alsoMaintenance, setAlsoMaintenance] = useState(false);
  const [workOrderId, setWorkOrderId] = useState("");
  const [qualityId, setQualityId] = useState("");

  function addMachine() {
    const machine = references.machine(machineId).entity;
    if (!machine) return;
    onAdd({ module: "machine", id: machine.id, label: machine.displayName, href: `/machines/${machine.id}` });
    if (alsoMaintenance) onAdd({ module: "maintenance", id: machine.id, label: `Maintenance ${machine.displayName}`, href: `/machines/${machine.id}` });
    setMachineId("");
    setAlsoMaintenance(false);
  }

  function addWorkOrder() {
    const order = references.workOrder(workOrderId).entity;
    if (!order) return;
    onAdd({ module: "workOrder", id: order.id, label: order.id, href: `/of/${order.id}` });
    setWorkOrderId("");
  }

  function addQuality() {
    const issue = data.erpQuality.find((item) => item.id === qualityId);
    if (!issue) return;
    onAdd({ module: "erpQuality", id: issue.id, label: issue.id, href: `/qualite-erp/${issue.id}` });
    setQualityId("");
  }

  return <div className="grid gap-3 sm:grid-cols-3">
    <div>
      <label className="text-xs font-semibold uppercase text-slate-500">Machine liée</label>
      <div className="mt-1 flex gap-1">
        <select className={`${fieldClass} min-w-0 flex-1`} value={machineId} onChange={(event) => setMachineId(event.target.value)}>
          <option value="">Sélection…</option>
          {settings.production.machines.filter((machine) => machine.active && machine.visible && !machine.deleted).map((machine) => <option key={machine.id} value={machine.id}>{machine.displayName}</option>)}
        </select>
        <button type="button" className={secondaryButton} disabled={!machineId} onClick={addMachine}>Ajouter</button>
      </div>
      <label className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
        <input type="checkbox" checked={alsoMaintenance} onChange={(event) => setAlsoMaintenance(event.target.checked)} />
        Aussi comme Maintenance
      </label>
    </div>
    <div>
      <label className="text-xs font-semibold uppercase text-slate-500">OF / Projet lié</label>
      <div className="mt-1 flex gap-1">
        <select className={`${fieldClass} min-w-0 flex-1`} value={workOrderId} onChange={(event) => setWorkOrderId(event.target.value)}>
          <option value="">Sélection…</option>
          {data.workOrders.map((order) => <option key={order.id} value={order.id}>{order.id} · {order.customer}</option>)}
        </select>
        <button type="button" className={secondaryButton} disabled={!workOrderId} onClick={addWorkOrder}>Ajouter</button>
      </div>
    </div>
    <div>
      <label className="text-xs font-semibold uppercase text-slate-500">Qualité liée</label>
      <div className="mt-1 flex gap-1">
        <select className={`${fieldClass} min-w-0 flex-1`} value={qualityId} onChange={(event) => setQualityId(event.target.value)}>
          <option value="">Sélection…</option>
          {data.erpQuality.map((issue) => <option key={issue.id} value={issue.id}>{issue.id} · {issue.problemType}</option>)}
        </select>
        <button type="button" className={secondaryButton} disabled={!qualityId} onClick={addQuality}>Ajouter</button>
      </div>
    </div>
  </div>;
}
