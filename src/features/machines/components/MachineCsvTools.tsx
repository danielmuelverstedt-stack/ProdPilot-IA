"use client";

import { useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui/ModuleUi";
import { updateDemoData, useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { machineSettingsService } from "@/features/settings/services/machine-settings-service";
import { machineTechnicalService } from "@/features/machines/services/machine-technical-service";
import { parseMachinesCsv, serializeMachinesToCsv, type MachineCsvRow } from "@/features/machines/services/machine-csv-service";
import type { MachineSettings } from "@/features/settings/types/settings";

interface ImportResult {
  createdCount: number;
  skippedExisting: string[];
  rowErrors: string[];
}

/** A-t-elle au moins un champ de fiche technique renseigné ? Évite de créer une fiche technique vide pour une ligne qui n'en fournit aucun. */
function hasTechnicalDetails(row: MachineCsvRow): boolean {
  return Boolean(row.manufacturer || row.model || row.year || row.serialNumber || row.robot || row.status);
}

export function MachineCsvTools() {
  const { settings, updateSettings } = useSettings();
  const demoData = useDemoData();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function exportCsv() {
    const csv = serializeMachinesToCsv(settings.production.machines, settings.production.departments, demoData.machines);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `prodpilot-parc-machines-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setResult(null);
    const text = await file.text();
    const { rows, parseErrors } = parseMachinesCsv(text);

    const createdMachines: MachineSettings[] = [];
    const createdRowById = new Map<string, MachineCsvRow>();
    const skippedExisting: string[] = [];
    const rowErrors: string[] = [...parseErrors];

    updateSettings((draft) => {
      for (const row of rows) {
        if (draft.production.machines.some((machine) => machine.id === row.id)) {
          skippedExisting.push(row.id);
          continue;
        }
        const department = draft.production.departments.find((entry) => entry.label === row.departmentLabel || entry.id === row.departmentLabel);
        if (!department) {
          rowErrors.push(`${row.id} : département « ${row.departmentLabel} » introuvable.`);
          continue;
        }
        const created = machineSettingsService.createMachine(draft, { id: row.id, name: row.name, displayName: row.displayName, departmentId: department.id });
        if (!created.ok) {
          rowErrors.push(`${row.id} : ${created.error}`);
          continue;
        }
        machineSettingsService.updateIdentity(draft, created.machine.id, {
          name: row.name,
          displayName: row.displayName || row.name,
          departmentId: department.id,
          machineType: row.machineType,
          color: "",
          futureCapacityHours: row.futureCapacityHours,
          comments: row.comments,
          favorite: row.favorite ?? false,
          // La catégorie de tâche n'est pas (encore) une colonne du CSV ; une machine importée
          // reste non catégorisée, comme une machine créée manuellement.
          taskCategoryCode: null,
        });
        if (row.active === false) machineSettingsService.setInactive(draft, created.machine.id);
        if (row.visible === false) machineSettingsService.setHidden(draft, created.machine.id);
        createdMachines.push(created.machine);
        createdRowById.set(created.machine.id, row);
      }
    }, "Machines importées depuis un CSV");

    if (createdMachines.length) {
      updateDemoData((draft) => {
        createdMachines.forEach((machine) => {
          const row = createdRowById.get(machine.id);
          if (!row || !hasTechnicalDetails(row)) return;
          machineTechnicalService.updateTechnicalDetails(draft, machine, {
            manufacturer: row.manufacturer,
            model: row.model,
            year: row.year ?? new Date().getFullYear(),
            serialNumber: row.serialNumber,
            robot: row.robot,
            status: row.status || "Disponible",
            // La fiche technique détaillée (identification atelier, caractéristiques, raccordements)
            // n'est pas (encore) une colonne du CSV ; elle reste à compléter depuis la fiche machine.
            workshopLocation: "", commissioningDate: null, warrantyEndDate: null,
            machiningType: "", cncControl: "", spindleSpeedRpm: null, spindlePowerKw: null, toolSpindleOrCone: "",
            travelXMm: null, travelYMm: null, travelZMm: null, toolMagazineCapacity: null, barCapacityDiameterMm: null,
            throughSpindleCoolant: false, electricalVoltage: "", electricalKva: null, electricalCableSection: "",
            compressedAirBar: null, compressedAirFlowNlMin: null,
          });
        });
      });
    }

    setResult({ createdCount: createdMachines.length, skippedExisting, rowErrors });
    setPending(false);
  }

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Importer / exporter le parc en CSV</h2>
          <p className="mt-1 text-xs text-slate-500">Exportez l’identité et la fiche technique de toutes les machines dans un fichier CSV (s’ouvre directement dans Excel), modifiez-le, puis réimportez-le : seules les nouvelles machines (identifiant inconnu) sont créées, les identifiants déjà présents dans le parc sont ignorés.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className={secondaryButton} onClick={exportCsv}>Exporter en CSV</button>
          <button className={open ? secondaryButton : primaryButton} onClick={() => setOpen((value) => !value)}>{open ? "Fermer" : "Importer un CSV"}</button>
        </div>
      </div>
      {open ? (
        <div className="mt-4">
          <label className={`${secondaryButton} cursor-pointer ${pending ? "pointer-events-none opacity-60" : ""}`}>
            {pending ? "Import en cours…" : "Choisir le fichier CSV"}
            <input type="file" accept=".csv,text/csv" disabled={pending} className="hidden" onChange={(event) => { void importCsv(event.target.files?.[0]); event.target.value = ""; }} />
          </label>
          {result ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium text-emerald-700">{result.createdCount} machine(s) créée(s).</p>
              {result.skippedExisting.length ? <p className="text-xs text-slate-500">{result.skippedExisting.length} identifiant(s) déjà présents dans le parc, ignorés : {result.skippedExisting.join(", ")}</p> : null}
              {result.rowErrors.length ? <p className="text-xs text-red-700">{result.rowErrors.length} ligne(s) en erreur : {result.rowErrors.join(" · ")}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
