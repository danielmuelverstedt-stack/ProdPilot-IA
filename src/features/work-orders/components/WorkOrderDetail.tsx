"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { EmptyState, formatEuropeanDate, ModuleHeader, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { ActionFormDialog } from "@/features/actions/components/ActionFormDialog";
import { ERP_OPERATION_STATUS_LABELS, erpOperationDelayLabel, erpOperationDelayTone, erpOperationStatusTone } from "@/features/erp-import/services/erp-operation-status-presentation";
import { useErpImportActive } from "@/features/planning/hooks/useErpImportActive";
import type { ErpPlanningQueryResult, ErpWorkOrder, OperationView } from "@/features/erp-import/types/erp-import";

export function WorkOrderDetail({ id }: { id: string }) {
  const { hasActiveImport } = useErpImportActive();
  return hasActiveImport ? <ErpWorkOrderDetail id={id} /> : <DemoWorkOrderDetail id={id} />;
}

function DemoWorkOrderDetail({ id }: { id: string }) {
  const data = useDemoData();
  const order = data.workOrders.find((item) => item.id === id);
  const [creatingAction, setCreatingAction] = useState(false);
  if (!order) return <EmptyState title="OF introuvable" description="Cet ordre de fabrication n’existe pas dans la démonstration." />;
  const currentIndex = order.operations.findIndex((item) => item.status === "En cours" || item.status === "Bloquée");
  const current = order.operations[currentIndex >= 0 ? currentIndex : 0];
  const next = order.operations[currentIndex + 1];
  const linkedActions = data.actions.filter((item) => item.contextLink?.module === "workOrder" && item.contextLink.id === id);
  return <div className="mx-auto max-w-7xl"><ModuleHeader eyebrow={order.id} title={order.description} description={`${order.customer} · ${order.article} · ${order.project}`} actions={<><button className={primaryButton} onClick={() => setCreatingAction(true)}>Créer une action</button><Link href="/of" className={secondaryButton}>Retour aux OF</Link></>} />
    {creatingAction ? <ActionFormDialog origine="Planning" contextLink={{ module: "workOrder", id: order.id, label: order.id, href: `/of/${order.id}` }} onClose={() => setCreatingAction(false)} /> : null}
    <section className="mt-6 grid gap-4 rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Quantité" value={`${order.quantity} pièces`} /><Metric label="Priorité" value={<StatusPill tone={order.priority === "Urgente" || order.priority === "Bloquante" ? "danger" : "warning"}>{order.priority}</StatusPill>} /><Metric label="Échéance client" value={formatEuropeanDate(order.dueDate)} /><Metric label="Statut" value={order.status} /><Metric label="Progression" value={`${order.progress} %`} /><Metric label="Opération actuelle" value={current ? `${current.number} · ${current.description}` : "Aucune"} /><Metric label="Opération suivante" value={next ? `${next.number} · ${next.description}` : "Fin de gamme"} /><Metric label="Machine actuelle" value={current?.machineId ?? "Non définie"} /></section>
    <section className="mt-5 rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="text-lg font-semibold">Gamme complète</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">N°</th><th className="p-3">Opération</th><th className="p-3">Département</th><th className="p-3">Machine</th><th className="p-3">Durée</th><th className="p-3">Date</th><th className="p-3">Statut</th><th className="p-3">Quantité</th><th className="p-3">Blocage</th></tr></thead><tbody>{order.operations.map((operation) => <tr key={operation.id} className="border-b last:border-0"><td className="p-3 font-semibold">{operation.number}</td><td className="p-3">{operation.description}</td><td className="p-3">{operation.department}</td><td className="p-3">{operation.machineId ?? "—"}</td><td className="p-3">{operation.plannedDurationHours} h</td><td className="p-3">{operation.plannedDate ? formatEuropeanDate(operation.plannedDate) : "—"}</td><td className="p-3"><StatusPill tone={operation.status === "Bloquée" ? "danger" : operation.status === "Terminée" ? "success" : "info"}>{operation.status}</StatusPill></td><td className="p-3">{operation.completedQuantity} / {order.quantity}</td><td className="p-3 text-red-700">{operation.blockingIssue ?? "—"}</td></tr>)}</tbody></table></div></section>
    <div className="mt-5 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="font-semibold">Actions liées</h2><ul className="mt-3 space-y-2">{linkedActions.length ? linkedActions.map((action) => <li key={action.id}><Link className="block rounded-lg bg-slate-50 p-3 text-sm hover:bg-slate-100" href={`/actions/${action.id}`}><strong>{action.id} · {action.description}</strong><span className="mt-1 block text-xs text-slate-500">{action.responsable} · {action.statut}</span></Link></li>) : <li className="text-sm text-slate-500">Aucune action liée.</li>}</ul></section><section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="font-semibold">Problèmes de données</h2><ul className="mt-3 space-y-2 text-sm">{order.dataProblems.length ? order.dataProblems.map((problem) => <li className="rounded-lg bg-amber-50 p-3 text-amber-800" key={problem}>{problem}</li>) : <li className="text-slate-500">Aucun problème détecté.</li>}</ul><h3 className="mt-5 font-semibold">Historique</h3>{order.history.map((entry) => <p key={entry.id} className="mt-2 text-sm text-slate-600">{formatEuropeanDate(entry.date, true)} · {entry.description}</p>)}</section></div>
  </div>;
}

