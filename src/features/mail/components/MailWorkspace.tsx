"use client";

import { useMemo, useState } from "react";
import type {
  MailMessage,
  MailMessageCategory,
  MailPriority,
} from "@/features/mail/types/mail";

type MailView = "all" | MailMessageCategory;

interface MailWorkspaceProps {
  initialMessages: MailMessage[];
}

const views: { id: MailView; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "urgent", label: "Urgents" },
  { id: "reply_required", label: "Réponse nécessaire" },
  { id: "information", label: "Information" },
  { id: "action_required", label: "Action à créer" },
];

const categoryPresentation: Record<
  MailMessageCategory,
  { label: string; className: string }
> = {
  urgent: { label: "Urgent", className: "bg-[#fff0ed] text-[#9d3f35]" },
  reply_required: { label: "Réponse nécessaire", className: "bg-[#fff7e5] text-[#8a651f]" },
  information: { label: "Information", className: "bg-[#edf6f2] text-[#376955]" },
  action_required: { label: "Action à créer", className: "bg-[#eef1ff] text-[#575d9b]" },
};

const priorityPresentation: Record<MailPriority, { label: string; className: string }> = {
  high: { label: "Haute", className: "text-[#9d3f35]" },
  normal: { label: "Normale", className: "text-[#8a651f]" },
  low: { label: "Basse", className: "text-[#376955]" },
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Europe/Brussels",
});

