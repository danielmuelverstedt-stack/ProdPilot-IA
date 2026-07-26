"use client";

import { useState } from "react";
import { fieldClass, formatEuropeanDate, primaryButton, secondaryButton, StatusPill } from "@/components/ui/ModuleUi";
import type { Machine, MachineStatus, MachiningType } from "@/features/demo/types/demo";
import type { MachineTechnicalUpdate } from "@/features/machines/services/machine-technical-service";

const statusOptions: MachineStatus[] = ["Disponible", "En production", "Maintenance prévue", "En panne", "Inactive"];
const machiningTypeOptions: MachiningType[] = ["3 axes", "4 axes", "5 axes", "Tournage-fraisage"];

function Info({ label, value, unverified }: { label: string; value: string; unverified?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium">
        <span>{value || "À compléter"}</span>
        {unverified ? <StatusPill tone="warning">Pré-rempli — à vérifier</StatusPill> : null}
      </dd>
    </div>
  );
}

function Field({ label, unverified, children }: { label: string; unverified?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 flex flex-wrap items-center gap-2">{label}{unverified ? <StatusPill tone="warning">À vérifier</StatusPill> : null}</span>
      {children}
    </label>
  );
}

function toPatch(details: Machine | undefined): MachineTechnicalUpdate {
  return {
    manufacturer: details?.manufacturer ?? "",
    model: details?.model ?? "",
    year: details?.year ?? new Date().getFullYear(),
    serialNumber: details?.serialNumber ?? "",
    robot: details?.robot ?? null,
    status: details?.status ?? "Disponible",
    workshopLocation: details?.workshopLocation ?? "",
    commissioningDate: details?.commissioningDate ?? null,
    warrantyEndDate: details?.warrantyEndDate ?? null,
    machiningType: details?.machiningType ?? "",
    cncControl: details?.cncControl ?? "",
    spindleSpeedRpm: details?.spindleSpeedRpm ?? null,
    spindlePowerKw: details?.spindlePowerKw ?? null,
    toolSpindleOrCone: details?.toolSpindleOrCone ?? "",
    travelXMm: details?.travelXMm ?? null,
    travelYMm: details?.travelYMm ?? null,
    travelZMm: details?.travelZMm ?? null,
    toolMagazineCapacity: details?.toolMagazineCapacity ?? null,
    barCapacityDiameterMm: details?.barCapacityDiameterMm ?? null,
    throughSpindleCoolant: details?.throughSpindleCoolant ?? false,
    electricalVoltage: details?.electricalVoltage ?? "",
    electricalKva: details?.electricalKva ?? null,
    electricalCableSection: details?.electricalCableSection ?? "",
    compressedAirBar: details?.compressedAirBar ?? null,
    compressedAirFlowNlMin: details?.compressedAirFlowNlMin ?? null,
  };
}

function numberOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

