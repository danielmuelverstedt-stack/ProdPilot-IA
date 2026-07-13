import { primaryButton, secondaryButton } from "@/components/ui/ModuleUi";

export function PlanningPrintActions({ onBack }: { onBack: () => void }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
    <button type="button" className={secondaryButton} onClick={onBack}>‹ Retour au planning</button>
    <div className="flex gap-2"><a className={secondaryButton} href="/reglages">Modifier le modèle</a><button type="button" className={primaryButton} onClick={() => window.print()}>Imprimer</button></div>
  </div>;
}
