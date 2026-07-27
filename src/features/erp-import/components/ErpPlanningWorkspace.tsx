"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorBanner, formatEuropeanDate, primaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { ErpPlanningOperations } from "@/features/erp-import/components/ErpPlanningOperations";
import { ErpMachineMappingsPanel } from "@/features/erp-import/components/ErpMachineMappingsPanel";
import { PlanningFilterPanel } from "@/features/erp-import/components/PlanningFilterPanel";
import { useErpPlanningViews } from "@/features/erp-import/hooks/useErpPlanningViews";
import { filterEngine } from "@/features/erp-import/services/filter-engine";
import { createErpPlanningDataBusSourceId, notifyErpPlanningDataChanged, subscribeErpPlanningDataChange } from "@/features/erp-import/services/erp-planning-data-bus";
import { reconcileOperationViewMachineCatalog } from "@/features/erp-import/services/erp-machine-mapping-status";
import { applyTaskCategoryVisibility } from "@/features/erp-import/services/task-category-visibility";
import { applyOperationPatchLocally, isLocallyPatchable, type OperationViewLocalPatch } from "@/features/erp-import/services/operation-view-local-patch";
import { fetchErpPlanningRows, invalidateErpPlanningRowsCache } from "@/features/erp-import/services/erp-planning-rows-fetch-cache";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { machineSettingsService } from "@/features/settings/services/machine-settings-service";
import { setVisibleTaskCategoryCodes, useVisibleTaskCategoryCodes } from "@/lib/visible-task-categories-store";
import type { ErpPlanningOverview, ErpPlanningQueryResult, OperationView } from "@/features/erp-import/types/erp-import";

type WorkspaceView = "dashboard" | "operations" | "unmapped" | "quality" | "imports";

const VIEW_LABELS: Array<{ id: WorkspaceView; label: string }> = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "operations", label: "Opérations" },
  { id: "unmapped", label: "OF sans machine" },
  { id: "quality", label: "Qualité ERP" },
  { id: "imports", label: "Imports" },
];

