"use client";

import type { MailSearchCriteria } from "@/features/mail/types/mail";

export function MailToolbar({ criteria, onChange, onReset }: {
  criteria: MailSearchCriteria;
  onChange: (criteria: MailSearchCriteria) => void;
  onReset: () => void;
}) {
  const update = (partial: Partial<MailSearchCriteria>) => onChange({ ...criteria, ...partial });
  return <section aria-label="Recherche et filtres des messages" className="rounded-2xl border border-[#dce5e0] bg-white p-4 shadow-sm">
    <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_repeat(3,minmax(9rem,auto))]">
      <label className="text-sm font-medium text-[#33473e]"><span className="sr-only">Rechercher dans les messages</span><input type="search" value={criteria.text ?? ""} onChange={(event) => update({ text: event.target.value })} placeholder="Rechercher un expéditeur, un objet ou un contenu…" className={fieldClass} /></label>
      <Select label="Lecture" value={criteria.readState ?? "all"} onChange={(value) => update({ readState: value as MailSearchCriteria["readState"] })}><option value="all">Tous les messages</option><option value="unread">Non lus</option><option value="read">Lus</option></Select>
      <Select label="Période" value={criteria.datePreset ?? "all"} onChange={(value) => update({ datePreset: value as MailSearchCriteria["datePreset"] })}><option value="all">Toutes les dates</option><option value="today">Aujourd’hui</option><option value="yesterday">Hier</option><option value="this_week">Cette semaine</option><option value="custom">Dates personnalisées</option></Select>
      <Select label="Tri" value={criteria.sort ?? "newest"} onChange={(value) => update({ sort: value as MailSearchCriteria["sort"] })}><option value="newest">Plus récents</option><option value="oldest">Plus anciens</option><option value="priority">Priorité</option></Select>
    </div>
    <details className="mt-3 rounded-xl border border-[#e4ebe7] bg-[#fafcfb] p-3"><summary className="cursor-pointer text-sm font-semibold text-[#40554b]">Filtres avancés</summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><TextFilter label="Objet" value={criteria.subject} onChange={(subject) => update({ subject })} /><TextFilter label="Expéditeur" value={criteria.sender} onChange={(sender) => update({ sender })} /><TextFilter label="Destinataire" value={criteria.recipient} onChange={(recipient) => update({ recipient })} /><TextFilter label="Contenu" value={criteria.body} onChange={(body) => update({ body })} /><TextFilter label="Nom de pièce jointe" value={criteria.attachmentName} onChange={(attachmentName) => update({ attachmentName })} />
        <Select label="Priorité" value={criteria.priority ?? ""} onChange={(value) => update({ priority: value ? value as MailSearchCriteria["priority"] : undefined })}><option value="">Toutes</option><option value="high">Haute</option><option value="normal">Normale</option><option value="low">Basse</option></Select>
        {criteria.datePreset === "custom" ? <><TextFilter type="date" label="Du" value={criteria.dateFrom} onChange={(dateFrom) => update({ dateFrom })} /><TextFilter type="date" label="Au" value={criteria.dateTo} onChange={(dateTo) => update({ dateTo })} /></> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3"><Check label="Importants" checked={criteria.importantOnly ?? false} onChange={(importantOnly) => update({ importantOnly })} /><Check label="Avec indicateur" checked={criteria.flaggedOnly ?? false} onChange={(flaggedOnly) => update({ flaggedOnly })} /><Check label="Réponse attendue" checked={criteria.waitingReplyOnly ?? false} onChange={(waitingReplyOnly) => update({ waitingReplyOnly })} /><Check label="Avec pièce jointe" checked={criteria.hasAttachment ?? false} onChange={(hasAttachment) => update({ hasAttachment: hasAttachment || undefined })} /></div>
    </details>
    <div className="mt-3 flex justify-end"><button type="button" onClick={onReset} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-[#64736c] hover:bg-[#f1f5f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45]">Réinitialiser les filtres</button></div>
  </section>;
}

const fieldClass = "min-h-11 w-full rounded-xl border border-[#cad7d1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#195c45]";

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="text-xs font-semibold uppercase tracking-wide text-[#64736c]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} mt-1 normal-case`}>{children}</select></label>; }
function TextFilter({ label, value, onChange, type = "text" }: { label: string; value?: string; onChange: (value: string) => void; type?: "text" | "date" }) { return <label className="text-xs font-semibold uppercase tracking-wide text-[#64736c]">{label}<input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} mt-1 normal-case`} /></label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-center gap-2 text-sm text-[#40554b]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#195c45]" />{label}</label>; }
