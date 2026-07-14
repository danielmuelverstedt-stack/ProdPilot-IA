"use client";

import { useState, type FormEvent } from "react";
import { MailAccountPreferencesFields } from "@/features/mail/components/MailAccountPreferencesFields";
import { MailDialog } from "@/features/mail/components/MailDialog";
import type { MailAccount, MailAccountSettings } from "@/features/mail/types/mail";

export function MailAccountSettingsDialog({ account, pending, onClose, onSave }: {
  account: MailAccount;
  pending: boolean;
  onClose: () => void;
  onSave: (account: MailAccount, displayName: string, settings: MailAccountSettings) => Promise<boolean>;
}) {
  const [displayName, setDisplayName] = useState(account.displayName);
  const [settings, setSettings] = useState<MailAccountSettings>({ ...account.settings, sendingEnabled: false });
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (await onSave(account, displayName, settings)) onClose(); }
  return <MailDialog open title="Paramètres du compte" description="Les préférences sont centralisées dans le dépôt du compte actif. Les options futures n’activent aucune intégration externe." onClose={onClose}>
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-[#33473e] sm:col-span-2">Nom affiché<input autoFocus required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClass} /></label><MailAccountPreferencesFields settings={settings} onChange={setSettings} />{account.organizationId ? <p className="text-sm text-[#64736c] sm:col-span-2">Organisation associée : <strong>{account.organizationId}</strong></p> : null}<div className="flex flex-wrap justify-end gap-2 border-t border-[#e7ece9] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className={secondaryButton}>Annuler</button><button disabled={pending} className={primaryButton}>{pending ? "Enregistrement…" : "Enregistrer"}</button></div></form>
  </MailDialog>;
}

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-[#cad7d1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45]";
const secondaryButton = "min-h-11 rounded-xl border border-[#cbd7d1] bg-white px-4 text-sm font-semibold text-[#40554b]";
const primaryButton = "min-h-11 rounded-xl bg-[#195c45] px-4 text-sm font-semibold text-white disabled:opacity-50";
