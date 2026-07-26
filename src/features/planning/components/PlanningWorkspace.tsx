"use client";

import { useState } from "react";
import { ModuleHeader, secondaryButton } from "@/components/ui/ModuleUi";
import { ErpPlanningWorkspace } from "@/features/erp-import/components/ErpPlanningWorkspace";
import { PlanningModule } from "@/features/planning/components/PlanningModule";
import { PlanningWorkshopView } from "@/features/planning/components/PlanningWorkshopView";

type PlanningMode = "erp" | "capacity" | "workshop";

const MODE_DESCRIPTIONS: Record<PlanningMode, string> = {
  erp: "Pilotez chaque opération par date, retard, machine, priorité, statut et atelier, sans utiliser les temps de fabrication.",
  capacity: "Retrouvez le planning historique par capacité, machine et jour.",
  workshop: "Retrouvez les OF de chaque machine, regroupés par atelier, à partir des mêmes données que le Cockpit ERP.",
};

export function PlanningWorkspace() {
  const [mode, setMode] = useState<PlanningMode>("erp");
  const [visitedModes, setVisitedModes] = useState<Set<PlanningMode>>(() => new Set(["erp"]));

  function changeMode(next: PlanningMode) {
    setMode(next);
    setVisitedModes((current) => current.has(next) ? current : new Set(current).add(next));
  }

  return <div className="mx-auto max-w-[1600px]">
    <ModuleHeader
      eyebrow="Pilotage de production"
      title="Planning"
      description={MODE_DESCRIPTIONS[mode]}
      actions={<div className="flex rounded-xl border border-[var(--app-border)] bg-white p-1">
        <button className={`${secondaryButton} border-0 ${mode === "erp" ? "bg-slate-900 text-white hover:bg-slate-900" : ""}`} onClick={() => changeMode("erp")}>Cockpit ERP</button>
        <button className={`${secondaryButton} border-0 ${mode === "capacity" ? "bg-slate-900 text-white hover:bg-slate-900" : ""}`} onClick={() => changeMode("capacity")}>Planning capacité</button>
        <button className={`${secondaryButton} border-0 ${mode === "workshop" ? "bg-slate-900 text-white hover:bg-slate-900" : ""}`} onClick={() => changeMode("workshop")}>Atelier</button>
      </div>}
    />
    <div className="mt-6">
      {visitedModes.has("erp") ? <div hidden={mode !== "erp"}><ErpPlanningWorkspace /></div> : null}
      {visitedModes.has("capacity") ? <div hidden={mode !== "capacity"}><PlanningModule /></div> : null}
      {visitedModes.has("workshop") ? <div hidden={mode !== "workshop"}><PlanningWorkshopView /></div> : null}
    </div>
  </div>;
}
