"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { fieldClass, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { useMachinePhotos } from "@/features/machines/services/machine-photo-store";
import { createMaintenanceProblem } from "@/features/maintenance/services/maintenance-problem-service";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { currentDemoUserName } from "@/features/settings/services/current-user";
import type { MaintenanceProblemStatus } from "@/features/demo/types/demo";

export function MaintenanceProblemDialog({ initialMachineId = null, meetingId = null, onClose, onCreated }: { initialMachineId?: string | null; meetingId?: string | null; onClose: () => void; onCreated?: (id: string) => void }) {
  const { settings } = useSettings();
  const photos = useMachinePhotos();
  const [machineId, setMachineId] = useState(initialMachineId ?? "");
  const [machineQuery, setMachineQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<MaintenanceProblemStatus>("Ouvert");
  const [problemType, setProblemType] = useState("");
  const [machineStopped, setMachineStopped] = useState(false);
  const [productionImpact, setProductionImpact] = useState("");
  const [dueDate, setDueDate] = useState("");
  const machines = useMemo(() => settings.production.machines.filter((item) => !item.deleted && `${item.id} ${item.name} ${item.displayName} ${item.department} ${item.machineType}`.toLocaleLowerCase("fr").includes(machineQuery.toLocaleLowerCase("fr"))), [machineQuery, settings.production.machines]);
  const selectedMachine = settings.production.machines.find((item) => item.id === machineId);
  const types = settings.production.maintenanceTypes.filter((item) => item.active).sort((a, b) => a.order - b.order);

  function submit() {
    if (!machineId || !title.trim()) return;
    const id = createMaintenanceProblem({ machineId, title, description, occurredOn, status, problemType: problemType || null, machineStopped, productionImpact, dueDate: dueDate || null, author: currentDemoUserName(settings), meetingId });
    onCreated?.(id);
    onClose();
  }

  return <PlanningDialogShell title="Ajouter un problème maintenance" description="Le problème restera lié à la machine et consultable après la réunion." maxWidthClassName="max-w-2xl" onClose={onClose} actions={<><button className={secondaryButton} onClick={onClose}>Annuler</button><button className={primaryButton} disabled={!machineId || !title.trim()} onClick={submit}>Enregistrer le problème</button></>}>
    {!selectedMachine ? <div><label className="text-sm font-semibold">Rechercher une machine<input autoFocus className={`${fieldClass} mt-2 w-full`} value={machineQuery} onChange={(event) => setMachineQuery(event.target.value)} placeholder="Nom, numéro, département ou type…" /></label><div className="mt-4 grid gap-2 sm:grid-cols-2">{machines.map((machine) => <article key={machine.id} className="flex items-center gap-3 rounded-xl border p-3"><MachinePhoto src={photos[machine.id]} name={machine.displayName} /><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{machine.displayName}</strong><span className="text-xs text-slate-500">{machine.id} · {machine.department}{machine.machineType ? ` · ${machine.machineType}` : ""}</span></div><button className={secondaryButton} onClick={() => setMachineId(machine.id)}>Sélectionner</button></article>)}</div></div> : <div><div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><MachinePhoto src={photos[selectedMachine.id]} name={selectedMachine.displayName} /><div><p className="text-xs font-semibold uppercase text-slate-500">Machine sélectionnée</p><strong>{selectedMachine.displayName}</strong><p className="text-xs text-slate-500">{selectedMachine.department} · {selectedMachine.machineType}</p></div>{!initialMachineId ? <button className={`${secondaryButton} ml-auto`} onClick={() => setMachineId("")}>Changer</button> : null}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium sm:col-span-2">Titre du problème<input autoFocus required className={`${fieldClass} mt-1 w-full`} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="text-sm font-medium sm:col-span-2">Description<textarea className={`${fieldClass} mt-1 min-h-20 w-full`} value={description} onChange={(event) => setDescription(event.target.value)} /></label><label className="text-sm font-medium">Date du problème<input type="date" className={`${fieldClass} mt-1 w-full`} value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} /></label><label className="text-sm font-medium">Statut<select className={`${fieldClass} mt-1 w-full`} value={status} onChange={(event) => setStatus(event.target.value as MaintenanceProblemStatus)}>{["Ouvert", "En cours", "En attente", "Résolu"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm font-medium">Type<select className={`${fieldClass} mt-1 w-full`} value={problemType} onChange={(event) => setProblemType(event.target.value)}><option value="">Non renseigné</option>{types.map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}</select></label><label className="text-sm font-medium">Échéance facultative<input type="date" className={`${fieldClass} mt-1 w-full`} value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={machineStopped} onChange={(event) => setMachineStopped(event.target.checked)} /> Machine à l’arrêt</label><label className="text-sm font-medium sm:col-span-2">Impact production<input className={`${fieldClass} mt-1 w-full`} value={productionImpact} onChange={(event) => setProductionImpact(event.target.value)} /></label></div>
    </div>}
  </PlanningDialogShell>;
}

export function MachinePhoto({ src, name }: { src?: string; name: string }) { return src ? <Image unoptimized width={48} height={48} src={src} alt="" className="size-12 shrink-0 rounded-lg object-cover" /> : <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-slate-200 text-sm font-bold text-slate-500">{name.slice(0, 2).toUpperCase()}</div>; }
