import { AppIcon } from "@/components/ui/AppIcon";
import { secondaryButton } from "@/components/ui/ModuleUi";

export function PalletLabelPrintButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className={`${secondaryButton} gap-1.5`} onClick={onClick}>
    <AppIcon name="print" className="size-4" />Imprimer l&apos;affiche
  </button>;
}
