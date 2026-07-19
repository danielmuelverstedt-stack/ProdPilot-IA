"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, fieldClass, formatEuropeanDate, ModuleHeader, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import type { ErpPlanningOverview } from "@/features/erp-import/types/erp-import";
import { useSettings } from "@/features/settings/components/SettingsProvider";

export function ErpQualityModule() {
  const { settings } = useSettings();
  const validMachineIds = useMemo(() => new Set(settings.production.machines.filter((machine) => machine.active && !machine.deleted).map((machine) => machine.id)), [settings.production.machines]);
  const [overview, setOverview] = useState<ErpPlanningOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/erp/imports", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload?.message === "string" ? payload.message : "Le contrôle ERP est indisponible.");
      if (active) {
        const next = payload as ErpPlanningOverview;
        next.metrics.unmappedOperations = next.machineCodes.filter((entry) => !entry.machineId || !validMachineIds.has(entry.machineId)).reduce((sum, entry) => sum + entry.operationCount, 0);
        setOverview(next);
      }
    }).catch((nextError: unknown) => { if (active) setError(nextError instanceof Error ? nextError.message : "Le contrôle ERP est indisponible."); });
    return () => { active = false; };
  }, [validMachineIds]);

  return <div className="mx-auto max-w-7xl">
    <ModuleHeader eyebrow="Fiabilité des données" title="Qualité des données ERP" description="Contrôles calculés sur le dernier import réel. Les corrections restent locales : aucune écriture n’est effectuée dans l’ERP." actions={<Link href="/planning" className={secondaryButton}>Ouvrir le cockpit Planning</Link>} />
    {error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
    {!overview ? <p className="mt-6 text-sm text-slate-500">Chargement des contrôles…</p> : overview.activeImport ? <RealQualityDashboard overview={overview} /> : <div className="mt-6"><EmptyState title="Aucun import ERP" description="Importez d’abord les deux exports depuis le cockpit Planning." /></div>}
    <DemoQualityArchive />
  </div>;
}

function RealQualityDashboard({ overview }: { overview: ErpPlanningOverview }) {
  return <><section className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Score qualité" value={`${overview.metrics.qualityScore}/100`} /><Metric label="Anomalies machine" value={overview.metrics.unmappedOperations.toLocaleString("fr-BE")} /><Metric label="Dernier import" value={new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(overview.activeImport!.importedAt))} /></section><div className="mt-5 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Contrôle</th><th className="p-4">Nombre</th><th className="p-4">Part des opérations</th><th className="p-4">Impact</th><th className="p-4">Action</th></tr></thead><tbody>{overview.issueCounts.map((issue) => <tr key={issue.category} className="border-t border-slate-100"><td className="p-4 font-semibold">{LABELS[issue.category] ?? issue.category}</td><td className="p-4 tabular-nums">{issue.count.toLocaleString("fr-BE")}</td><td className="p-4">{overview.metrics.operations ? (issue.count / overview.metrics.operations * 100).toLocaleString("fr-BE", { maximumFractionDigits: 1 }) : "0"} %</td><td className="p-4"><StatusPill tone={issue.category === "missing-work-order" || issue.category === "duplicate-operation" ? "danger" : "warning"}>{issue.category === "missing-work-order" ? "Liaison impossible" : "Pilotage dégradé"}</StatusPill></td><td className="p-4"><Link href="/planning" className="font-semibold text-[var(--app-primary)] hover:underline">Corriger dans le Planning</Link></td></tr>)}</tbody></table></div></>;
}

function DemoQualityArchive() {
  const data = useDemoData();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("Toutes");
  const [status, setStatus] = useState("Tous");
  const issues = useMemo(() => data.erpQuality.filter((issue) => {
    const order = data.workOrders.find((item) => item.id === issue.workOrderId);
    const text = `${issue.workOrderId} ${order?.customer ?? ""} ${order?.article ?? ""} ${issue.problemType}`.toLocaleLowerCase("fr");
    return text.includes(search.toLocaleLowerCase("fr")) && (severity === "Toutes" || issue.severity === severity) && (status === "Tous" || issue.status === status);
  }), [data.erpQuality, data.workOrders, search, severity, status]);
  return <details className="mt-6 rounded-2xl border border-[var(--app-border)] bg-white p-5"><summary className="cursor-pointer font-semibold">Contrôles de démonstration historiques</summary><p className="mt-2 text-xs text-slate-500">Cette section conserve les scénarios et fiches de démonstration existants ; elle est séparée des exports réels.</p><div className="mt-4 grid gap-2 sm:grid-cols-3"><input className={fieldClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="OF, client, problème…" /><select className={fieldClass} value={severity} onChange={(event) => setSeverity(event.target.value)}><option>Toutes</option>{["Faible", "Moyenne", "Élevée", "Bloquante"].map((item) => <option key={item}>{item}</option>)}</select><select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value)}><option>Tous</option>{["Détectée", "Envoyée", "Résolue"].map((item) => <option key={item}>{item}</option>)}</select></div><div className="mt-4 grid gap-3">{issues.length ? issues.map((issue) => { const order = data.workOrders.find((item) => item.id === issue.workOrderId); return <Link href={`/qualite-erp/${issue.id}`} key={issue.id} className="grid gap-2 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 md:grid-cols-[1fr_1fr_130px_110px] md:items-center"><div><strong>{issue.workOrderId}</strong><p className="text-xs text-slate-500">{order?.customer} · {order?.article}</p></div><div><strong className="text-sm">{issue.problemType}</strong><p className="text-xs text-slate-500">{issue.responsible}</p></div><StatusPill tone={issue.severity === "Bloquante" || issue.severity === "Élevée" ? "danger" : "warning"}>{issue.severity}</StatusPill><div><StatusPill tone={issue.status === "Résolue" ? "success" : issue.status === "Envoyée" ? "info" : "neutral"}>{issue.status}</StatusPill><p className="mt-1 text-xs text-slate-500">{formatEuropeanDate(issue.detectedAt)}</p></div></Link>; }) : <EmptyState title="Aucune anomalie" description="Aucun scénario de démonstration ne correspond aux filtres." />}</div></details>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>; }

const LABELS: Record<string, string> = {
  "missing-machine": "OF sans machine", "missing-date": "OF sans délai", "missing-priority": "Priorité à zéro", "missing-task": "Opérations sans code tâche",
  "unknown-macro-range": "Macro gamme inconnue", "missing-customer": "Client inconnu", "missing-article": "Article inconnu", "missing-reference": "Référence manquante",
  "missing-work-order": "Opérations orphelines", "work-order-without-operation": "OF sans opération", "duplicate-operation": "Doublons exacts", "invalid-date": "Date incohérente",
  "invalid-quantity": "Quantité à zéro", "suspect-quantity": "Quantité 9999", "inconsistent-article": "Article incohérent", "unknown-status": "Statut ERP à qualifier",
};
