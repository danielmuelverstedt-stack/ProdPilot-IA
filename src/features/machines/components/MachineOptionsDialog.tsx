"use client";

import { secondaryButton } from "@/components/ui/ModuleUi";
import { PlanningDialogShell } from "@/features/planning/components/PlanningDialogShell";
import { MachineCsvTools } from "@/features/machines/components/MachineCsvTools";
import { MachinePhotoBulkImport } from "@/features/machines/components/MachinePhotoBulkImport";

/** Regroupe les outils d'import/export du parc (CSV, photos en masse) derrière un seul bouton « Options », pour ne plus les afficher en permanence sur la page. */
export function MachineOptionsDialog({ onClose }: { onClose: () => void }) {
  return <PlanningDialogShell title="Options du parc machines" description="Import/export en CSV et import de photos en masse." onClose={onClose} actions={<button type="button" className={secondaryButton} onClick={onClose}>Fermer</button>}>
    <div className="space-y-4">
      <MachineCsvTools />
      <MachinePhotoBulkImport />
    </div>
  </PlanningDialogShell>;
}
