"use client";

import { useState } from "react";
import { ModuleHeader, secondaryButton } from "@/components/ui/ModuleUi";
import { ErpPlanningWorkspace } from "@/features/erp-import/components/ErpPlanningWorkspace";
import { PlanningModule } from "@/features/planning/components/PlanningModule";

export function PlanningWorkspace() {
  const [mode, setMode] = useState<"erp" | "capacity">("erp");
  return <div className="mx-auto max-w-[1600px]"><ModuleHeader eyebrow="Pilotage de production" title="Planning" description={mode === "erp" ? "Pilotez chaque opération par date, retard, machine, priorité, statut et atelier, sans utiliser les temps de fabrication." : "Retrouvez le planning historique par capacité, machine et jour."} actions={<div className="flex rounded-xl border border-[var(--app-border)] bg-white p-1"><button className={`${secondaryButton} border-0 ${mode === "erp" ? "bg-slate-900 text-white hover:bg-slate-900" : ""}`} onClick={() => setMode("erp")}>Cockpit ERP</button><button className={`${secondaryButton} border-0 ${mode === "capacity" ? "bg-slate-900 text-white hover:bg-slate-900" : ""}`} onClick={() => setMode("capacity")}>Planning capacité</button></div>} /><div className="mt-6">{mode === "erp" ? <ErpPlanningWorkspace /> : <PlanningModule />}</div></div>;
}
