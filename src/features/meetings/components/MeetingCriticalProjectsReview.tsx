"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { actionStatusTone } from "@/features/actions/services/action-status";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { ERP_OPERATION_STATUS_LABELS } from "@/features/erp-import/services/erp-operation-status-presentation";
import { groupErpPlanningRows } from "@/features/erp-import/services/erp-planning-grouping";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import { MAX_MEETING_PRIORITY_DOSSIERS } from "@/features/meetings/services/meeting-lifecycle";
import { useErpImportActive } from "@/features/planning/hooks/useErpImportActive";
import { useWorkshopOperations } from "@/features/planning/hooks/useWorkshopOperations";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { summarizeErpWorkOrder } from "@/features/work-orders/services/erp-work-order-summary";
import { useVisibleTaskCategoryCodes } from "@/lib/visible-task-categories-store";
import type { ActionContextLink, MeetingLifecycleStatus, MeetingPriorityDossier, MeetingPriorityDossierReferenceKind, ProductionAction, WorkOrder } from "@/features/demo/types/demo";

const dossierStatuses: MeetingPriorityDossier["status"][] = ["À discuter", "En cours de discussion", "Décision prise", "Reporté"];

interface WorkOrderReadModel {
  id: string;
  customer?: string;
  customerOrderNumber?: string;
  article?: string;
  description?: string;
  quantity?: number;
  dueDate?: string | null;
  status?: string;
  currentOperation?: string;
  machine?: string;
}

function erpReadModel(rows: OperationView[]): WorkOrderReadModel {
  const summary = summarizeErpWorkOrder(rows);
  const current = rows.find((row) => ["blocked", "waiting", "in-progress"].includes(row.effectiveStatus)) ?? rows[0];
  const workOrder = rows[0]?.workOrder;
  return {
    id: summary.id,
    customer: summary.customer,
    customerOrderNumber: workOrder && "customerOrderNumber" in workOrder ? workOrder.customerOrderNumber : undefined,
    article: summary.article,
    description: summary.description || undefined,
    quantity: workOrder?.quantity,
    dueDate: summary.dueDate,
    status: ERP_OPERATION_STATUS_LABELS[summary.status],
    currentOperation: current ? `${current.operationNumber} · ${current.taskCode}` : undefined,
    machine: summary.machine === "Non définie" ? undefined : summary.machine,
  };
}

function demoReadModel(item: WorkOrder): WorkOrderReadModel {
  const current = item.operations.find((operation) => operation.status === "En cours" || operation.status === "Bloquée") ?? item.operations[0];
  return { id: item.id, customer: item.customer, article: item.article, description: item.description, quantity: item.quantity, dueDate: item.dueDate, status: item.status, currentOperation: current ? `${current.number} · ${current.description}` : undefined, machine: current?.machineId ?? undefined };
}

function actionContext(dossier: MeetingPriorityDossier): ActionContextLink | null {
  return dossier.referenceKind === "workOrder" && dossier.referenceId ? { module: "workOrder", id: dossier.referenceId, label: dossier.referenceId, href: `/of/${dossier.referenceId}` } : null;
}