export function ErpPlanningWorkspace() {
  const { settings, updateSettings } = useSettings();
  // Réglage partagé « catégories visibles », dans son propre stockage rapide (pas dans les Réglages
  // partagés) : voir src/lib/visible-task-categories-store.ts.
  const visibleTaskCategoryCodes = useVisibleTaskCategoryCodes();
  const machines = useMemo(() => [...settings.production.machines].sort((a, b) => a.order - b.order), [settings.production.machines]);
  const activeMachineIds = useMemo(() => machines.filter((entry) => entry.active && entry.visible && !entry.deleted).map((entry) => entry.id), [machines]);
  const currentUser = useMemo(() => settings.users.find((entry) => entry.active && entry.roleId === settings.activeRoleId) ?? settings.users.find((entry) => entry.active) ?? settings.users[0], [settings.activeRoleId, settings.users]);
  const preferenceContext = useMemo(() => ({ companyId: "local-development-company", siteId: "default-site", userId: currentUser?.id ?? "local-development-user" }), [currentUser?.id]);
  const planningViews = useErpPlanningViews(preferenceContext);
  const activePlanningView = planningViews.activeView;
  const [view, setView] = useState<WorkspaceView>("dashboard");
  const [overview, setOverview] = useState<ErpPlanningOverview | null>(null);
  // Réconciliées avec le référentiel machine, mais pas encore filtrées par catégorie visible : voir
  // `rows` ci-dessous. Séparé pour que changer de catégorie (y compris depuis l'Atelier, réglage
  // partagé) ne redéclenche jamais `reconcileOperationViewMachineCatalog` sur ~23 000 lignes tant
  // que ce cockpit reste monté en arrière-plan (le Workspace Planning garde ses onglets visités).
  const [reconciledRows, setReconciledRows] = useState<OperationView[] | null>(null);
  const rows = useMemo(() => reconciledRows ? applyTaskCategoryVisibility(reconciledRows, visibleTaskCategoryCodes) : null, [reconciledRows, visibleTaskCategoryCodes]);
  const [page, setPage] = useState(1);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  const migrationInProgress = useRef(false);
  const dataBusSourceId = useRef(createErpPlanningDataBusSourceId());
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
    const nextRows = await fetchErpPlanningRows();
    setReconciledRows(reconcileOperationViewMachineCatalog(nextRows, machines));
  }, [machines]);

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
    if (!overview?.legacyMachineStates.length || migrationInProgress.current) return;
    const knownIds = new Set(machines.map((machine) => machine.id));
    const states = overview.legacyMachineStates.filter((state) => knownIds.has(state.machineId));
    if (!states.length) return;
    migrationInProgress.current = true;
    updateSettings((draft) => { machineSettingsService.migrateLegacyErpStates(draft, states); }, "États machines ERP hérités migrés vers les fiches machines");
    void fetch("/api/erp/machine-mappings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completeLegacyMachineStateMigration: true, machineIds: states.map((state) => state.machineId) }) })
      .then((response) => { if (!response.ok) throw new Error("La finalisation de la migration ERP a échoué."); return loadOverview(); })
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "La migration des états machines a échoué."))
      .finally(() => { migrationInProgress.current = false; });
  }, [loadOverview, machines, overview, updateSettings]);

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

  useEffect(() => subscribeErpPlanningDataChange((changedSourceId) => {
    if (changedSourceId === dataBusSourceId.current) return;
    void loadOverview(); void loadRows();
  }), [loadOverview, loadRows]);

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
      invalidateErpPlanningRowsCache();
      await Promise.all([loadOverview(), loadRows()]);
      notifyErpPlanningDataChanged(dataBusSourceId.current);
    } catch (nextError) {
      console.error("[ERP IMPORT] POST failed", nextError);
      setError(nextError instanceof Error ? nextError.message : "L’import a échoué.");
    }
    finally { setIsMutating(false); }
  }

  const patchOperationRemote = useCallback(async (id: string, patch: Record<string, unknown>) => {
    const response = await fetch(`/api/erp/operations/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(apiMessage(payload));
  }, []);

  /**
   * Les champs gérés par `applyOperationPatchLocally` (priorité, machine, date, statut,
   * commentaire) sont appliqués immédiatement à la seule opération concernée, sans recharger
   * les ~23 000 lignes du Planning : le PATCH réel part en arrière-plan, et seule une erreur
   * restaure la valeur précédente. Un champ non géré localement (aujourd'hui : visible, locked)
   * retombe sur l'ancien comportement (rechargement complet), en filet de sécurité.
   */
  const updateOperation = useCallback(async (id: string, patch: Record<string, unknown>) => {
    if (isLocallyPatchable(patch)) {
      const localPatch = patch as OperationViewLocalPatch;
      let previous: OperationView | undefined;
      setReconciledRows((current) => current ? current.map((row) => {
        if (row.id !== id) return row;
        previous = row;
        return applyOperationPatchLocally(row, localPatch);
      }) : current);
      setError(null);
      try {
        await patchOperationRemote(id, patch);
        invalidateErpPlanningRowsCache();
        setNotice("Ajustement local enregistré. Il sera conservé au prochain import.");
        notifyErpPlanningDataChanged(dataBusSourceId.current);
      } catch (nextError) {
        if (previous) { const restored = previous; setReconciledRows((current) => current ? current.map((row) => row.id === id ? restored : row) : current); }
        setError(nextError instanceof Error ? nextError.message : "La modification a échoué.");
      }
      return;
    }
    setIsMutating(true); setError(null);
    try {
      await patchOperationRemote(id, patch);
      invalidateErpPlanningRowsCache();
      setNotice("Ajustement local enregistré. Il sera conservé au prochain import.");
      await Promise.all([loadOverview(), loadRows()]);
      notifyErpPlanningDataChanged(dataBusSourceId.current);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "La modification a échoué."); }
    finally { setIsMutating(false); }
  }, [loadOverview, loadRows, patchOperationRemote]);

  async function saveMapping(code: string, machineId: string) {
    const target = machines.find((entry) => entry.id === machineId);
    if (!target || !window.confirm(`Associer définitivement le code ERP ${code} à la machine ${target.displayName} ? Les futurs imports réutiliseront cette correspondance.`)) return;
    setIsMutating(true); setError(null);
    try {
      const response = await fetch("/api/erp/machine-mappings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ erpMachineCode: code, machineId }) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiMessage(payload));
      setNotice(`Le code ERP ${code} est désormais associé à ${target.displayName}.`);
      invalidateErpPlanningRowsCache();
      await Promise.all([loadOverview(), loadRows()]);
      notifyErpPlanningDataChanged(dataBusSourceId.current);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "La correspondance n’a pas été enregistrée."); }
    finally { setIsMutating(false); }
  }

  async function deleteMapping(code: string) {
    if (!window.confirm(`Supprimer la correspondance du code ERP ${code} ? Les opérations concernées redeviendront non définies.`)) return;
    setIsMutating(true); setError(null);
    try {
      const response = await fetch("/api/erp/machine-mappings", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ erpMachineCode: code }) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiMessage(payload));
      setNotice(`La correspondance du code ERP ${code} a été supprimée.`);
      invalidateErpPlanningRowsCache();
      await Promise.all([loadOverview(), loadRows()]);
      notifyErpPlanningDataChanged(dataBusSourceId.current);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "La correspondance n’a pas été supprimée."); }
    finally { setIsMutating(false); }
  }

  const openWorkOrder = useCallback((id: string) => {
    router.push(`/of/${id}`);
  }, [router]);

  const activeImport = overview?.activeImport;
  const allOperations = useMemo(() => rows ?? [], [rows]);
  const filterOptions = useMemo(() => filterEngine.options(allOperations), [allOperations]);
  const effectiveFilters = useMemo(() => view === "unmapped" ? { ...activePlanningView.filters, technicalStates: ["without-machine" as const] } : activePlanningView.filters, [activePlanningView.filters, view]);
  const filteredOperations = useMemo(() => sortOperationViews(filterEngine.apply(allOperations, effectiveFilters), activePlanningView.sort, activePlanningView.sortDirection), [activePlanningView.sort, activePlanningView.sortDirection, allOperations, effectiveFilters]);
  const localPageSize = 100;
  const displayedRows = useMemo<ErpPlanningQueryResult>(() => ({ rows: filteredOperations.slice((page - 1) * localPageSize, page * localPageSize), total: filteredOperations.length, page, pageSize: localPageSize }), [filteredOperations, page]);
  return <div className="space-y-5">
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--app-border)] bg-white p-1" aria-label="Vues du Planning ERP">
      {VIEW_LABELS.map((item) => <button key={item.id} type="button" className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${view === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => changeView(item.id)}>{item.label}{item.id === "unmapped" && overview ? ` (${overview.metrics.unmappedOperations.toLocaleString("fr-BE")})` : ""}</button>)}
    </nav>
    {error ? <ErrorBanner>{error}</ErrorBanner> : null}
    {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}
    {!activeImport && view !== "imports" ? <EmptyState title="Aucun export ERP importé" description="Ouvrez la vue Imports et sélectionnez ensemble les fichiers Top et Details." /> : null}
    {activeImport && view === "dashboard" ? <Dashboard overview={overview!} onNavigate={changeView} /> : null}
    {activeImport && (view === "operations" || view === "unmapped") ? <div className="space-y-4"><PlanningFilterPanel filters={effectiveFilters} options={filterOptions} resultCount={filteredOperations.length} totalCount={allOperations.length} visibleTaskCategoryCodes={visibleTaskCategoryCodes} onChange={(filters) => { planningViews.updateActiveView((current) => ({ ...current, filters })); setPage(1); }} onChangeVisibleTaskCategoryCodes={setVisibleTaskCategoryCodes} /><ErpPlanningOperations rows={displayedRows} machines={machines} activeView={activePlanningView} views={planningViews.state.views} persistenceError={planningViews.persistenceError} page={page} busy={busy} unmappedOnly={view === "unmapped"} onSelectView={(viewId) => { planningViews.selectView(viewId); setPage(1); }} onUpdateView={planningViews.updateActiveView} onSaveViewAs={planningViews.saveAs} onRenameView={planningViews.renameActive} onDeleteView={planningViews.deleteActive} onResetView={planningViews.resetActive} onPage={setPage} onUpdateOperation={updateOperation} onOpenWorkOrder={openWorkOrder} /></div> : null}
    {activeImport && view === "quality" ? <QualityView overview={overview!} onNavigate={(category) => changeView(category === "missing-machine" ? "unmapped" : "operations")} /> : null}
    {view === "imports" ? <ImportsView overview={overview} busy={busy} onImport={importFiles} onMap={saveMapping} onDeleteMapping={deleteMapping} machines={machines} /> : null}
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

function ImportsView({ overview, busy, onImport, onMap, onDeleteMapping, machines }: { overview: ErpPlanningOverview | null; busy: boolean; onImport: (files: File[]) => Promise<void>; onMap: (code: string, machineId: string) => Promise<void>; onDeleteMapping: (code: string) => Promise<void>; machines: ReturnType<typeof useSettings>["settings"]["production"]["machines"] }) {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!selectedFiles.length) return;
    setFiles(selectedFiles);
    await onImport(selectedFiles);
  }
  return <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="text-lg font-semibold">Nouvel import</h2><p className="mt-2 text-sm text-slate-600">Sélectionnez ensemble <strong>REQ_MacroGamme_Top.xlsx</strong> et <strong>REQ_MacroGamme_Details.xlsx</strong>. Les fichiers sont reconnus par leur nom et leurs colonnes.</p><input ref={fileInputRef} className="sr-only" type="file" accept=".xlsx" multiple onChange={(event) => void handleFileSelection(event)} /><ul className="mt-3 space-y-1 text-xs text-slate-500">{files.map((file) => <li key={`${file.name}-${file.size}`}>{file.name} · {(file.size / 1024).toLocaleString("fr-BE", { maximumFractionDigits: 0 })} Ko</li>)}</ul><button type="button" className={`${primaryButton} mt-4`} disabled={busy} onClick={() => fileInputRef.current?.click()}>{busy ? "Contrôle en cours…" : "Contrôler et importer"}</button><p className="mt-3 text-xs text-slate-500">Les sources sont archivées localement en lecture seule. Un doublon binaire exact est refusé.</p></section><section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="text-lg font-semibold">Historique</h2><div className="mt-3 space-y-2">{overview?.imports.length ? overview.imports.map((entry) => <article key={entry.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><strong>{formatEuropeanDate(entry.importedAt, true)}</strong><StatusPill tone="success">Accepté</StatusPill></div><p className="mt-1 text-xs text-slate-500">{entry.workOrderCount.toLocaleString("fr-BE")} OF · {entry.operationCount.toLocaleString("fr-BE")} opérations · {entry.linkedOperationCount.toLocaleString("fr-BE")} liées</p></article>) : <p className="text-sm text-slate-500">Aucun import enregistré.</p>}</div></section>{overview?.machineCodes.length ? <ErpMachineMappingsPanel entries={overview.machineCodes} machines={machines} busy={busy} onMap={onMap} onDelete={onDeleteMapping} /> : null}</div>;
}

function apiMessage(payload: unknown): string { return isRecord(payload) && typeof payload.message === "string" ? payload.message : "Le serveur a retourné une réponse inattendue."; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

function sortOperationViews(operations: OperationView[], sort: "priority" | "due-date" | "work-order" | "machine" | "client" | "article", direction: "asc" | "desc"): OperationView[] {
  const sorted = [...operations].sort((a, b) => {
    if (sort === "due-date") return (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999") || b.priorityScore - a.priorityScore;
    if (sort === "work-order") return a.workOrderId.localeCompare(b.workOrderId, "fr", { numeric: true }) || a.operationNumber - b.operationNumber;
    if (sort === "machine") return a.machine.localeCompare(b.machine, "fr", { numeric: true }) || b.priorityScore - a.priorityScore;
    if (sort === "client") return (a.workOrder?.customerName ?? "zzzz").localeCompare(b.workOrder?.customerName ?? "zzzz", "fr") || b.priorityScore - a.priorityScore;
    if (sort === "article") return a.articleCode.localeCompare(b.articleCode, "fr", { numeric: true }) || b.priorityScore - a.priorityScore;
    return b.priorityScore - a.priorityScore || (a.plannedDate ?? "9999").localeCompare(b.plannedDate ?? "9999");
  });
  // La direction ne réécrit jamais les comparateurs métier ci-dessus (tie-breaks affinés par mode) : un second clic sur l'en-tête inverse simplement le résultat déjà trié.
  return direction === "desc" ? sorted.reverse() : sorted;
}

const QUALITY_LABELS: Record<string, string> = {
  "missing-machine": "OF sans machine", "missing-date": "OF sans délai", "missing-priority": "Priorité à zéro",
  "missing-task": "Opérations sans code tâche", "unknown-macro-range": "Macro gamme inconnue", "missing-customer": "Client inconnu",
  "missing-article": "Article inconnu", "missing-reference": "Référence manquante", "missing-work-order": "Opérations orphelines",
  "work-order-without-operation": "OF sans opération", "duplicate-operation": "Doublons", "invalid-date": "Date incohérente",
  "invalid-quantity": "Quantité à zéro", "suspect-quantity": "Quantité 9999", "inconsistent-article": "Article incohérent", "unknown-status": "Statut inconnu",
};
