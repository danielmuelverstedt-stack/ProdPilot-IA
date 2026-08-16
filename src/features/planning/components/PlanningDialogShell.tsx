import type { ReactNode } from "react";
import { Modal } from "@/components/ui/OverlayUi";

export function PlanningDialogShell({ title, description, children, actions, onClose, maxWidthClassName = "max-w-xl" }: {
  title: string;
  description?: string;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
  /** Largeur maximale de la boîte de dialogue (classe Tailwind `max-w-*`) ; par défaut identique au gabarit historique. */
  maxWidthClassName?: string;
}) {
  return <Modal title={title} description={description} actions={actions} onClose={onClose} maxWidthClassName={maxWidthClassName}>{children}</Modal>;
}