export function MeetingCriticalProjectsReview({ dossiers, meetingStatus, actions, onAdd, onAddFromAction, onUpdate, onRemove, onMove, onActionCreated, onLinkExistingActions }: {
  dossiers: MeetingPriorityDossier[];
  meetingStatus: MeetingLifecycleStatus;
  actions: ProductionAction[];
  onAdd: (referenceKind: MeetingPriorityDossierReferenceKind, referenceId: string | null, title: string, preparationComment?: string) => void;
  onAddFromAction: (actionId: string, preparationComment?: string) => void;
  onUpdate: (id: string, patch: Partial<MeetingPriorityDossier>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onActionCreated: (dossierId: string, actionId: string, responsable: string) => void;
  onLinkExistingActions: (dossierId: string, actionIds: string[]) => void;
}) {
  const data = useDemoData();
  const { settings } = useSettings();
  const visibleCodes = useVisibleTaskCategoryCodes();
  const { hasActiveImport, isLoading: isCheckingImport } = useErpImportActive();
  const { allRows, isLoading, error, refresh } = useWorkshopOperations(settings.production.machines, visibleCodes);
  const [selectedId, setSelectedId] = useState<string | null>(dossiers[0]?.id ?? null);
  const [isCreatorOpen, setCreatorOpen] = useState(false);
  const [creatingActionFor, setCreatingActionFor] = useState<string | null>(null);
  const [linkingActionsFor, setLinkingActionsFor] = useState<string | null>(null);
  const isPreparation = ["Brouillon", "Préparation", "Envoyée"].includes(meetingStatus);
  const erpOrders = useMemo(() => groupErpPlanningRows(allRows, "work-order", settings.production.machines).map((group) => erpReadModel(group.rows)), [allRows, settings.production.machines]);
  const workOrders = useMemo(() => hasActiveImport ? erpOrders : data.workOrders.map(demoReadModel), [data.workOrders, erpOrders, hasActiveImport]);
  const workOrderById = useMemo(() => new Map(workOrders.map((item) => [item.id, item])), [workOrders]);
  const selected = dossiers.find((item) => item.id === selectedId) ?? dossiers[0] ?? null;
  const selectedIndex = selected ? dossiers.indexOf(selected) : -1;
  const selectedActions = selected ? actions.filter((action) => selected.actionIds.includes(action.id)) : [];

  return <div className="mt-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">Sélectionnez jusqu’à cinq OF à piloter pendant cette réunion.</p>
      <span title={dossiers.length >= MAX_MEETING_PRIORITY_DOSSIERS ? "Maximum de 5 dossiers prioritaires par réunion." : undefined}><button type="button" className={primaryButton} disabled={dossiers.length >= MAX_MEETING_PRIORITY_DOSSIERS} onClick={() => setCreatorOpen(true)}>+ Ajouter un dossier</button></span>
    </div>
    <p className="mt-2 text-xs text-slate-500">{dossiers.length}/{MAX_MEETING_PRIORITY_DOSSIERS} dossiers · les informations OF sont relues depuis leur source.</p>
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
      <nav aria-label="Dossiers prioritaires" className="grid content-start gap-2">
        {dossiers.map((dossier, index) => {
          const order = dossier.referenceId ? workOrderById.get(dossier.referenceId) : undefined;
          const sourceAction = dossier.referenceKind === "free" && dossier.actionIds.length === 1 ? actions.find((action) => action.id === dossier.actionIds[0]) : undefined;
          const openActions = actions.filter((action) => dossier.actionIds.includes(action.id) && action.statut !== "Fait").length;
          return <button key={dossier.id} type="button" onClick={() => setSelectedId(dossier.id)} className={`rounded-xl border p-3 text-left ${selected?.id === dossier.id ? "border-[var(--app-primary)] bg-[color-mix(in_srgb,var(--app-primary)_7%,white)]" : "border-[var(--app-border)] bg-white hover:bg-slate-50"}`}>
            <span className="flex items-start justify-between gap-2"><strong className="text-sm">{index + 1}. {order ? `OF ${order.id}` : sourceAction?.description ?? dossier.title}</strong><StatusPill tone={dossier.status === "Décision prise" ? "success" : dossier.status === "Reporté" ? "neutral" : "warning"}>{dossier.status}</StatusPill></span>
            {order?.customer ? <span className="mt-1 block text-sm font-medium">{order.customer}</span> : null}
            {order?.description ? <span className="block truncate text-xs text-slate-600">{order.description}</span> : null}
            <span className="mt-2 block text-xs text-slate-500">{order?.dueDate ? `Livraison : ${formatEuropeanDate(order.dueDate)} · ` : ""}{openActions} action(s) ouverte(s)</span>
          </button>;
        })}
        {!dossiers.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500">Aucun dossier prioritaire. Ajoutez un OF existant pour commencer.</p> : null}
      </nav>
      {selected ? <DossierDetail dossier={selected} order={selected.referenceId ? workOrderById.get(selected.referenceId) : undefined} index={selectedIndex} count={dossiers.length} isPreparation={isPreparation} actions={selectedActions} onUpdate={onUpdate} onRemove={() => { if (window.confirm("Retirer cet OF des dossiers prioritaires de cette réunion ?")) onRemove(selected.id); }} onMove={onMove} onCreateAction={() => setCreatingActionFor(selected.id)} onLinkExistingActions={() => setLinkingActionsFor(selected.id)} onPrevious={() => setSelectedId(dossiers[selectedIndex - 1]?.id ?? selected.id)} onNext={() => setSelectedId(dossiers[selectedIndex + 1]?.id ?? selected.id)} /> : null}
    </div>
    {isCreatorOpen ? <DossierCreator workOrders={workOrders} actions={actions} existingIds={new Set(dossiers.map((item) => item.referenceId).filter(Boolean))} linkedActionIds={new Set(dossiers.flatMap((item) => item.actionIds))} isLoading={isCheckingImport || (hasActiveImport && isLoading)} error={hasActiveImport ? error : null} onRetry={refresh} onClose={() => setCreatorOpen(false)} onAdd={(kind, id, title, note) => { onAdd(kind, id, title, note); setCreatorOpen(false); }} onAddFromAction={(actionId, note) => { onAddFromAction(actionId, note); setCreatorOpen(false); }} /> : null}
    {creatingActionFor && selected ? <ActionFormDialog origine="Réunion de production" contextLink={actionContext(selected)} allowLinkPicker initialDescription={`${selected.referenceId ? `OF ${selected.referenceId}` : selected.title} — `} onClose={() => setCreatingActionFor(null)} onCreated={(id, responsable) => { onActionCreated(selected.id, id, responsable); setCreatingActionFor(null); }} /> : null}
    {linkingActionsFor && selected?.id === linkingActionsFor ? <ExistingActionsPicker actions={actions} excludedIds={selected.actionIds} onClose={() => setLinkingActionsFor(null)} onConfirm={(actionIds) => { onLinkExistingActions(selected.id, actionIds); setLinkingActionsFor(null); }} /> : null}
  </div>;
}

function DossierDetail({ dossier, order, index, count, isPreparation, actions, onUpdate, onRemove, onMove, onCreateAction, onLinkExistingActions, onPrevious, onNext }: { dossier: MeetingPriorityDossier; order?: WorkOrderReadModel; index: number; count: number; isPreparation: boolean; actions: ProductionAction[]; onUpdate: (id: string, patch: Partial<MeetingPriorityDossier>) => void; onRemove: () => void; onMove: (id: string, direction: -1 | 1) => void; onCreateAction: () => void; onLinkExistingActions: () => void; onPrevious: () => void; onNext: () => void }) {
  return <article className="rounded-2xl border border-[var(--app-border)] bg-white p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-slate-500">Dossier {index + 1}</p><h3 className="mt-1 text-xl font-bold">{order ? `OF ${order.id}` : actions.length === 1 ? actions[0].description : dossier.title}</h3>{order ? <p className="text-sm text-slate-600">{[order.customer, order.description].filter(Boolean).join(" — ")}</p> : null}</div><div className="flex gap-1"><button className={secondaryButton} disabled={index === 0} onClick={() => onMove(dossier.id, -1)} aria-label="Monter le dossier">↑</button><button className={secondaryButton} disabled={index === count - 1} onClick={() => onMove(dossier.id, 1)} aria-label="Descendre le dossier">↓</button><button className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={onRemove}>Retirer</button></div></div>
    {dossier.referenceKind === "workOrder" ? <section className="mt-4 rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-2"><h4 className="font-semibold">Informations OF</h4>{order ? <Link className={secondaryButton} href={`/of/${order.id}`}>Ouvrir l’OF</Link> : null}</div>{order ? <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">{([ ["OF", order.id], ["Client", order.customer], ["Commande", order.customerOrderNumber], ["Article", order.article], ["Désignation", order.description], ["Quantité", order.quantity?.toLocaleString("fr-BE")], ["Livraison", order.dueDate ? formatEuropeanDate(order.dueDate) : undefined], ["Statut", order.status], ["Opération actuelle", order.currentOperation], ["Machine", order.machine] ] as Array<[string, string | undefined]>).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd>{value}</dd></div>)}</dl> : <p className="mt-2 text-sm text-amber-700">Cet OF n’est plus disponible dans la source active.</p>}</section> : null}
    <label className="mt-4 block text-sm font-semibold">Pourquoi ce dossier est prioritaire<textarea className={`${fieldClass} mt-2 min-h-20 w-full font-normal`} value={dossier.preparationComment} onChange={(event) => onUpdate(dossier.id, { preparationComment: event.target.value })} placeholder="Risque, point à vérifier, validation nécessaire…" /></label>
    <section className="mt-4 border-t border-[var(--app-border)] pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">Actions liées — {actions.length}</h4><div className="flex flex-wrap gap-2"><button className={secondaryButton} onClick={onLinkExistingActions}>Lier des actions existantes</button><button className={primaryButton} onClick={onCreateAction}>+ Nouvelle action</button></div></div>{actions.length ? <ul className="mt-2 space-y-2">{actions.map((action) => <li key={action.id}><Link href={`/actions/${action.id}`} className="block rounded-lg bg-slate-50 p-2 text-sm hover:bg-slate-100"><strong>{action.description}</strong><span className="mt-1 flex items-center gap-2 text-xs text-slate-500">{action.responsable || "Sans responsable"} · {formatEuropeanDate(action.echeance)} <StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill></span></Link></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Aucune action liée.</p>}</section>
    {!isPreparation ? <label className="mt-4 block text-sm font-semibold">Notes de réunion<textarea className={`${fieldClass} mt-2 min-h-24 w-full font-normal`} value={dossier.meetingComment} onChange={(event) => onUpdate(dossier.id, { meetingComment: event.target.value })} /></label> : <p className="mt-4 text-xs text-slate-500">Les notes de réunion seront disponibles au lancement de la réunion.</p>}
    <label className="mt-4 block rounded-xl border-2 border-[color-mix(in_srgb,var(--app-primary)_25%,transparent)] bg-[color-mix(in_srgb,var(--app-primary)_5%,white)] p-3 text-sm font-semibold">Décision / Conclusion<textarea className={`${fieldClass} mt-2 min-h-20 w-full bg-white font-normal`} value={dossier.decision} onChange={(event) => onUpdate(dossier.id, { decision: event.target.value, status: event.target.value.trim() ? "Décision prise" : dossier.status })} /></label>
    <label className="mt-3 block text-xs font-semibold uppercase text-slate-500">Statut<select className={`${fieldClass} mt-1 w-full normal-case`} value={dossier.status} onChange={(event) => onUpdate(dossier.id, { status: event.target.value as MeetingPriorityDossier["status"] })}>{dossierStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
    {!isPreparation ? <div className="mt-5 flex justify-between gap-3 border-t pt-4"><button className={secondaryButton} disabled={index === 0} onClick={onPrevious}>← Dossier précédent</button><button className={secondaryButton} disabled={index === count - 1} onClick={onNext}>Dossier suivant →</button></div> : null}
  </article>;
}

function ExistingActionsPicker({ actions, excludedIds, onClose, onConfirm }: { actions: ProductionAction[]; excludedIds: string[]; onClose: () => void; onConfirm: (actionIds: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const available = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return actions.filter((action) => !excludedIds.includes(action.id) && (!normalizedQuery || `${action.id} ${action.description} ${action.responsable} ${action.origine}`.toLocaleLowerCase("fr").includes(normalizedQuery)));
  }, [actions, excludedIds, query]);
  function toggle(id: string) { setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  return <PlanningDialogShell title="Lier des actions existantes" description="Sélectionnez une ou plusieurs actions du registre Actions." onClose={onClose} maxWidthClassName="max-w-2xl" actions={<><button className={secondaryButton} onClick={onClose}>Annuler</button><button className={primaryButton} disabled={!selectedIds.length} onClick={() => onConfirm(selectedIds)}>Lier {selectedIds.length ? `${selectedIds.length} action${selectedIds.length > 1 ? "s" : ""}` : "les actions"}</button></>}>
    <input autoFocus className={`${fieldClass} w-full`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par description, responsable, origine ou numéro…" />
    {available.length ? <div className="mt-4 grid max-h-[50vh] gap-2 overflow-y-auto pr-1">{available.map((action) => <label key={action.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${selectedIds.includes(action.id) ? "border-[var(--app-primary)] bg-[color-mix(in_srgb,var(--app-primary)_6%,white)]" : "border-[var(--app-border)] hover:bg-slate-50"}`}><input className="mt-1 size-4" type="checkbox" checked={selectedIds.includes(action.id)} onChange={() => toggle(action.id)} /><span className="min-w-0 flex-1"><strong className="block text-sm">{action.description}</strong><span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">{action.responsable || "Sans responsable"} · Échéance {formatEuropeanDate(action.echeance)} <StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill></span></span></label>)}</div> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{query.trim() ? "Aucune action ne correspond à cette recherche." : "Toutes les actions sont déjà liées à ce dossier."}</p>}
  </PlanningDialogShell>;
}

function DossierCreator({ workOrders, actions, existingIds, linkedActionIds, isLoading, error, onRetry, onClose, onAdd, onAddFromAction }: { workOrders: WorkOrderReadModel[]; actions: ProductionAction[]; existingIds: Set<string | null>; linkedActionIds: Set<string>; isLoading: boolean; error: string | null; onRetry: () => void; onClose: () => void; onAdd: (kind: MeetingPriorityDossierReferenceKind, id: string | null, title: string, note?: string) => void; onAddFromAction: (actionId: string, note?: string) => void }) {
  const [tab, setTab] = useState<"workOrder" | "free">("workOrder");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [preview, setPreview] = useState<WorkOrderReadModel | null>(null);
  const [actionPreview, setActionPreview] = useState<ProductionAction | null>(null);
  const [note, setNote] = useState("");
  const [freeTitle, setFreeTitle] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250); return () => window.clearTimeout(timer); }, [query]);
  const results = useMemo(() => debouncedQuery.length < 2 ? [] : workOrders.filter((item) => `${item.id} ${item.customerOrderNumber ?? ""} ${item.customer ?? ""} ${item.article ?? ""} ${item.description ?? ""}`.toLocaleLowerCase("fr").includes(debouncedQuery.toLocaleLowerCase("fr"))).slice(0, 50), [debouncedQuery, workOrders]);
  const actionResults = useMemo(() => debouncedQuery.length < 2 ? [] : actions.filter((action) => `${action.id} ${action.description} ${action.responsable} ${action.origine}`.toLocaleLowerCase("fr").includes(debouncedQuery.toLocaleLowerCase("fr"))).slice(0, 50), [actions, debouncedQuery]);
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside role="dialog" aria-modal="true" aria-labelledby="dossier-creator-title" className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"><header className="flex items-start border-b p-5"><div><h2 id="dossier-creator-title" className="text-lg font-bold">Ajouter un dossier prioritaire</h2><p className="mt-1 text-sm text-slate-500">Recherchez dans les OF et dans le registre Actions.</p></div><button className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Fermer">✕</button></header><div className="flex-1 overflow-y-auto p-5">
    <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "workOrder" ? "bg-white shadow-sm" : "text-slate-600"}`} onClick={() => { setTab("workOrder"); setPreview(null); setActionPreview(null); }}>OF et actions</button><button className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "free" ? "bg-white shadow-sm" : "text-slate-600"}`} onClick={() => { setTab("free"); setPreview(null); setActionPreview(null); }}>Dossier libre</button></div>
    {tab === "free" ? <div className="mt-5"><label className="text-sm font-semibold">Titre du dossier<input className={`${fieldClass} mt-2 w-full`} value={freeTitle} onChange={(event) => setFreeTitle(event.target.value)} /></label><label className="mt-4 block text-sm font-semibold">Note de préparation<textarea className={`${fieldClass} mt-2 min-h-24 w-full`} value={note} onChange={(event) => setNote(event.target.value)} /></label></div> : preview ? <div className="mt-5"><p className="text-xs font-semibold uppercase text-slate-500">Ajouter aux dossiers prioritaires</p><WorkOrderResult item={preview} /><label className="mt-5 block text-sm font-semibold">Pourquoi souhaitez-vous suivre ce dossier ?<textarea className={`${fieldClass} mt-2 min-h-24 w-full font-normal`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Commentaire facultatif" /></label></div> : actionPreview ? <div className="mt-5"><p className="text-xs font-semibold uppercase text-slate-500">Action sélectionnée</p><ActionSearchResult action={actionPreview} /><label className="mt-5 block text-sm font-semibold">Pourquoi souhaitez-vous suivre cette action ?<textarea className={`${fieldClass} mt-2 min-h-24 w-full font-normal`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Commentaire facultatif" /></label></div> : <div className="mt-5"><input autoFocus className={`${fieldClass} w-full text-base`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un OF ou une action…" />{query.trim().length < 2 ? <p className="mt-3 text-sm text-slate-500">Saisissez au moins 2 caractères : OF, client, article, description d’action ou responsable.</p> : <><div className="mt-5"><h3 className="text-xs font-semibold uppercase text-slate-500">Actions — {actionResults.length}</h3>{actionResults.length ? <div className="mt-2 grid gap-3">{actionResults.map((action) => <ActionSearchResult key={action.id} action={action} disabled={linkedActionIds.has(action.id)} onSelect={() => setActionPreview(action)} />)}</div> : <p className="mt-2 text-sm text-slate-500">Aucune action trouvée.</p>}</div><div className="mt-6"><h3 className="text-xs font-semibold uppercase text-slate-500">OF — {results.length}</h3>{isLoading ? <p className="mt-2 text-sm text-slate-600">Recherche des OF…</p> : error ? <div className="mt-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><p>Impossible de charger les OF.</p><button className={`${secondaryButton} mt-3`} onClick={onRetry}>Réessayer</button></div> : results.length ? <div className="mt-2 grid gap-3">{results.map((item) => <WorkOrderResult key={item.id} item={item} disabled={existingIds.has(item.id)} onSelect={() => setPreview(item)} />)}</div> : <p className="mt-2 text-sm text-slate-500">Aucun OF trouvé.</p>}</div></>}</div>}
  </div><footer className="flex justify-end gap-2 border-t p-4"><button className={secondaryButton} onClick={() => preview ? setPreview(null) : actionPreview ? setActionPreview(null) : onClose()}>{preview || actionPreview ? "Retour" : "Annuler"}</button>{preview ? <button className={primaryButton} onClick={() => onAdd("workOrder", preview.id, preview.id, note)}>Ajouter aux priorités</button> : actionPreview ? <button className={primaryButton} onClick={() => onAddFromAction(actionPreview.id, note)}>Ajouter l’action aux priorités</button> : tab === "free" ? <button className={primaryButton} disabled={!freeTitle.trim()} onClick={() => onAdd("free", null, freeTitle.trim(), note)}>Ajouter aux priorités</button> : null}</footer></aside></div>;
}

function ActionSearchResult({ action, disabled = false, onSelect }: { action: ProductionAction; disabled?: boolean; onSelect?: () => void }) {
  return <article className="rounded-xl border border-[var(--app-border)] bg-white p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><span className="text-xs font-semibold uppercase text-[var(--app-primary)]">Action {action.id}</span><strong className="mt-1 block text-sm">{action.description}</strong><p className="mt-1 text-xs text-slate-500">{action.responsable || "Sans responsable"} · Échéance {formatEuropeanDate(action.echeance)}</p></div>{onSelect ? <button className={secondaryButton} disabled={disabled} onClick={onSelect}>{disabled ? "Déjà ajoutée" : "Sélectionner"}</button> : <StatusPill tone={actionStatusTone(action.statut)}>{action.statut}</StatusPill>}</div></article>;
}

function WorkOrderResult({ item, disabled = false, onSelect }: { item: WorkOrderReadModel; disabled?: boolean; onSelect?: () => void }) {
  return <article className="rounded-xl border border-[var(--app-border)] bg-white p-4"><div className="flex items-start justify-between gap-4"><div><strong>OF {item.id}</strong>{item.customer ? <p className="mt-1 font-medium">{item.customer}</p> : null}{item.description ? <p className="text-sm text-slate-600">{item.description}</p> : null}</div>{onSelect ? <button className={secondaryButton} disabled={disabled} onClick={onSelect}>{disabled ? "Déjà ajouté" : "Sélectionner"}</button> : null}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">{item.article ? <span>Réf. {item.article}</span> : null}{item.quantity !== undefined ? <span>Qté : {item.quantity.toLocaleString("fr-BE")}</span> : null}{item.dueDate ? <span>Livraison : {formatEuropeanDate(item.dueDate)}</span> : null}{item.machine ? <span>Machine : {item.machine}</span> : null}</div></article>;
}
