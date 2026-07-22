"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { EmptyState, fieldClass, formatEuropeanDate, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { ErpPlanningOperations } from "@/features/erp-import/components/ErpPlanningOperations";
import { PlanningFilterPanel } from "@/features/erp-import/components/PlanningFilterPanel";
import { useErpPlanningViews } from "@/features/erp-import/hooks/useErpPlanningViews";
import { filterEngine } from "@/features/erp-import/services/filter-engine";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import type { ErpOperationStatus, ErpPlanningOverview, ErpPlanningQueryResult, OperationView } from "@/features/erp-import/types/erp-import";

type WorkspaceView = "dashboard" | "operations" | "unmapped" | "quality" | "imports";

const VIEW_LABELS: Array<{ id: WorkspaceView; label: string }> = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "operations", label: "Opérations" },
  { id: "unmapped", label: "OF sans machine" },
  { id: "quality", label: "Qualité ERP" },
  { id: "imports", label: "Imports" },
];

export function ErpPlanningWorkspace() {
  const { settings } = useSettings();
  const machines = useMemo(() => [...settings.production.machines].sort((a, b) => a.order - b.order), [settings.production.machines]);
  const activeMachineIds = useMemo(() => machines.filter((entry) => entry.active && !entry.deleted).map((entry) => entry.id), [machines]);
  const currentUser = useMemo(() => settings.users.find((entry) => entry.active && entry.roleId === settings.activeRoleId) ?? settings.users.find((entry) => entry.active) ?? settings.users[0], [settings.activeRoleId, settings.users]);
  const preferenceContext = useMemo(() => ({ companyId: "local-development-company", siteId: "default-site", userId: currentUser?.id ?? "local-development-user" }), [currentUser?.id]);
  const planningViews = useErpPlanningViews(preferenceContext);
  const activePlanningView = planningViews.activeView;
  const [view, setView] = useState<WorkspaceView>("dashboard");
  const [overview, setOverview] = useState<ErpPlanningOverview | null>(null);
  const [rows, setRows] = useState<ErpPlanningQueryResult | null>(null);
  const [page, setPage] = useState(1);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedOf, setSelectedOf] = useState<{ id: string; rows: OperationView[] } | null>(null);
  const busy = isLoadingOverview || isLoadingRows || isMutating;

  const loadOverview = useCallback(async () => {
    const response = await fetch("/api/erp/imports", { cache: "no-store" });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(apiMessage(payload));
    const next = payload as ErpPlanningOverview;
    const valid = new Set(activeMachineIds);
    next.metrics.unmappedOperations = next.machineCodes.filter((entry) => !entry.machineId || !valid.has(entry.machineId)).reduce((sum, entry) => sum + entry.operationCount, 0);
    setOverview(next);
  }, [activeMachineIds]);

  const loadRows = useCallback(async () => {
    const response = await fetch("/api/erp/planning?scope=workbench&pageSize=50000", { cache: "no-store" });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(apiMessage(payload));
    setRows(payload as ErpPlanningQueryResult);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setIsLoadingOverview(true); setError(null);
      void loadOverview().catch((nextError) => { if (active) setError(nextError instanceof Error ? nextError.message : "Le tableau de bord ERP est indisponible."); }).finally(() => { if (active) setIsLoadingOverview(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [loadOverview]);

  useEffect(() => {
    if (!planningViews.isReady) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setIsLoadingRows(true); setError(null);
      void loadRows().catch((nextError) => { if (active) setError(nextError instanceof Error ? nextError.message : "Le Planning ERP est indisponible."); }).finally(() => { if (active) setIsLoadingRows(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [loadRows, planningViews.isReady]);

  function changeView(next: WorkspaceView) { setView(next); setPage(1); }

  async function importFiles(files: File[]) {
    if (files.length !== 2) { setError("Sélectionnez les deux exports Excel en même temps."); return; }
    setIsMutating(true); setError(null); setNotice(null);
    const formData = new FormData(); files.forEach((file) => formData.append("files", file));
    try {
      const response = await fetch("/api/erp/imports", { method: "POST", body: formData });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiMessage(payload));
      setNotice("Import terminé. Les ajustements manuels précédents ont été conservés.");
      await Promise.all([loadOverview(), loadRows()]);
    } catch (nextError) {
      console.error("[ERP IMPORT] POST failed", nextError);
      setError(nextError instanceof Error ? nextError.message : "L’import a échoué.");
    }
    finally { setIsMutating(false); }
  }

  async function updateOperation(id: string, patch: Record<string, unknown>) {
    setIsMutating(true); setError(null);
    try {
      const response = await fetch(`/api/erp/operations/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiMessage(payload));
      setNotice("Ajustement local enregistré. Il sera conservé au prochain import.");
      await Promise.all([loadOverview(), loadRows()]);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "La modification a échoué."); }
    finally { setIsMutating(false); }
  }

  async function saveMapping(code: string, machineId: string) {
    const target = machines.find((entry) => entry.id === machineId);
    if (!target || !window.confirm(`Associer définitivement le code ERP ${code} à la machine ${target.displayName} ? Les futurs imports réutiliseront cette correspondance.`)) return;
    setIsMutating(true); setError(null);
    try {
      const response = await fetch("/api/erp/machine-mappings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ erpMachineCode: code, machineId }) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiMessage(payload));
      setNotice(`Le code ERP ${code} est désormais associé à ${target.displayName}.`);
      await Promise.all([loadOverview(), loadRows()]);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "La correspondance n’a pas été enregistrée."); }
    finally { setIsMutating(false); }
  }

  async function openWorkOrder(id: string) {
    setIsMutating(true); setError(null);
    try {
      const response = await fetch(`/api/erp/planning?search=${encodeURIComponent(id)}&sort=work-order&pageSize=200&include=work-order-details`, { cache: "no-store" });
      const payload = await response.json() as ErpPlanningQueryResult;
      if (!response.ok) throw new Error(apiMessage(payload));
      setSelectedOf({ id, rows: payload.rows.filter((row) => row.workOrderId === id) });
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "L’OF n’a pas pu être ouvert."); }
    finally { setIsMutating(false); }
  }

  const activeImport = overview?.activeImport;
  const allOperations = useMemo(() => rows?.rows ?? [], [rows?.rows]);
  const filterOptions = useMemo(() => filterEngine.options(allOperations), [allOperations]);
  const effectiveFilters = useMemo(() => view === "unmapped" ? { ...activePlanningView.filters, technicalStates: ["without-machine" as const] } : activePlanningView.filters, [activePlanningView.filters, view]);
  const filteredOperations = useMemo(() => sortOperationViews(filterEngine.apply(allOperations, effectiveFilters), activePlanningView.sort), [activePlanningView.sort, allOperations, effectiveFilters]);
  const localPageSize = 100;
  const displayedRows = useMemo<ErpPlanningQueryResult>(() => ({ rows: filteredOperations.slice((page - 1) * localPageSize, page * localPageSize), total: filteredOperations.length, page, pageSize: localPageSize }), [filteredOperations, page]);
  return <div className="space-y-5">
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--app-border)] bg-white p-1" aria-label="Vues du Planning ERP">
      {VIEW_LABELS.map((item) => <button key={item.id} type="button" className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${view === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => changeView(item.id)}>{item.label}{item.id === "unmapped" && overview ? ` (${overview.metrics.unmappedOperations.toLocaleString("fr-BE")})` : ""}</button>)}
    </nav>
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
    {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}
    {!activeImport && view !== "imports" ? <EmptyState title="Aucun export ERP importé" description="Ouvrez la vue Imports et sélectionnez ensemble les fichiers Top et Details." /> : null}
    {activeImport && view === "dashboard" ? <Dashboard overview={overview!} onNavigate={changeView} /> : null}
    {activeImport && (view === "operations" || view === "unmapped") ? <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"><PlanningFilterPanel filters={effectiveFilters} options={filterOptions} resultCount={filteredOperations.length} totalCount={allOperations.length} onChange={(filters) => { planningViews.updateActiveView((current) => ({ ...current, filters })); setPage(1); }} /><ErpPlanningOperations rows={displayedRows} machines={machines} activeView={activePlanningView} views={planningViews.state.views} persistenceError={planningViews.persistenceError} page={page} busy={busy} unmappedOnly={view === "unmapped"} onSelectView={(viewId) => { planningViews.selectView(viewId); setPage(1); }} onUpdateView={planningViews.updateActiveView} onSaveViewAs={planningViews.saveAs} onRenameView={planningViews.renameActive} onDeleteView={planningViews.deleteActive} onResetView={planningViews.resetActive} onPage={setPage} onUpdateOperation={updateOperation} onOpenWorkOrder={openWorkOrder} /></div> : null}
    {activeImport && view === "quality" ? <QualityView overview={overview!} onNavigate={(category) => changeView(category === "missing-machine" ? "unmapped" : "operations")} /> : null}
    {view === "imports" ? <ImportsView overview={overview} busy={busy} onImport={importFiles} onMap={saveMapping} machines={machines} /> : null}
    {selectedOf ? <WorkOrderDialog selection={selectedOf} onClose={() => setSelectedOf(null)} /> : null}
  </div>;
}

function Dashboard({ overview, onNavigate }: { overview: ErpPlanningOverview; onNavigate: (view: WorkspaceView) => void }) {
  const cards = [
    ["OF importés", overview.metrics.workOrders, "operations"], ["Opérations", overview.metrics.operations, "operations"],
    ["Opérations en retard", overview.metrics.lateOperations, "operations"], ["Machines non définies", overview.metrics.unmappedOperations, "unmapped"],
    ["Opérations terminées", overview.metrics.completedOperations, "operations"], ["Articles dans plusieurs OF", overview.metrics.multiWorkOrderArticles, "operations"],
    ["OF partageant un article", overview.metrics.workOrdersInMultipleArticles, "operations"], ["Qualité des données", `${overview.metrics.qualityScore}/100`, "quality"],
  ] as const;
  return <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, target]) => <button key={label} type="button" onClick={() => onNavigate(target)} className="rounded-2xl border border-[var(--app-border)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString("fr-BE") : value}</p></button>)}</section><section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="font-semibold">Dernière synchronisation ERP</h2><p className="mt-2 text-sm text-slate-600">Import du {formatEuropeanDate(overview.activeImport!.importedAt, true)} · {overview.activeImport!.files.map((file) => `${file.name} (${file.rowCount.toLocaleString("fr-BE")} lignes)`).join(" · ")}</p><p className="mt-3 text-xs text-slate-500">Projection locale en lecture seule vis-à-vis de l’ERP. Aucun temps de fabrication n’entre dans ce cockpit.</p></section></>;
}

function QualityView({ overview, onNavigate }: { overview: ErpPlanningOverview; onNavigate: (category: string) => void }) {
  return <section className="grid gap-4 lg:grid-cols-[240px_1fr]"><div className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><p className="text-xs font-bold uppercase text-slate-500">Score global</p><p className="mt-2 text-5xl font-bold">{overview.metrics.qualityScore}<span className="text-base text-slate-400">/100</span></p><p className="mt-3 text-xs text-slate-500">Score de vigilance calculé sur la projection active. Il ne corrige jamais l’ERP.</p></div><div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Anomalie</th><th className="p-3">Nombre</th><th className="p-3">Pourcentage</th><th className="p-3">Gravité</th></tr></thead><tbody>{overview.issueCounts.map((issue) => <tr key={issue.category} className="border-t border-slate-100"><td className="p-3"><button className="font-semibold text-[var(--app-primary)] hover:underline" onClick={() => onNavigate(issue.category)}>{QUALITY_LABELS[issue.category] ?? issue.category}</button></td><td className="p-3 tabular-nums">{issue.count.toLocaleString("fr-BE")}</td><td className="p-3">{overview.metrics.operations ? (issue.count / overview.metrics.operations * 100).toLocaleString("fr-BE", { maximumFractionDigits: 1 }) : "0"} %</td><td className="p-3"><StatusPill tone={issue.category === "missing-work-order" || issue.category === "duplicate-operation" ? "danger" : "warning"}>{issue.category === "missing-work-order" ? "Bloquante" : "À corriger"}</StatusPill></td></tr>)}</tbody></table></div></section>;
}

function ImportsView({ overview, busy, onImport, onMap, machines }: { overview: ErpPlanningOverview | null; busy: boolean; onImport: (files: File[]) => Promise<void>; onMap: (code: string, machineId: string) => void; machines: ReturnType<typeof useSettings>["settings"]["production"]["machines"] }) {
  const [files, setFiles] = useState<File[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!selectedFiles.length) return;
    setFiles(selectedFiles);
    await onImport(selectedFiles);
  }
  return <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="text-lg font-semibold">Nouvel import</h2><p className="mt-2 text-sm text-slate-600">Sélectionnez ensemble <strong>REQ_MacroGamme_Top.xlsx</strong> et <strong>REQ_MacroGamme_Details.xlsx</strong>. Les fichiers sont reconnus par leur nom et leurs colonnes.</p><input ref={fileInputRef} className="sr-only" type="file" accept=".xlsx" multiple onChange={(event) => void handleFileSelection(event)} /><ul className="mt-3 space-y-1 text-xs text-slate-500">{files.map((file) => <li key={`${file.name}-${file.size}`}>{file.name} · {(file.size / 1024).toLocaleString("fr-BE", { maximumFractionDigits: 0 })} Ko</li>)}</ul><button type="button" className={`${primaryButton} mt-4`} disabled={busy} onClick={() => fileInputRef.current?.click()}>{busy ? "Contrôle en cours…" : "Contrôler et importer"}</button><p className="mt-3 text-xs text-slate-500">Les sources sont archivées localement en lecture seule. Un doublon binaire exact est refusé.</p></section><section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="text-lg font-semibold">Historique</h2><div className="mt-3 space-y-2">{overview?.imports.length ? overview.imports.map((entry) => <article key={entry.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><strong>{formatEuropeanDate(entry.importedAt, true)}</strong><StatusPill tone="success">Accepté</StatusPill></div><p className="mt-1 text-xs text-slate-500">{entry.workOrderCount.toLocaleString("fr-BE")} OF · {entry.operationCount.toLocaleString("fr-BE")} opérations · {entry.linkedOperationCount.toLocaleString("fr-BE")} liées</p></article>) : <p className="text-sm text-slate-500">Aucun import enregistré.</p>}</div></section>{overview?.machineCodes.length ? <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5 xl:col-span-2"><h2 className="text-lg font-semibold">Correspondances machines ERP → ProdPilot</h2><p className="mt-1 text-sm text-slate-600">Une correspondance confirmée sera réutilisée automatiquement lors des prochains imports.</p><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{overview.machineCodes.map((entry) => <div key={entry.code} className="grid grid-cols-[1fr_1.5fr_auto] items-center gap-2 rounded-xl border border-slate-200 p-3"><div><strong>ERP {entry.code || "vide"}</strong><p className="text-xs text-slate-500">{entry.operationCount.toLocaleString("fr-BE")} opérations</p></div><select className={fieldClass} value={selections[entry.code] ?? entry.machineId ?? ""} onChange={(event) => setSelections((current) => ({ ...current, [entry.code]: event.target.value }))}><option value="">Non définie</option>{machines.filter((machine) => machine.active && !machine.deleted).map((machine) => <option key={machine.id} value={machine.id}>{machine.displayName}</option>)}</select><button className={secondaryButton} disabled={!selections[entry.code] || selections[entry.code] === entry.machineId} onClick={() => onMap(entry.code, selections[entry.code])}>Associer</button></div>)}</div></section> : null}</div>;
}

function WorkOrderDialog({ selection, onClose }: { selection: { id: string; rows: OperationView[] }; onClose: () => void }) {
  const orderReference = selection.rows[0]?.workOrder;
  const order = orderReference && "orderLines" in orderReference ? orderReference : null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="erp-of-title" className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-[var(--app-primary)]">Ordre de fabrication</p><h2 id="erp-of-title" className="mt-1 text-2xl font-bold">OF {selection.id}</h2></div><button className={secondaryButton} onClick={onClose}>Fermer</button></div>{order ? <><dl className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Client" value={order.customerName} /><Detail label="Article" value={order.articleCode} /><Detail label="Description" value={order.description ?? "—"} /><Detail label="Commande" value={`${order.customerOrderNumber} / ${order.customerOrderLine}`} /><Detail label="Quantité" value={order.quantity.toLocaleString("fr-BE")} /><Detail label="Date demandée" value={formatDate(order.requestedDueDate)} /><Detail label="Date confirmée" value={formatDate(order.confirmedDueDate)} /><Detail label="Statut" value={order.status ?? "—"} /></dl>{order.orderLines.length > 1 ? <div className="mt-4 overflow-x-auto"><h3 className="mb-2 text-sm font-semibold">{order.orderLines.length} lignes Top associées</h3><table className="w-full min-w-[700px] text-left text-xs"><thead className="text-slate-500"><tr><th className="p-2">Commande / poste</th><th className="p-2">Référence</th><th className="p-2">Quantité</th><th className="p-2">Demandée</th><th className="p-2">Confirmée</th></tr></thead><tbody>{order.orderLines.map((line) => <tr key={line.sourceRow} className="border-t border-slate-100"><td className="p-2">{line.customerOrderNumber} / {line.customerOrderLine}</td><td className="p-2">{line.customerReference || "—"}</td><td className="p-2">{line.quantity.toLocaleString("fr-BE")}</td><td className="p-2">{formatDate(line.requestedDueDate)}</td><td className="p-2">{formatDate(line.confirmedDueDate)}</td></tr>)}</tbody></table></div> : null}</> : <p className="mt-4 text-sm text-red-700">Cet OF est absent du fichier Top : l’opération est orpheline.</p>}<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">Opération</th><th className="p-3">Tâche</th><th className="p-3">Machine ERP</th><th className="p-3">Date</th><th className="p-3">Priorité / score</th><th className="p-3">Statut</th></tr></thead><tbody>{selection.rows.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="p-3">{row.operationNumber}</td><td className="p-3">{row.taskCode || "—"}</td><td className="p-3">{row.erpMachineCode || "—"}</td><td className="p-3">{formatDate(row.plannedDate)}</td><td className="p-3">{row.effectivePriority} / <strong>{row.priorityScore}</strong></td><td className="p-3">{STATUS_OPTIONS.find((entry) => entry.value === row.effectiveStatus)?.label}</td></tr>)}</tbody></table></div></section></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>; }
function formatDate(value: string | null): string { return value ? new Intl.DateTimeFormat("fr-BE", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "—"; }
function apiMessage(payload: unknown): string { return isRecord(payload) && typeof payload.message === "string" ? payload.message : "Le serveur a retourné une réponse inattendue."; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

function sortOperationViews(operations: OperationView[], sort: "priority" | "due-date" | "work-order" | "machine" | "client" | "article"): OperationView[] {
  return [...operations].sort((a, b) => {
    if (sort === "due-date") return (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999") || b.priorityScore - a.priorityScore;
    if (sort === "work-order") return a.workOrderId.localeCompare(b.workOrderId, "fr", { numeric: true }) || a.operationNumber - b.operationNumber;
    if (sort === "machine") return a.machine.localeCompare(b.machine, "fr", { numeric: true }) || b.priorityScore - a.priorityScore;
    if (sort === "client") return (a.workOrder?.customerName ?? "zzzz").localeCompare(b.workOrder?.customerName ?? "zzzz", "fr") || b.priorityScore - a.priorityScore;
    if (sort === "article") return a.articleCode.localeCompare(b.articleCode, "fr", { numeric: true }) || b.priorityScore - a.priorityScore;
    return b.priorityScore - a.priorityScore || (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999");
  });
}

const STATUS_OPTIONS: Array<{ value: ErpOperationStatus; label: string }> = [
  { value: "not-started", label: "À faire" }, { value: "in-progress", label: "En cours" },
  { value: "completed", label: "Terminée" }, { value: "blocked", label: "Bloquée" }, { value: "unknown", label: "À qualifier" },
];

const QUALITY_LABELS: Record<string, string> = {
  "missing-machine": "OF sans machine", "missing-date": "OF sans délai", "missing-priority": "Priorité à zéro",
  "missing-task": "Opérations sans code tâche", "unknown-macro-range": "Macro gamme inconnue", "missing-customer": "Client inconnu",
  "missing-article": "Article inconnu", "missing-reference": "Référence manquante", "missing-work-order": "Opérations orphelines",
  "work-order-without-operation": "OF sans opération", "duplicate-operation": "Doublons", "invalid-date": "Date incohérente",
  "invalid-quantity": "Quantité à zéro", "suspect-quantity": "Quantité 9999", "inconsistent-article": "Article incohérent", "unknown-status": "Statut inconnu",
};
