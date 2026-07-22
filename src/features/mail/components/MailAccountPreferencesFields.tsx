"use client";

import type { MailAccountSettings } from "@/features/mail/types/mail";

export function MailAccountPreferencesFields({ settings, onChange }: {
  settings: MailAccountSettings;
  onChange: (settings: MailAccountSettings) => void;
}) {
  const update = (partial: Partial<MailAccountSettings>) => onChange({ ...settings, ...partial });
  return <div className="space-y-5 sm:col-span-2">
    <PreferenceSection title="Affichage et lecture">
      <Select label="Densité" value={settings.displayDensity} onChange={(displayDensity) => update({ displayDensity: displayDensity as MailAccountSettings["displayDensity"] })}><option value="comfortable">Confortable</option><option value="compact">Compacte</option></Select>
      <Select label="Volet de lecture" value={settings.readingPanePosition} onChange={(readingPanePosition) => update({ readingPanePosition: readingPanePosition as MailAccountSettings["readingPanePosition"] })}><option value="bottom">En dessous</option><option value="right">À droite</option><option value="hidden">Masqué par défaut</option></Select>
      <Select label="Mode de conversation" value={settings.conversationMode} onChange={(conversationMode) => update({ conversationMode: conversationMode as MailAccountSettings["conversationMode"] })}><option value="threaded">Par conversation</option><option value="individual">Messages individuels</option></Select>
      <Select label="Format de date" value={settings.dateFormat} onChange={(dateFormat) => update({ dateFormat: dateFormat as MailAccountSettings["dateFormat"] })}><option value="dd/MM/yyyy">JJ/MM/AAAA</option><option value="dd/MM/yy">JJ/MM/AA</option></Select>
      <Check label="Afficher l’aperçu du message" checked={settings.previewPaneEnabled} onChange={(previewPaneEnabled) => update({ previewPaneEnabled })} />
      <Check label="Regrouper les messages par conversation" checked={settings.groupMessagesByThread} onChange={(groupMessagesByThread) => update({ groupMessagesByThread })} />
    </PreferenceSection>
    <PreferenceSection title="Réponses et brouillons">
      <Select label="Comportement de réponse" value={settings.replyBehavior} onChange={(replyBehavior) => update({ replyBehavior: replyBehavior as MailAccountSettings["replyBehavior"] })}><option value="reply">Répondre à l’expéditeur</option><option value="reply_all">Répondre à tous</option></Select>
      <Select label="Ton par défaut" value={settings.defaultReplyTone} onChange={(defaultReplyTone) => update({ defaultReplyTone: defaultReplyTone as MailAccountSettings["defaultReplyTone"] })}><option value="professional">Professionnel</option><option value="concise">Concis</option><option value="warm">Chaleureux</option><option value="neutral">Neutre</option></Select>
      <Select label="Langue préférée" value={settings.preferredLanguage} onChange={(preferredLanguage) => update({ preferredLanguage: preferredLanguage as MailAccountSettings["preferredLanguage"] })}><option value="fr">Français</option><option value="nl">Néerlandais</option><option value="en">Anglais</option></Select>
      <label className="text-sm font-medium text-[#33473e] sm:col-span-2">Signature<textarea maxLength={5000} value={settings.signature} onChange={(event) => update({ signature: event.target.value })} className={`${fieldClass} mt-1 min-h-24 py-3`} placeholder="Signature ajoutée aux suggestions de réponse" /></label>
      <Check label="Activer l’architecture d’enregistrement automatique" detail="Prépare le suivi local des modifications ; aucun envoi n’est effectué." checked={settings.draftAutosaveEnabled} onChange={(draftAutosaveEnabled) => update({ draftAutosaveEnabled })} />
      <NumberField label="Délai d’enregistrement (secondes)" min={5} max={300} value={settings.draftAutosaveDelaySeconds} onChange={(draftAutosaveDelaySeconds) => update({ draftAutosaveDelaySeconds })} />
      <Check label="Conserver l’historique des brouillons" checked={settings.keepDraftHistory} onChange={(keepDraftHistory) => update({ keepDraftHistory })} />
      <Check label="Autoriser la préparation automatique de brouillons" detail="Désactivée par défaut. Une création externe exige toujours une confirmation précise." checked={settings.automaticDraftCreation} onChange={(automaticDraftCreation) => update({ automaticDraftCreation })} />
    </PreferenceSection>
    <PreferenceSection title="Synchronisation et pièces jointes">
      <NumberField label="Période de synchronisation (minutes)" min={5} max={1440} value={settings.synchronizationPeriodMinutes} onChange={(synchronizationPeriodMinutes) => update({ synchronizationPeriodMinutes })} />
      <NumberField label="Nombre maximal de messages" min={1} max={100} value={settings.maximumMessagesRetrieved} onChange={(maximumMessagesRetrieved) => update({ maximumMessagesRetrieved })} />
      <Check label="Récupérer uniquement les messages non lus" checked={settings.unreadMessagesOnly} onChange={(unreadMessagesOnly) => update({ unreadMessagesOnly })} />
      <Check label="Inclure les métadonnées des pièces jointes" checked={settings.includeAttachmentMetadata} onChange={(includeAttachmentMetadata) => update({ includeAttachmentMetadata })} />
    </PreferenceSection>
    <PreferenceSection title="Filtres et notifications">
      <Select label="Filtre initial" value={settings.defaultFilter} onChange={(defaultFilter) => update({ defaultFilter: defaultFilter as MailAccountSettings["defaultFilter"] })}><option value="all">Tous</option><option value="unread">Non lus</option><option value="urgent">Urgents</option><option value="reply_required">Réponse nécessaire</option></Select>
      <Select label="Tri initial" value={settings.defaultSort} onChange={(defaultSort) => update({ defaultSort: defaultSort as MailAccountSettings["defaultSort"] })}><option value="newest">Plus récents</option><option value="oldest">Plus anciens</option><option value="priority">Priorité</option></Select>
      <label className="text-sm font-medium text-[#33473e]">Dossiers favoris<input value={settings.favoriteFolders.join(", ")} onChange={(event) => update({ favoriteFolders: parseFolders(event.target.value) })} className={`${fieldClass} mt-1`} placeholder="Boîte de réception, Suivi" /></label>
      <Check label="Notifier les nouveaux messages" checked={settings.notifyOnNewMail} onChange={(notifyOnNewMail) => update({ notifyOnNewMail })} />
      <Check label="Notifier les synchronisations" checked={settings.notifyOnSynchronization} onChange={(notifyOnSynchronization) => update({ notifyOnSynchronization })} />
      <Check label="Notifier les pertes de connexion" checked={settings.notifyOnConnectionLoss} onChange={(notifyOnConnectionLoss) => update({ notifyOnConnectionLoss })} />
    </PreferenceSection>
    <label className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm"><input type="checkbox" checked={settings.sendingEnabled} onChange={(event) => update({ sendingEnabled: event.target.checked })} className="mt-0.5 size-4 accent-[#195c45]" /><span><strong className="block text-amber-900">Autoriser l’envoi depuis ProdPilot pour ce compte</strong><span className="mt-1 block text-xs text-amber-800">Une fois activé, un bouton « Envoyer » apparaît sur les brouillons prêts. L’IA ne peut jamais envoyer automatiquement : seul un clic explicite de votre part déclenche un envoi réel.</span></span></label>
  </div>;
}

const fieldClass = "min-h-11 w-full rounded-xl border border-[#cad7d1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45]";

function PreferenceSection({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="grid gap-4 rounded-2xl border border-[#e0e7e3] p-4 sm:grid-cols-2"><legend className="px-2 text-sm font-semibold text-[#263b32]">{title}</legend>{children}</fieldset>; }
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="text-sm font-medium text-[#33473e]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} mt-1`}>{children}</select></label>; }
function NumberField({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (value: number) => void }) { return <label className="text-sm font-medium text-[#33473e]">{label}<input type="number" required min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className={`${fieldClass} mt-1`} /></label>; }
function Check({ label, detail, checked, onChange }: { label: string; detail?: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex gap-3 rounded-xl border border-[#e0e6e3] p-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 size-4 accent-[#195c45]" /><span><strong className="block text-[#33473e]">{label}</strong>{detail ? <span className="mt-1 block text-xs text-[#64736c]">{detail}</span> : null}</span></label>; }
function parseFolders(value: string): string[] { return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 20); }