export function MachineTechnicalPanel({ machineCode, details, technicalInformation, onSave }: {
  machineCode: string;
  details: Machine | undefined;
  technicalInformation: string;
  onSave: (technical: MachineTechnicalUpdate, technicalInformation: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MachineTechnicalUpdate>(() => toPatch(details));
  const [draftTechnicalInformation, setDraftTechnicalInformation] = useState(technicalInformation);
  const unverified = details?.unverifiedFields ?? [];
  const isUnverified = (field: keyof MachineTechnicalUpdate) => unverified.includes(field);

  if (!editing) {
    return (
      <div>
        <div className="flex justify-end">
          <button className={secondaryButton} onClick={() => { setDraft(toPatch(details)); setDraftTechnicalInformation(technicalInformation); setEditing(true); }}>Modifier</button>
        </div>

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-slate-500">Identification</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Info label="Code machine" value={machineCode} />
          <Info label="Statut opérationnel" value={details?.status ?? ""} />
          <Info label="N° de série" value={details?.serialNumber || ""} />
          <Info label="Marque / Modèle" value={[details?.manufacturer, details?.model].filter(Boolean).join(" / ")} />
          <Info label="Année" value={details?.year ? String(details.year) : ""} />
          <Info label="Emplacement atelier" value={details?.workshopLocation || ""} />
          <Info label="Date de mise en service" value={details?.commissioningDate ? formatEuropeanDate(details.commissioningDate) : ""} />
          <Info label="Fin de garantie" value={details?.warrantyEndDate ? formatEuropeanDate(details.warrantyEndDate) : ""} />
        </div>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Caractéristiques techniques</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Info label="Type d'usinage" value={details?.machiningType || ""} unverified={isUnverified("machiningType")} />
          <Info label="Commande numérique" value={details?.cncControl || ""} unverified={isUnverified("cncControl")} />
          <Info label="Broche principale" value={details?.spindleSpeedRpm || details?.spindlePowerKw ? `${details?.spindleSpeedRpm ? `${details.spindleSpeedRpm.toLocaleString("fr-BE")} tr/min` : ""}${details?.spindleSpeedRpm && details?.spindlePowerKw ? " · " : ""}${details?.spindlePowerKw ? `${details.spindlePowerKw} kW` : ""}` : ""} unverified={isUnverified("spindleSpeedRpm") || isUnverified("spindlePowerKw")} />
          <Info label="Broche de fraisage / Cône outil" value={details?.toolSpindleOrCone || ""} unverified={isUnverified("toolSpindleOrCone")} />
          <Info label="Courses X/Y/Z" value={details?.travelXMm || details?.travelYMm || details?.travelZMm ? `${details?.travelXMm ?? "—"} / ${details?.travelYMm ?? "—"} / ${details?.travelZMm ?? "—"} mm` : ""} unverified={isUnverified("travelXMm") || isUnverified("travelYMm") || isUnverified("travelZMm")} />
          <Info label="Capacité magasin outils" value={details?.toolMagazineCapacity ? `${details.toolMagazineCapacity} outils` : ""} unverified={isUnverified("toolMagazineCapacity")} />
          <Info label="Passage de barre / Ø max" value={details?.barCapacityDiameterMm ? `Ø ${details.barCapacityDiameterMm} mm` : ""} unverified={isUnverified("barCapacityDiameterMm")} />
          <Info label="Arrosage centre broche" value={details?.throughSpindleCoolant === undefined ? "" : details.throughSpindleCoolant ? "Oui" : "Non"} unverified={isUnverified("throughSpindleCoolant")} />
          <Info label="Robot" value={details?.robot ?? "Aucun"} />
        </div>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Raccordements</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Info label="Alimentation électrique" value={[details?.electricalVoltage ? `${details.electricalVoltage} V` : "", details?.electricalKva ? `${details.electricalKva} kVA` : "", details?.electricalCableSection ? `Câble ${details.electricalCableSection}` : ""].filter(Boolean).join(" · ")} />
          <Info label="Air comprimé" value={[details?.compressedAirBar ? `${details.compressedAirBar} bar` : "", details?.compressedAirFlowNlMin ? `${details.compressedAirFlowNlMin} Nl/min` : ""].filter(Boolean).join(" · ")} />
        </div>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Informations techniques</h3>
        <p className="mt-2 text-sm">{technicalInformation || "À compléter"}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Identification</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Info label="Code machine" value={machineCode} />
        <Field label="Statut opérationnel">
          <select className={`${fieldClass} w-full`} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as MachineStatus })}>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
        <Field label="N° de série">
          <input className={`${fieldClass} w-full`} value={draft.serialNumber} onChange={(event) => setDraft({ ...draft, serialNumber: event.target.value })} />
        </Field>
        <Field label="Fabricant">
          <input className={`${fieldClass} w-full`} value={draft.manufacturer} onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })} />
        </Field>
        <Field label="Modèle">
          <input className={`${fieldClass} w-full`} value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />
        </Field>
        <Field label="Année">
          <input type="number" className={`${fieldClass} w-full`} value={draft.year} onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })} />
        </Field>
        <Field label="Emplacement atelier">
          <input className={`${fieldClass} w-full`} value={draft.workshopLocation} onChange={(event) => setDraft({ ...draft, workshopLocation: event.target.value })} placeholder="À compléter" />
        </Field>
        <Field label="Date de mise en service">
          <input type="date" className={`${fieldClass} w-full`} value={draft.commissioningDate ?? ""} onChange={(event) => setDraft({ ...draft, commissioningDate: event.target.value || null })} />
        </Field>
        <Field label="Fin de garantie">
          <input type="date" className={`${fieldClass} w-full`} value={draft.warrantyEndDate ?? ""} onChange={(event) => setDraft({ ...draft, warrantyEndDate: event.target.value || null })} />
        </Field>
      </div>

      <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Caractéristiques techniques</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="Type d'usinage" unverified={isUnverified("machiningType")}>
          <select className={`${fieldClass} w-full`} value={draft.machiningType} onChange={(event) => setDraft({ ...draft, machiningType: event.target.value as MachiningType })}>
            <option value="">À compléter</option>
            {machiningTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Commande numérique" unverified={isUnverified("cncControl")}>
          <input className={`${fieldClass} w-full`} value={draft.cncControl} onChange={(event) => setDraft({ ...draft, cncControl: event.target.value })} placeholder="À compléter" />
        </Field>
        <Field label="Broche principale — vitesse (tr/min)" unverified={isUnverified("spindleSpeedRpm")}>
          <input type="number" className={`${fieldClass} w-full`} value={draft.spindleSpeedRpm ?? ""} onChange={(event) => setDraft({ ...draft, spindleSpeedRpm: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <Field label="Broche principale — puissance (kW)" unverified={isUnverified("spindlePowerKw")}>
          <input type="number" className={`${fieldClass} w-full`} value={draft.spindlePowerKw ?? ""} onChange={(event) => setDraft({ ...draft, spindlePowerKw: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <Field label="Broche de fraisage / Cône outil" unverified={isUnverified("toolSpindleOrCone")}>
          <input className={`${fieldClass} w-full`} value={draft.toolSpindleOrCone} onChange={(event) => setDraft({ ...draft, toolSpindleOrCone: event.target.value })} placeholder="À compléter" />
        </Field>
        <Field label="Capacité magasin outils" unverified={isUnverified("toolMagazineCapacity")}>
          <input type="number" className={`${fieldClass} w-full`} value={draft.toolMagazineCapacity ?? ""} onChange={(event) => setDraft({ ...draft, toolMagazineCapacity: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <Field label="Course X (mm)" unverified={isUnverified("travelXMm")}>
          <input type="number" className={`${fieldClass} w-full`} value={draft.travelXMm ?? ""} onChange={(event) => setDraft({ ...draft, travelXMm: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <Field label="Course Y (mm)" unverified={isUnverified("travelYMm")}>
          <input type="number" className={`${fieldClass} w-full`} value={draft.travelYMm ?? ""} onChange={(event) => setDraft({ ...draft, travelYMm: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <Field label="Course Z (mm)" unverified={isUnverified("travelZMm")}>
          <input type="number" className={`${fieldClass} w-full`} value={draft.travelZMm ?? ""} onChange={(event) => setDraft({ ...draft, travelZMm: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <Field label="Passage de barre / Ø max (mm, si tournage)" unverified={isUnverified("barCapacityDiameterMm")}>
          <input type="number" className={`${fieldClass} w-full`} value={draft.barCapacityDiameterMm ?? ""} onChange={(event) => setDraft({ ...draft, barCapacityDiameterMm: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={draft.throughSpindleCoolant} onChange={(event) => setDraft({ ...draft, throughSpindleCoolant: event.target.checked })} /> Arrosage centre broche
          {isUnverified("throughSpindleCoolant") ? <StatusPill tone="warning">À vérifier</StatusPill> : null}
        </label>
        <Field label="Robot">
          <input className={`${fieldClass} w-full`} value={draft.robot ?? ""} onChange={(event) => setDraft({ ...draft, robot: event.target.value || null })} placeholder="Aucun" />
        </Field>
      </div>

      <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Raccordements</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="Alimentation électrique — tension (V)">
          <input className={`${fieldClass} w-full`} value={draft.electricalVoltage} onChange={(event) => setDraft({ ...draft, electricalVoltage: event.target.value })} placeholder="À compléter" />
        </Field>
        <Field label="Alimentation électrique — puissance (kVA)">
          <input type="number" className={`${fieldClass} w-full`} value={draft.electricalKva ?? ""} onChange={(event) => setDraft({ ...draft, electricalKva: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <Field label="Section de câble">
          <input className={`${fieldClass} w-full`} value={draft.electricalCableSection} onChange={(event) => setDraft({ ...draft, electricalCableSection: event.target.value })} placeholder="À compléter" />
        </Field>
        <Field label="Air comprimé — pression (bar)">
          <input type="number" className={`${fieldClass} w-full`} value={draft.compressedAirBar ?? ""} onChange={(event) => setDraft({ ...draft, compressedAirBar: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
        <Field label="Air comprimé — débit (Nl/min)">
          <input type="number" className={`${fieldClass} w-full`} value={draft.compressedAirFlowNlMin ?? ""} onChange={(event) => setDraft({ ...draft, compressedAirFlowNlMin: numberOrNull(event.target.value) })} placeholder="À compléter" />
        </Field>
      </div>

      <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Informations techniques</h3>
      <textarea className={`${fieldClass} mt-2 min-h-24 w-full py-2`} value={draftTechnicalInformation} onChange={(event) => setDraftTechnicalInformation(event.target.value)} />

      <div className="mt-4 flex gap-2">
        <button className={primaryButton} onClick={() => { onSave(draft, draftTechnicalInformation); setEditing(false); }}>Enregistrer</button>
        <button className={secondaryButton} onClick={() => setEditing(false)}>Annuler</button>
      </div>
    </div>
  );
}
