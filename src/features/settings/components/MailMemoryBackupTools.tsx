"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { buttonClass, SettingsPanel } from "@/features/settings/components/SettingsUi";
import { estimateMailMemorySize, exportMailMemory, importMailMemory } from "@/features/mail-memory/services/mail-memory-backup";
import { getBrowserMailMemoryRepository } from "@/features/mail-memory/services/mail-memory-service";
import type { MailAccount } from "@/features/mail/types/mail";
import type { MailMemoryContext, MailMemoryStoreName } from "@/features/mail-memory/types/mail-memory";

const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export function MailMemoryBackupTools() {
  const { settings, updateSettings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [context, setContext] = useState<MailMemoryContext | null>(null);
  const [notice, setNotice] = useState("");
  const [size, setSize] = useState("—");
  useEffect(() => { void loadContext(settings).then(setContext).catch(() => setNotice("Le compte Mail actif n’a pas pu être résolu.")); }, [settings]);
  useEffect(() => { if (context) void estimateMailMemorySize(getBrowserMailMemoryRepository(), context).then((bytes) => setSize(formatMb(bytes))).catch(() => setSize("Indisponible")); }, [context]);

  async function exportData() {
    if (!context) return;
    const backup = await exportMailMemory(getBrowserMailMemoryRepository(), context);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `prodpilot-memoire-mail-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
    updateSettings((draft) => { draft.mailMemory.lastBackupAt = backup.exportedAt; }, "Sauvegarde de la mémoire Mail exportée"); setNotice("Mémoire Mail exportée sans secret ni fichier joint.");
  }

  async function importData(file?: File) {
    if (!file || !context) return;
    if (file.size > MAX_BACKUP_BYTES) { setNotice("La sauvegarde dépasse 10 Mo."); return; }
    try { await importMailMemory(getBrowserMailMemoryRepository(), context, JSON.parse(await file.text())); setNotice("Mémoire Mail restaurée pour le compte actif."); }
    catch { setNotice("Cette sauvegarde est invalide ou appartient à un autre contexte."); }
  }

  async function clearStores(stores: MailMemoryStoreName[], confirmation: string) {
    if (!context || !window.confirm(confirmation)) return;
    const repository = getBrowserMailMemoryRepository();
    for (const store of stores) await repository.clear(store, context);
    setNotice("Les données locales sélectionnées ont été supprimées."); setSize(formatMb(await estimateMailMemorySize(repository, context)));
  }

  return <SettingsPanel title="Sauvegarde de la mémoire Mail" description="Le format versionné exclut jetons, clés, audio et contenu binaire des pièces jointes.">
    <p className="mb-4 text-sm text-slate-600">Taille locale estimée : {size}. Dernière sauvegarde : {settings.mailMemory.lastBackupAt ? new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(settings.mailMemory.lastBackupAt)) : "Jamais"}.</p>
    <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={!context} onClick={() => void exportData()}>Exporter la mémoire</button><button className={buttonClass} disabled={!context} onClick={() => inputRef.current?.click()}>Importer la mémoire</button><input ref={inputRef} hidden type="file" accept="application/json" onChange={(event) => void importData(event.target.files?.[0])}/><button className={`${buttonClass} text-red-700`} onClick={() => void clearStores(["mailAnalyses", "mailEntities"], "Supprimer toutes les analyses IA locales du compte actif ?")}>Effacer les analyses</button><button className={`${buttonClass} text-red-700`} onClick={() => void clearStores(["assistantSessions", "assistantCommands", "assistantAuditEvents"], "Supprimer tout l’historique local des sessions du compte actif ?")}>Effacer les sessions</button><button className={`${buttonClass} text-red-700`} onClick={() => context && window.confirm("Effacer toute la mémoire Mail locale du compte actif ? Les décisions confirmées seront aussi supprimées.") && void getBrowserMailMemoryRepository().clearAll(context).then(() => { setNotice("Mémoire Mail locale effacée."); setSize("0 Mo"); })}>Tout effacer</button></div>
    <p className="mt-4 text-sm text-slate-500" aria-live="polite">{notice}</p>
  </SettingsPanel>;
}

async function loadContext(settings: ReturnType<typeof useSettings>["settings"]): Promise<MailMemoryContext> {
  const response = await fetch("/api/mail/connection", { cache: "no-store" }); const payload = await response.json() as { account?: MailAccount };
  if (!response.ok || !payload.account) throw new Error("Compte indisponible");
  const user = settings.users.find((item) => item.active) ?? settings.users[0];
  return { accountId: payload.account.id, provider: payload.account.provider, userId: user?.id ?? "local-user", companyId: payload.account.organizationId ?? "local-company", mode: payload.account.mode };
}
function formatMb(bytes: number): string { return `${new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 2 }).format(bytes / 1_048_576)} Mo`; }
