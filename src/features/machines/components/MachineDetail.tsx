"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { EmptyState, formatEuropeanDate, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import type { ErpPlanningOverview } from "@/features/erp-import/types/erp-import";
import { MachineConsumablesPanel } from "@/features/machines/components/MachineConsumablesPanel";
import { MachineIdentityPanel } from "@/features/machines/components/MachineIdentityPanel";
import { MachinePhotoStorageMigration } from "@/features/machines/components/MachinePhotoStorageMigration";
import { MachinePhotoUploader } from "@/features/machines/components/MachinePhotoUploader";
import { MachinePrintView } from "@/features/machines/components/MachinePrintView";
import { MachineSavContactsPanel } from "@/features/machines/components/MachineSavContactsPanel";
import { MachineTechnicalPanel } from "@/features/machines/components/MachineTechnicalPanel";
import { setMachinePhoto, useMachinePhotos } from "@/features/machines/services/machine-photo-store";
import { machineTechnicalService } from "@/features/machines/services/machine-technical-service";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { machineSettingsService } from "@/features/settings/services/machine-settings-service";

const tabs = ["Vue générale", "Fiche technique", "Maintenance", "Historique", "Documents"] as const;

export function MachineDetail({ id }: { id: string }) {
  const router = useRouter();
  const data = useDemoData();
  const photos = useMachinePhotos();
  const { settings, updateSettings } = useSettings();
  const machine = settings.production.machines.find((item) => item.id === id);
  const details = data.machines.find((item) => item.id === id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Vue générale");
  const [creatingAction, setCreatingAction] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [overview, setOverview] = useState<ErpPlanningOverview | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/erp/imports", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (active && payload) setOverview(payload as ErpPlanningOverview); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  if (!machine) return <EmptyState title="Machine introuvable" description="Cette machine n’existe pas dans le référentiel machines." />;
  if (printing) return <MachinePrintView machine={machine} details={details} photoDataUrl={photos[id]} contacts={data.savContacts.filter((entry) => entry.machineId === id)} consumables={data.consumables.filter((entry) => entry.machineId === id)} print={settings.print} company={settings.company} onBack={() => setPrinting(false)} />;
  const mappedErpCodes = overview?.machineCodes.filter((entry) => entry.machineId === machine.id).map((entry) => entry.code) ?? [];
  const events = data.maintenance.filter((item) => item.machineId === id);
  const actions = data.actions.filter((item) => item.contextLink?.module === "machine" && item.contextLink.id === id);
  const openActions = actions.filter((item) => item.statut !== "Fait");
  const operationalStatus = machine.deleted ? "Supprimée" : machine.active ? "Active" : "Inactive";
  const machineDisplayName = machine.displayName;

  function changeActive(active: boolean) {
    updateSettings((draft) => { if (active) machineSettingsService.setActive(draft, id); else machineSettingsService.setInactive(draft, id); }, active ? "Machine activée" : "Machine désactivée");
  }

  function changeVisible(visible: boolean) {
    updateSettings((draft) => { if (visible) machineSettingsService.setVisible(draft, id); else machineSettingsService.setHidden(draft, id); }, visible ? "Machine affichée" : "Machine masquée");
  }

  function changeFavorite(favorite: boolean) {
    updateSettings((draft) => { const target = draft.production.machines.find((item) => item.id === id); if (target) target.favorite = favorite; }, favorite ? "Machine mise en favori" : "Machine retirée des favoris");
  }

  async function changePhoto(photoDataUrl: string) {
    await setMachinePhoto(id, photoDataUrl);
  }

  function deleteMachine() {
    if (!window.confirm(`Marquer ${machineDisplayName} comme supprimée ? Elle restera dans l’historique et les opérations concernées seront signalées.`)) return;
    updateSettings((draft) => { machineSettingsService.softDelete(draft, id); }, "Machine marquée comme supprimée");
    router.push("/machines");
  }

  function restoreMachine() {
    updateSettings((draft) => { machineSettingsService.restore(draft, id); }, "Machine restaurée");
  }

  return <div className="mx-auto max-w-6xl">
    <ModuleHeader eyebrow={`${machine.id} · ${machine.department}`} title={machine.displayName} description={machine.name} actions={<><button className={primaryButton} onClick={() => setCreatingAction(true)}>Créer une action</button><button className={secondaryButton} onClick={() => setPrinting(true)}>Imprimer la fiche machine</button>{machine.deleted ? <button className={secondaryButton} onClick={restoreMachine}>Restaurer</button> : <button className={secondaryButton} onClick={deleteMachine}>Supprimer</button>}<Link href="/machines" className={secondaryButton}>Retour au parc</Link></>} />
    {creatingAction ? <ActionFormDialog origine="Parc machines" contextLink={{ module: "machine", id: machine.id, label: machine.id, href: `/machines/${machine.id}` }} onClose={() => setCreatingAction(false)} /> : null}
    <MachinePhotoStorageMigration />
    <section className="mt-6 rounded-2xl border border-[var(--app-border)] bg-white p-4">
      <MachinePhotoUploader photoDataUrl={photos[id] ?? ""} alt={machine.displayName} onChange={changePhoto} />
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <StatusPill tone={machine.deleted ? "danger" : machine.active ? "success" : "neutral"}>{operationalStatus}</StatusPill>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={machine.active} disabled={Boolean(machine.deleted)} onChange={(event) => changeActive(event.target.checked)} /> Active</label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={machine.visible} disabled={Boolean(machine.deleted)} onChange={(event) => changeVisible(event.target.checked)} /> Visible</label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={machine.favorite ?? false} disabled={Boolean(machine.deleted)} onChange={(event) => changeFavorite(event.target.checked)} /> Favorite</label>
        <p className="text-xs text-slate-500">Ces états sont utilisés par le Planning, l’ERP et les futurs modules.</p>
      </div>
    </section>
    <div className="mt-6 flex gap-2 overflow-x-auto pb-1">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${tab === item ? "bg-[var(--app-primary)] text-white" : "border bg-white"}`}>{item}</button>)}</div>
    <section className="mt-4 rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{tab}</h2>{details ? <StatusPill tone={details.status === "En panne" ? "danger" : details.status === "Disponible" ? "success" : "warning"}>{details.status}</StatusPill> : null}</div>
      {tab === "Vue générale" ? <div className="mt-5"><MachineIdentityPanel machine={machine} departments={settings.production.departments} openActionsCount={openActions.length} mappedErpCodes={mappedErpCodes} onSave={(patch) => updateSettings((draft) => { machineSettingsService.updateIdentity(draft, id, patch); }, "Machine modifiée")} /></div> : null}
      {tab === "Fiche technique" ? <div className="mt-5"><MachineTechnicalPanel machineCode={machine.id} details={details} technicalInformation={machine.technicalInformation} onSave={(technical, technicalInformation) => { updateDemoData((draft) => { machineTechnicalService.updateTechnicalDetails(draft, machine, technical); }); updateSettings((draft) => { const target = draft.production.machines.find((item) => item.id === id); if (target) target.technicalInformation = technicalInformation; }, "Fiche technique modifiée"); }} /></div> : null}
      {tab === "Maintenance" ? <div className="mt-5"><div className="grid gap-3">{events.map((event) => <article className="rounded-xl bg-slate-50 p-4" key={event.id}><div className="flex justify-between gap-2"><strong>{event.type}</strong><StatusPill tone={event.status === "Terminée" ? "success" : event.status === "En cours" ? "danger" : "warning"}>{event.status}</StatusPill></div><p className="mt-2 text-sm">{formatEuropeanDate(event.date, true)} · {event.durationHours} h · {event.responsible}</p><p className="mt-1 text-xs text-slate-500">{event.comment}</p></article>)}</div><MachineSavContactsPanel machineId={id} /><MachineConsumablesPanel machineId={id} /></div> : null}
      {tab === "Historique" ? <div className="mt-5 space-y-3">{[...events].reverse().map((event) => <p key={event.id} className="border-l-2 pl-3 text-sm">{formatEuropeanDate(event.date)} · {event.type} · {event.status}</p>)}{actions.length ? <div className="mt-4 border-t border-slate-100 pt-4"><h3 className="text-sm font-semibold">Actions liées</h3><div className="mt-2 space-y-2">{actions.map((action) => <Link key={action.id} href={`/actions/${action.id}`} className="block rounded-lg bg-slate-50 p-3 text-sm hover:bg-slate-100">{action.description} <span className="text-xs text-slate-500">· {action.statut}</span></Link>)}</div></div> : null}</div> : null}
      {tab === "Documents" ? <EmptyState title="Aucun document" description="Les documents techniques seront reliés au stockage documentaire dans une future intégration." /> : null}
    </section>
  </div>;
}
