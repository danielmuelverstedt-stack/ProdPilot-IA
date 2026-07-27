/* Les logos locaux enregistrés en data URL ne passent pas par l’optimiseur d’images. */
/* eslint-disable @next/next/no-img-element */
import { formatEuropeanDate, primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { ERP_OPERATION_STATUS_LABELS, erpOperationDelayLabel } from "@/features/erp-import/services/erp-operation-status-presentation";
import { getPlanningPrintConfiguration } from "@/features/planning/services/planning-print";
import { WORKSHOP_COLUMN_LABELS } from "@/features/planning/services/workshop-view-preferences";
import type { OperationView } from "@/features/erp-import/types/erp-import";
import type { WorkshopColumnId } from "@/features/planning/types/workshop-view";
import type { AppSettings, MachineSettings } from "@/features/settings/types/settings";

const NUMERIC_COLUMN_IDS = new Set<WorkshopColumnId>(["priority", "delay", "quantity"]);

/** Fiche imprimable d'une seule machine de l'Atelier : mêmes colonnes que celles actuellement affichées à l'écran, limitées au nombre de lignes choisi dans WorkshopMachinePrintDialog. */
export function WorkshopMachinePrintView({ machine, operations, totalOperationCount, visibleColumnIds, settings, onBack }: {
  machine: MachineSettings | null;
  operations: OperationView[];
  totalOperationCount: number;
  visibleColumnIds: WorkshopColumnId[];
  settings: AppSettings;
  onBack: () => void;
}) {
  const printConfiguration = getPlanningPrintConfiguration(settings.print);
  const editedAt = printConfiguration.showDateTime ? formatEuropeanDate(new Date().toISOString(), true) : null;

  return <div className="mx-auto max-w-[1200px]">
    <style>{`
      @page { size: ${settings.print.paperSize} ${settings.print.orientation}; margin: 12mm; }
      @media print { thead { display: table-header-group; } tr { break-inside: avoid; } }
    `}</style>
    <div className="mb-4 flex justify-end gap-2 print:hidden">
      <button type="button" onClick={onBack} className={secondaryButton}>← Retour à l’Atelier</button>
      <button type="button" onClick={() => window.print()} className={primaryButton}>Imprimer</button>
    </div>
    <section className="rounded-2xl border border-[var(--app-border)] bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex items-start justify-between gap-6 border-b-2 pb-4" style={{ borderColor: "var(--app-primary)" }}>
        <div className="flex items-center gap-4">
          {printConfiguration.showLogo && settings.company.logoDataUrl ? <img src={settings.company.logoDataUrl} alt={`Logo ${settings.company.name}`} className="h-14 w-16 shrink-0 object-contain" /> : null}
          <div>
            {printConfiguration.showCompany ? <p className="text-sm font-semibold" style={{ color: "var(--app-primary)" }}>{settings.company.name}</p> : null}
            <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">Fiche de production — Atelier</h1>
          </div>
        </div>
        <div className="shrink-0 text-right text-[11px] leading-5 text-slate-500">
          <p className="font-semibold uppercase tracking-wider text-slate-700">Document de travail</p>
          <p>Non contractuel</p>
          {editedAt ? <p className="mt-1">Édité le {editedAt}</p> : null}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
        <InfoField label="Machine" value={machine?.displayName ?? "Machine non définie"} />
        <InfoField label="Code" value={machine?.id ?? "—"} />
        <InfoField label="Département" value={machine?.department || "—"} />
        {machine?.kind === "poste" ? <InfoField label="Type" value="Poste de travail" /> : <InfoField label="Type" value="Machine" />}
        <InfoField label="Opérations imprimées" value={`${operations.length.toLocaleString("fr-BE")} sur ${totalOperationCount.toLocaleString("fr-BE")}`} />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-xs">
          <thead>
            <tr>{visibleColumnIds.map((columnId) => <th key={columnId} className={`border-b-2 border-slate-900 p-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 ${NUMERIC_COLUMN_IDS.has(columnId) ? "text-right" : "text-left"}`}>{WORKSHOP_COLUMN_LABELS[columnId]}</th>)}</tr>
          </thead>
          <tbody>
            {operations.map((operation, index) => <tr key={operation.id} className={index % 2 === 1 ? "bg-slate-50 print:bg-transparent" : undefined}>
              {visibleColumnIds.map((columnId) => <td key={columnId} className={`border-b border-slate-200 p-2 align-top ${NUMERIC_COLUMN_IDS.has(columnId) ? "text-right tabular-nums" : "text-left"}`}>{printCellValue(columnId, operation)}</td>)}
            </tr>)}
          </tbody>
        </table>
      </div>
      {!operations.length ? <p className="mt-6 text-sm text-slate-500">Aucune opération à imprimer pour cette machine.</p> : null}

      <footer className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>{settings.company.footerText}</p>
        <div className="text-right leading-6">
          <p>Visé par : ______________________________</p>
          <p>Date : _____ / _____ / ________</p>
        </div>
      </footer>
    </section>
  </div>;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-0.5 font-semibold text-slate-900">{value}</p></div>;
}

function printCellValue(columnId: WorkshopColumnId, operation: OperationView): string {
  if (columnId === "priority") return `${operation.effectivePriority}`;
  if (columnId === "work-order") return operation.workOrderId;
  if (columnId === "operation") return `Op. ${operation.operationNumber}${operation.taskCode ? ` · Tâche ${operation.taskCode}` : ""}`;
  if (columnId === "article") return operation.articleCode || "Article inconnu";
  if (columnId === "client") return operation.workOrder?.customerName || "—";
  if (columnId === "quantity") return operation.workOrder?.quantity != null ? operation.workOrder.quantity.toLocaleString("fr-BE") : "—";
  if (columnId === "description") return operation.description || "Sans description";
  if (columnId === "time") return "Non disponible";
  if (columnId === "status") return ERP_OPERATION_STATUS_LABELS[operation.effectiveStatus];
  if (columnId === "start-date") return formatDate(operation.plannedDate);
  if (columnId === "end-date") return formatDate(operation.dueDate);
  if (columnId === "delay") return erpOperationDelayLabel(operation.delayDays);
  return operation.machine;
}

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("fr-BE", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "—";
}
