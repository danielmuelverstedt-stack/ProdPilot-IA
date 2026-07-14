import { getMailAttachmentPresentation } from "@/features/mail/services/mail-attachments";
import type { MailAttachment } from "@/features/mail/types/mail";

export function MailAttachments({ attachments }: { attachments: readonly MailAttachment[] }) {
  if (!attachments.length) return null;
  return <section aria-labelledby="mail-attachments-title" className="mt-5">
    <h3 id="mail-attachments-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-[#819087]">Pièces jointes ({attachments.length})</h3>
    <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{attachments.map((attachment) => <AttachmentItem key={attachment.id} attachment={attachment} />)}</ul>
  </section>;
}

function AttachmentItem({ attachment }: { attachment: MailAttachment }) {
  const presentation = getMailAttachmentPresentation(attachment);
  const icon = { image: "IMG", pdf: "PDF", document: "DOC", archive: "ZIP", file: "FIC" }[presentation.icon];
  return <li className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-[#dce5e0] bg-[#f8faf9] p-3">
    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-bold text-[#195c45]">{icon}</span>
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#33473e]">{attachment.filename}</p><p className="mt-0.5 text-xs text-[#7a8982]">{presentation.size} · {attachment.mimeType}</p></div>
    <div className="flex w-full gap-1 sm:w-auto"><button type="button" disabled title="L’aperçu sécurisé sera ajouté avec le stockage de production." className={buttonClass}>Aperçu</button><button type="button" disabled title="Le téléchargement sécurisé sera ajouté avec le stockage de production." className={buttonClass}>Télécharger</button></div>
  </li>;
}

const buttonClass = "min-h-9 rounded-lg border border-[#d7e2dd] px-2 text-xs font-semibold text-[#7a8982] disabled:cursor-not-allowed disabled:opacity-60";
