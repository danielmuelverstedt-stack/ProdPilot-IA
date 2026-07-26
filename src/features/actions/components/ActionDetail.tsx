"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, fieldClass, formatEuropeanDate, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { completeAction, deleteAction, planAction, postponeAction, reassignAction } from "@/features/actions/services/action-service";
import { actionStatusTone } from "@/features/actions/services/action-status";

export function ActionDetail({ id }: { id: string }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const action = data.actions.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  const [postponing, setPostponing] = useState(false);
  const [postponeDate, setPostponeDate] = useState(action?.echeance ?? "");
  const [planning, setPlanning] = useState(false);
  const [planResponsable, setPlanResponsable] = useState("");
  const [planEcheance, setPlanEcheance] = useState("");
  const router = useRouter();
  if (!action) return <EmptyState title="Action introuvable" description="Cette action n’existe plus dans les données de démonstration." />;
  const current = action;

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateDemoData((draft) => {
      const target = draft.actions.find((item) => item.id === id);
      if (!target) return;
      target.description = String(form.get("description"));
      target.responsable = String(form.get("responsable"));
      target.echeance = String(form.get("echeance"));
      target.origine = String(form.get("origine"));
      target.remarque = String(form.get("remarque")) || null;
    });
    setEditing(false);
  }

  function remove() {
    if (!window.confirm(`Supprimer l’action « ${current.description} » ? Cette opération est définitive dans la démonstration.`)) return;
    deleteAction(current.id);
    router.push("/actions");
  }

  return <div className="mx-auto max-w-5xl">
    <ModuleHeader eyebrow={action.id} title={action.description} description={`Introduite par ${action.introduitPar} le ${formatEuropeanDate(action.dateEncodage)}`} actions={<><Link href="/actions" className={secondaryButton}>Retour</Link><button className={primaryButton} onClick={() => setEditing((value) => !value)}>{editing ? "Fermer" : "Modifier"}</button></>} />

    {editing ? <form onSubmit={save} className="mt-6 grid gap-3 rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:grid-cols-2">
      <textarea name="description" defaultValue={action.description} required className={`${fieldClass} min-h-24 py-3 sm:col-span-2`} />
      <input name="responsable" defaultValue={action.responsable} required className={fieldClass} />
      <input name="echeance" type="date" defaultValue={action.echeance} required className={fieldClass} />
      <select name="origine" defaultValue={action.origine} className={fieldClass}>{settings.actions.origins.map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}</select>
      <textarea name="remarque" defaultValue={action.remarque ?? ""} placeholder="Remarque (facultatif)" className={`${fieldClass} min-h-16 py-3 sm:col-span-2`} />
      <button className={primaryButton}>Enregistrer</button>
    </form> : null}

    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5 lg:col-span-2">
        <h2 className="font-semibold">Informations</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <Info label="Responsable" value={action.responsable || "Non assigné"} />
          <Info label="Statut" value={<StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill>} />
          <Info label="Échéance" value={action.statut === "À planifier" ? "Non planifiée" : formatEuropeanDate(action.echeance)} />
          <Info label="Origine" value={action.origine} />
          <Info label="Introduit par" value={action.introduitPar} />
          <Info label="Date d’encodage" value={formatEuropeanDate(action.dateEncodage)} />
          {action.dateCloture ? <Info label="Date de clôture" value={formatEuropeanDate(action.dateCloture, true)} /> : null}
          {action.contextLink ? <Info label="Lien contexte" value={<Link className="text-[var(--app-primary)] underline" href={action.contextLink.href}>{action.contextLink.label}</Link>} /> : null}
        </dl>
        {action.remarque ? <><h3 className="mt-6 text-sm font-semibold">Remarque</h3><p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{action.remarque}</p></> : null}
      </section>
      <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5">
        <h2 className="font-semibold">Suivi</h2>
        <div className="mt-4 flex flex-col gap-2">
          {action.statut === "À planifier" ? <>
            <p className="text-xs text-slate-500">Idée mise de côté, sans responsable ni échéance réels. Planifiez-la pour qu’elle rejoigne les actions.</p>
            {planning ? <div className="flex flex-col gap-2">
              <input required placeholder="Responsable" value={planResponsable} onChange={(event) => setPlanResponsable(event.target.value)} className={fieldClass} />
              <input required type="date" value={planEcheance} onChange={(event) => setPlanEcheance(event.target.value)} className={fieldClass} />
              <div className="flex gap-2"><button className={primaryButton} onClick={() => { if (planResponsable.trim() && planEcheance) { planAction(action.id, planResponsable, planEcheance); setPlanning(false); } }}>Confirmer</button><button className={secondaryButton} onClick={() => setPlanning(false)}>Annuler</button></div>
            </div> : <button className={primaryButton} onClick={() => setPlanning(true)}>Planifier</button>}
          </> : <>
            {action.statut !== "Fait" ? <button className={secondaryButton} onClick={() => completeAction(action.id)}>Marquer fait</button> : null}
            {postponing ? <div className="flex items-center gap-1"><input type="date" value={postponeDate} onChange={(event) => setPostponeDate(event.target.value)} className={`${fieldClass} min-h-9`} /><button className={secondaryButton} onClick={() => { if (postponeDate) { postponeAction(action.id, postponeDate); setPostponing(false); } }}>Confirmer</button></div>
              : <button className={secondaryButton} onClick={() => setPostponing(true)}>Reporter</button>}
            <label className="text-sm font-medium">Réassigner
              <select className={`${fieldClass} mt-1 w-full`} value={action.responsable} onChange={(event) => reassignAction(action.id, event.target.value)}>
                <option value={action.responsable}>{action.responsable}</option>
                {settings.users.filter((user) => user.active).map((user) => `${user.firstName} ${user.lastName}`).filter((name) => name !== action.responsable).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          </>}
          <button className={`${secondaryButton} text-red-700`} onClick={remove}>Supprimer</button>
        </div>
      </section>
    </div>
  </div>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1">{value}</dd></div>; }