export function MailWorkspace({ initialMessages }: MailWorkspaceProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [activeView, setActiveView] = useState<MailView>("all");
  const [openedMessageId, setOpenedMessageId] = useState<string | null>(null);
  const [draftMessageId, setDraftMessageId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filteredMessages = useMemo(
    () =>
      messages.filter(
        (message) => activeView === "all" || message.category === activeView,
      ),
    [activeView, messages],
  );

  function countForView(view: MailView) {
    return messages.filter(
      (message) => view === "all" || message.category === view,
    ).length;
  }

  function handleOpen(messageId: string) {
    setOpenedMessageId((current) => (current === messageId ? null : messageId));
    setDraftMessageId(null);
    setNotice(null);
  }

  function handlePrepareReply(message: MailMessage) {
    setOpenedMessageId(message.id);
    setDraftMessageId(message.id);
    setNotice("Un brouillon de démonstration a été préparé. Aucun envoi n’est disponible.");
  }

  function handleCreateAction(message: MailMessage) {
    setNotice(`Action simulée créée à partir de « ${message.subject} ».`);
  }

  function handleIgnore(message: MailMessage) {
    setMessages((current) => current.filter((item) => item.id !== message.id));
    setOpenedMessageId(null);
    setDraftMessageId(null);
    setNotice(`Le message « ${message.subject} » a été ignoré dans cette démonstration.`);
  }

  return (
    <section aria-label="Espace de travail des mails" className="mt-8">
      <div className="rounded-2xl border border-[#dce5e0] bg-white p-3 shadow-sm sm:p-4">
        <div className="overflow-x-auto pb-1 sm:pb-0">
          <div className="flex min-w-max gap-1" role="tablist" aria-label="Catégories de messages">
            {views.map((view) => (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={activeView === view.id}
                onClick={() => setActiveView(view.id)}
                className={`min-h-10 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                  activeView === view.id
                    ? "bg-[#195c45] text-white"
                    : "text-[#5d6e66] hover:bg-[#f1f5f3]"
                }`}
              >
                {view.label} <span className="ml-1 opacity-70">{countForView(view.id)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div aria-live="polite" className="min-h-0">
        {notice ? (
          <p role="status" className="mt-4 rounded-xl border border-[#b9dccc] bg-[#edf8f3] px-4 py-3 text-sm text-[#1d694b]">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        {filteredMessages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#cbd8d2] bg-white/70 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-[#263b32]">Aucun message dans cette vue</h2>
            <p className="mt-2 text-sm text-[#64736c]">Choisissez une autre catégorie ou un autre fournisseur.</p>
          </div>
        ) : (
          filteredMessages.map((message) => {
            const category = categoryPresentation[message.category];
            const priority = priorityPresentation[message.priority];
            const isOpen = openedMessageId === message.id;
            const hasDraft = draftMessageId === message.id;

            return (
              <article key={message.id} className="rounded-3xl border border-[#dce5e0] bg-white p-5 shadow-[0_12px_35px_rgba(29,64,50,0.055)] sm:p-6">
                <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${category.className}`}>{category.label}</span>
                      <span className="text-xs font-medium text-[#7a8982]">Google Workspace · Démonstration</span>
                      {!message.isRead ? <span className="size-2 rounded-full bg-[#278a63]" aria-label="Non lu" /> : null}
                    </div>
                    <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                      <p className="truncate text-sm font-semibold text-[#33473e]">{message.from.name ?? message.from.email}</p>
                      <time dateTime={message.receivedAt} className="shrink-0 text-xs text-[#7b8982]">
                        {dateFormatter.format(new Date(message.receivedAt)).replace(",", " à")}
                      </time>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#17211d]">{message.subject}</h2>
                    <p className="mt-3 text-sm leading-6 text-[#5f7068]">{message.summary}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#7a8982]">
                      Priorité <span className={`ml-1 ${priority.className}`}>{priority.label}</span>
                    </p>
                    <div className="mt-4 rounded-xl bg-[#f4f7f5] px-4 py-3 text-sm text-[#465b51]">
                      <strong className="font-semibold text-[#263b32]">Action proposée :</strong> {message.proposedAction}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:max-w-[390px] xl:justify-end">
                    <ActionButton label={isOpen ? "Fermer" : "Ouvrir"} onClick={() => handleOpen(message.id)} />
                    <ActionButton label="Préparer une réponse" onClick={() => handlePrepareReply(message)} primary />
                    <ActionButton label="Créer une action" onClick={() => handleCreateAction(message)} />
                    <ActionButton label="Ignorer" onClick={() => handleIgnore(message)} muted />
                  </div>
                </div>

                {isOpen ? (
                  <div className="mt-5 border-t border-[#e8eeeb] pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#819087]">Message original</p>
                    <p className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#4f6259]">{message.bodyText}</p>
                    {message.attachments.length > 0 ? (
                      <p className="mt-3 text-sm text-[#64736c]">Pièce jointe : {message.attachments[0].filename}</p>
                    ) : null}
                    {hasDraft ? (
                      <div className="mt-5 rounded-2xl border border-[#d7e4de] bg-[#f7faf8] p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold text-[#263b32]">Brouillon de réponse</h3>
                          <span className="text-xs font-semibold text-[#7a8982]">Non envoyé · Démonstration</span>
                        </div>
                        <p className="mt-3 text-sm text-[#5d6e66]">Objet : Re: {message.subject}</p>
                        <textarea
                          aria-label={`Brouillon de réponse à ${message.from.name ?? message.from.email}`}
                          defaultValue={`Bonjour ${message.from.name?.split(" ")[0] ?? ""},\n\nMerci pour votre message. Nous vérifions ce point et revenons vers vous rapidement.\n\nBien cordialement,`}
                          className="mt-3 min-h-36 w-full resize-y rounded-xl border border-[#cad7d1] bg-white p-3 text-sm leading-6 text-[#34483f]"
                        />
                        <p className="mt-2 text-xs text-[#7a8982]">L’envoi sera ajouté uniquement après intégration OAuth et confirmation explicite.</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  primary?: boolean;
  muted?: boolean;
}

function ActionButton({ label, onClick, primary = false, muted = false }: ActionButtonProps) {
  const colorClass = primary
    ? "border-[#195c45] bg-[#195c45] text-white hover:bg-[#104432]"
    : muted
      ? "border-transparent bg-transparent text-[#7b8982] hover:bg-[#f3f5f4]"
      : "border-[#cbd7d1] bg-white text-[#40554b] hover:bg-[#f5f8f6]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-xl border px-3 text-xs font-semibold transition-colors sm:text-sm ${colorClass}`}
    >
      {label}
    </button>
  );
}
