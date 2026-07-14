"use client";

import { useState, type FormEvent } from "react";
import { MailDialog } from "@/features/mail/components/MailDialog";

export function MailDemoAccountDialog({ open, pending, onClose, onAdd }: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onAdd: (displayName: string, emailAddress: string) => Promise<boolean>;
}) {
  const [displayName, setDisplayName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onAdd(displayName, emailAddress)) {
      setDisplayName("");
      setEmailAddress("");
      onClose();
    }
  }
  return <MailDialog open={open} title="Ajouter une démonstration" description="Ce compte utilise uniquement des messages locaux et ne se connecte à aucun service externe." onClose={onClose}>
    <form onSubmit={submit} className="grid gap-4">
      <label className="text-sm font-medium">Nom du compte<input autoFocus required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClass} placeholder="Messagerie de test" /></label>
      <label className="text-sm font-medium">Adresse e-mail de démonstration<input required type="email" maxLength={254} value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} className={inputClass} placeholder="production@exemple.fr" /></label>
      <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButton}>Annuler</button><button disabled={pending} className={primaryButton}>{pending ? "Ajout…" : "Ajouter"}</button></div>
    </form>
  </MailDialog>;
}

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-[#cad7d1] px-3 text-sm";
const secondaryButton = "min-h-11 rounded-xl border border-[#cbd7d1] px-4 text-sm font-semibold";
const primaryButton = "min-h-11 rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white disabled:opacity-50";