function ErpWorkOrderDetail({ id }: { id: string }) {
  const data = useDemoData();
  const [state, setState] = useState<{ rows: OperationView[]; workOrder: ErpWorkOrder | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingAction, setCreatingAction] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setIsLoading(true);
      setError(null);
      void fetch(`/api/erp/planning?search=${encodeURIComponent(id)}&sort=work-order&pageSize=200&include=work-order-details`, { cache: "no-store" })
        .then(async (response) => {
          const payload: unknown = await response.json();
          if (!response.ok) throw new Error(apiMessage(payload));
          const rows = (payload as ErpPlanningQueryResult).rows.filter((row) => row.workOrderId === id);
          const workOrderReference = rows[0]?.workOrder;
          const workOrder = workOrderReference && "orderLines" in workOrderReference ? workOrderReference : null;
          if (active) setState({ rows, workOrder });
        })
        .catch((nextError: unknown) => { if (active) setError(nextError instanceof Error ? nextError.message : "L’OF n’a pas pu être chargé."); })
        .finally(() => { if (active) setIsLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [id]);

  if (isLoading) return <EmptyState title="Chargement…" description="Récupération de l’OF depuis la projection ERP." />;
  if (error) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>;
  if (!state || !state.rows.length) return <EmptyState title="OF introuvable" description="Cet ordre de fabrication n’existe pas dans la projection ERP active." />;

  const { rows, workOrder } = state;
  const current = rows.find((row) => row.effectiveStatus === "blocked") ?? rows.find((row) => row.effectiveStatus === "in-progress") ?? rows[0];
  const next = rows[rows.findIndex((row) => row.id === current.id) + 1];
  const completedCount = rows.filter((row) => row.effectiveStatus === "completed").length;
  const progress = rows.length ? Math.round((completedCount / rows.length) * 100) : 0;
  const linkedActions = data.actions.filter((item) => item.contextLink?.module === "workOrder" && item.contextLink.id === id);
  const customer = workOrder?.customerName ?? rows[0].workOrder?.customerName ?? "Client inconnu";

  return <div className="mx-auto max-w-7xl">
    <ModuleHeader eyebrow={id} title={workOrder?.description || rows[0].description || "OF sans désignation"} description={`${customer} · ${rows[0].articleCode || "Article inconnu"}`} actions={<><button className={primaryButton} onClick={() => setCreatingAction(true)}>Créer une action</button><Link href="/of" className={secondaryButton}>Retour aux OF</Link></>} />
    {creatingAction ? <ActionFormDialog origine="Planning" contextLink={{ module: "workOrder", id, label: id, href: `/of/${id}` }} onClose={() => setCreatingAction(false)} /> : null}
    <section className="mt-6 grid gap-4 rounded-2xl border border-[var(--app-border)] bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Quantité" value={workOrder ? `${workOrder.quantity.toLocaleString("fr-BE")} pièces` : "Non disponible"} />
      <Metric label="Priorité" value={`${current.effectivePriority}`} />
      <Metric label="Échéance" value={workOrder?.confirmedDueDate ? formatEuropeanDate(workOrder.confirmedDueDate) : rows[0].dueDate ? formatEuropeanDate(rows[0].dueDate) : "—"} />
      <Metric label="Statut" value={<StatusPill tone={erpOperationStatusTone(current.effectiveStatus)}>{ERP_OPERATION_STATUS_LABELS[current.effectiveStatus]}</StatusPill>} />
      <Metric label="Progression" value={`${progress} %`} />
      <Metric label="Opération actuelle" value={`Op. ${current.operationNumber} · ${current.description ?? "Sans description"}`} />
      <Metric label="Opération suivante" value={next ? `Op. ${next.operationNumber} · ${next.description ?? "Sans description"}` : "Fin de gamme"} />
      <Metric label="Machine actuelle" value={current.machine} />
    </section>
    <section className="mt-5 rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="text-lg font-semibold">Gamme complète</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">N°</th><th className="p-3">Tâche</th><th className="p-3">Machine</th><th className="p-3">Temps</th><th className="p-3">Date</th><th className="p-3">Statut</th><th className="p-3">Retard</th><th className="p-3">Commentaire</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="p-3 font-semibold">{row.operationNumber}</td><td className="p-3">{row.taskCode || "—"}</td><td className="p-3">{row.machine}</td><td className="p-3 text-xs italic text-slate-400" title="Le temps de fabrication n’est pas encore disponible dans les données ERP importées">Non disponible</td><td className="p-3">{row.plannedDate ? formatEuropeanDate(row.plannedDate) : "—"}</td><td className="p-3"><StatusPill tone={erpOperationStatusTone(row.effectiveStatus)}>{ERP_OPERATION_STATUS_LABELS[row.effectiveStatus]}</StatusPill></td><td className="p-3"><StatusPill tone={erpOperationDelayTone(row.delayDays)}>{erpOperationDelayLabel(row.delayDays)}</StatusPill></td><td className="p-3 text-slate-600">{row.comment || "—"}</td></tr>)}</tbody></table></div></section>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="font-semibold">Actions liées</h2><ul className="mt-3 space-y-2">{linkedActions.length ? linkedActions.map((action) => <li key={action.id}><Link className="block rounded-lg bg-slate-50 p-3 text-sm hover:bg-slate-100" href={`/actions/${action.id}`}><strong>{action.id} · {action.description}</strong><span className="mt-1 block text-xs text-slate-500">{action.responsable} · {action.statut}</span></Link></li>) : <li className="text-sm text-slate-500">Aucune action liée.</li>}</ul></section>
      <section className="rounded-2xl border border-[var(--app-border)] bg-white p-5"><h2 className="font-semibold">Lignes de commande</h2>{workOrder && workOrder.orderLines.length > 1 ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-xs"><thead className="text-slate-500"><tr><th className="p-2">Commande / poste</th><th className="p-2">Référence</th><th className="p-2">Quantité</th><th className="p-2">Demandée</th><th className="p-2">Confirmée</th></tr></thead><tbody>{workOrder.orderLines.map((line) => <tr key={line.sourceRow} className="border-t border-slate-100"><td className="p-2">{line.customerOrderNumber} / {line.customerOrderLine}</td><td className="p-2">{line.customerReference || "—"}</td><td className="p-2">{line.quantity.toLocaleString("fr-BE")}</td><td className="p-2">{line.requestedDueDate ? formatEuropeanDate(line.requestedDueDate) : "—"}</td><td className="p-2">{line.confirmedDueDate ? formatEuropeanDate(line.confirmedDueDate) : "—"}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-slate-500">{workOrder ? "Une seule ligne de commande." : "Détail de commande non disponible : cet OF est absent du fichier Top (opération orpheline)."}</p>}</section>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: ReactNode }) { return <div><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>; }
function apiMessage(payload: unknown): string { return isRecord(payload) && typeof payload.message === "string" ? payload.message : "Le serveur a retourné une réponse inattendue."; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
