"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ColumnDragLabel, ColumnSortButton, createColumnDragHandlers } from "@/components/ui/SortableColumnHeader";
import { CapacitySettingsEditor } from "@/features/settings/components/CapacitySettingsEditor";
import { ProductionStandardsSettings } from "@/features/settings/components/ProductionStandardsSettings";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { MachineCreateDialog } from "@/features/machines/components/MachineCreateDialog";
import { machineSettingsService } from "@/features/settings/services/machine-settings-service";
import type { MachineCreateInput, MachineCreateResult } from "@/features/settings/services/machine-settings-service";
import type { DepartmentSettings, MachineSettings } from "@/features/settings/types/settings";
import { buttonClass, Field, inputClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import { sortRows } from "@/lib/table-columns";
import { useTableColumns } from "@/lib/use-table-columns";

const MACHINE_COLUMN_IDS = ["status", "id", "displayName", "department", "type", "order"] as const;
type MachineColumnId = (typeof MACHINE_COLUMN_IDS)[number];

const MACHINE_COLUMN_LABELS: Record<MachineColumnId, string> = {
  status: "État",
  id: "Identifiant",
  displayName: "Nom affiché",
  department: "Département",
  type: "Type",
  order: "Ordre",
};

function machineSortValue(machine: MachineSettings, column: MachineColumnId, departments: DepartmentSettings[]): string | number {
  if (column === "status") return machine.deleted ? "Supprimée" : machine.active ? "Active" : "Inactive";
  if (column === "id") return machine.id;
  if (column === "displayName") return machine.displayName;
  if (column === "department") return departments.find((item) => item.id === machine.departmentId)?.label ?? machine.department;
  if (column === "type") return machine.machineType;
  return machine.order;
}

function machineCellClassName(column: MachineColumnId): string {
  if (column === "id") return "p-3 font-mono";
  if (column === "displayName") return "p-3 font-medium";
  return "p-3";
}

function renderMachineCell(column: MachineColumnId, machine: MachineSettings, order: number, departments: DepartmentSettings[]): ReactNode {
  if (column === "status") return <>{machine.deleted ? "Supprimée" : machine.active ? "Active" : "Inactive"}{!machine.visible ? " · Masquée" : ""}{machine.favorite ? " · ★" : ""}</>;
  if (column === "id") return machine.id;
  if (column === "displayName") return <><span className="mr-2 inline-block h-3 w-3 rounded" style={{ background: machine.color || departments.find((item) => item.id === machine.departmentId)?.color }} />{machine.displayName}</>;
  if (column === "department") return departments.find((item) => item.id === machine.departmentId)?.label ?? machine.department;
  if (column === "type") return machine.machineType;
  return order + 1;
}

export function ProductionSettingsPanel() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const [creatingMachine, setCreatingMachine] = useState(false);
  const machines = [...settings.production.machines].sort((a, b) => a.order - b.order);
  const departments = [...settings.production.departments].sort((a, b) => a.order - b.order);
  const { order: columnOrder, sort, moveColumn, cycleSort } = useTableColumns<MachineColumnId>("production-machines", MACHINE_COLUMN_IDS);
  const isDisplaySorted = sort.column !== null;
  const sortedMachines = sortRows(machines, sort, (machine, column) => machineSortValue(machine, column, departments));
  function createMachine(input: MachineCreateInput): MachineCreateResult {
    const outcome: { result: MachineCreateResult } = { result: { ok: false, error: "Impossible de créer la machine." } };
    updateSettings((draft) => { outcome.result = machineSettingsService.createMachine(draft, input); }, "Machine créée");
    if (outcome.result.ok) {
      setCreatingMachine(false);
      router.push(`/machines/${outcome.result.machine.id}`);
    }
    return outcome.result;
  }
  function reorderMachine(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (!machines[target]) return;
    const reordered = [...machines];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    updateSettings((draft) => {
      draft.production.machines = reordered.map((item, order) => ({
        ...item,
        order,
      }));
    }, "Ordre des machines modifié");
  }

  return (
    <div className="space-y-5">
      <SettingsPanel
        title="Machines"
        description="Référentiel central utilisé en temps réel par le Planning, ses filtres et ses impressions."
        actions={
          <button className={buttonClass} onClick={() => setCreatingMachine(true)}>
            Ajouter une machine
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="border-b border-[var(--app-border)] text-xs uppercase text-slate-500">
              <tr>
                {columnOrder.map((column) => (
                  <th key={column} {...createColumnDragHandlers(column, moveColumn)} className="p-3">
                    <ColumnDragLabel label={MACHINE_COLUMN_LABELS[column]} />
                    <ColumnSortButton id={column} sort={sort} onSort={cycleSort} />
                  </th>
                ))}
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMachines.map((machine) => {
                const index = machines.indexOf(machine);
                return (
                  <tr key={machine.id} className={`border-b border-slate-100 ${machine.deleted ? "bg-slate-50 text-slate-400" : ""}`}>
                    {columnOrder.map((column) => (
                      <td key={column} className={machineCellClassName(column)}>{renderMachineCell(column, machine, index, departments)}</td>
                    ))}
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className={buttonClass} disabled={isDisplaySorted || index === 0 || machine.deleted} title={isDisplaySorted ? "Réinitialisez le tri d’affichage pour réordonner manuellement" : undefined} onClick={() => reorderMachine(index, -1)}>
                          ↑
                        </button>
                        <button className={buttonClass} disabled={isDisplaySorted || index === machines.length - 1 || machine.deleted} title={isDisplaySorted ? "Réinitialisez le tri d’affichage pour réordonner manuellement" : undefined} onClick={() => reorderMachine(index, 1)}>
                          ↓
                        </button>
                        <Link href={`/machines/${machine.id}`} className={buttonClass}>
                          Modifier
                        </Link>
                        {machine.deleted ? (
                          <button
                            className={buttonClass}
                            onClick={() => updateSettings((draft) => { machineSettingsService.restore(draft, machine.id); }, "Machine restaurée")}
                          >
                            Restaurer
                          </button>
                        ) : (
                          <button
                            className={buttonClass}
                            onClick={() => {
                              if (!window.confirm(`Marquer ${machine.displayName} comme supprimée ? Elle restera dans l’historique et les opérations concernées seront signalées.`)) return;
                              updateSettings((draft) => { machineSettingsService.softDelete(draft, machine.id); }, "Machine marquée comme supprimée");
                            }}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SettingsPanel>
      {creatingMachine ? <MachineCreateDialog settings={settings} onSubmit={createMachine} onClose={() => setCreatingMachine(false)} /> : null}
      <PlanningDefaultsSettings />
      <CapacitySettingsEditor />
      <ProductionStandardsSettings />
      <WorkOrderTypesSettings />
    </div>
  );
}

function PlanningDefaultsSettings() {
  const { settings, updateSettings } = useSettings();
  const planning = settings.production.planning;
  return (
    <SettingsPanel title="Standards du Planning" description="Valeurs générales utilisées lorsque aucune capacité machine ou département ne les remplace.">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Libellé Tous départements">
          <input
            className={inputClass}
            value={planning.allDepartmentsLabel}
            onChange={(event) =>
              updateSettings((draft) => {
                draft.production.planning.allDepartmentsLabel = event.target.value;
              }, "Libellé global du Planning modifié")
            }
          />
        </Field>
        <Field label="Capacité par défaut (h/jour)">
          <input
            type="number"
            min="0"
            step="0.5"
            className={inputClass}
            value={planning.defaultCapacityHours}
            onChange={(event) =>
              updateSettings((draft) => {
                draft.production.planning.defaultCapacityHours = Number(event.target.value);
              }, "Capacité par défaut modifiée")
            }
          />
        </Field>
        <Field label="Jours travaillés (0 à 6)">
          <input
            className={inputClass}
            value={planning.workingDays.join(",")}
            onChange={(event) =>
              updateSettings((draft) => {
                draft.production.planning.workingDays = parseDays(event.target.value);
              }, "Jours du Planning modifiés")
            }
          />
        </Field>
        <Field label="Premier jour de semaine">
          <input
            type="number"
            min="0"
            max="6"
            className={inputClass}
            value={planning.weekStartsOn}
            onChange={(event) =>
              updateSettings((draft) => {
                draft.production.planning.weekStartsOn = Number(event.target.value);
              }, "Début de semaine modifié")
            }
          />
        </Field>
        <Field label="Nombre de semaines visibles">
          <input
            type="number"
            min="1"
            max="12"
            className={inputClass}
            value={planning.visibleWeeks}
            onChange={(event) =>
              updateSettings((draft) => {
                draft.production.planning.visibleWeeks = Number(event.target.value);
              }, "Période du Planning modifiée")
            }
          />
        </Field>
        <Field label="Seuil d’attention (%)">
          <input
            type="number"
            min="0"
            max="100"
            className={inputClass}
            value={planning.loadWarningPercent}
            onChange={(event) =>
              updateSettings((draft) => {
                draft.production.planning.loadWarningPercent = Number(event.target.value);
              }, "Seuil de charge modifié")
            }
          />
        </Field>
        <Field label="Seuil critique (%)">
          <input
            type="number"
            min="0"
            className={inputClass}
            value={planning.loadCriticalPercent}
            onChange={(event) =>
              updateSettings((draft) => {
                draft.production.planning.loadCriticalPercent = Number(event.target.value);
              }, "Seuil critique modifié")
            }
          />
        </Field>
      </div>
    </SettingsPanel>
  );
}

function WorkOrderTypesSettings() {
  const { settings, updateSettings } = useSettings();
  return (
    <SettingsPanel title="Types d’OF" description="Une valeur par ligne.">
      <Field label="Types d’OF">
        <textarea
          className={`${inputClass} min-h-36 py-2`}
          value={settings.production.workOrderTypes.join("\n")}
          onChange={(event) =>
            updateSettings((draft) => {
              draft.production.workOrderTypes = event.target.value
                .split("\n")
                .map((value) => value.trim())
                .filter(Boolean);
            }, "Types d’OF mis à jour")
          }
        />
      </Field>
    </SettingsPanel>
  );
}

function parseDays(value: string): number[] {
  return [
    ...new Set(
      value
        .split(",")
        .map(Number)
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ];
}
