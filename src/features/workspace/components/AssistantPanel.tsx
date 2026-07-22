"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemoData } from "@/features/demo/services/demo-repository";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { completeAction, createAction, postponeAction, reassignAction, setRemark } from "@/features/actions/services/action-service";
import { interpretActionAssistantMessage, isCancellation, isConfirmation, type ActionAssistantProposal } from "@/features/actions/services/action-assistant-interpreter";
import { interpretCalendarAssistantMessage, isCalendarAssistantRequest, type CalendarAssistantProposal } from "@/features/calendar/services/calendar-assistant-interpreter";
import type { CalendarEvent } from "@/features/calendar/types/calendar";

interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  href?: string;
  linkLabel?: string;
}

const MAIL_COMPOSE_HANDOFF_KEY = "prodpilot.mail-assistant.handoff";
const MAIL_COMPOSE_INTENT = /\b(écris|écrit|rédige|prépare)\b.*\b(mail|e-?mail|courriel)\b/i;

const INTRO: AssistantMessage = {
  id: "intro",
  role: "assistant",
  text: "Demandez-moi par exemple « revue des actions », « qu’est-ce que j’ai aujourd’hui » ou « planifie une réunion à 14h ». Je propose toujours une reformulation avant d’appliquer un changement.",
};

function applyActionProposal(proposal: ActionAssistantProposal, introduitPar: string): string {
  if (proposal.kind === "complete" && proposal.actionId) { completeAction(proposal.actionId); return `${proposal.actionId} est marquée Fait.`; }
  if (proposal.kind === "postpone" && proposal.actionId && proposal.echeance) { postponeAction(proposal.actionId, proposal.echeance); return `${proposal.actionId} est reportée.`; }
  if (proposal.kind === "reassign" && proposal.actionId && proposal.responsable) { reassignAction(proposal.actionId, proposal.responsable); return `${proposal.actionId} est réassignée à ${proposal.responsable}.`; }
  if (proposal.kind === "remark" && proposal.actionId && proposal.remarque) { setRemark(proposal.actionId, proposal.remarque); return `La remarque a été ajoutée sur ${proposal.actionId}.`; }
  if (proposal.kind === "create" && proposal.description && proposal.responsable && proposal.echeance) {
    const id = createAction({ description: proposal.description, responsable: proposal.responsable, echeance: proposal.echeance, origine: proposal.origine ?? "IA", introduitPar });
    return `${id} a été créée dans le registre.`;
  }
  return "Rien n’a pu être appliqué.";
}

async function applyCalendarProposal(proposal: CalendarAssistantProposal): Promise<string> {
  const start = new Date(`${proposal.dateIso}T${proposal.startTime}:00`);
  const end = new Date(`${proposal.dateIso}T${proposal.endTime}:00`);
  const response = await fetch("/api/calendar/events/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmed: true, title: proposal.title, start: start.toISOString(), end: end.toISOString(), attendees: proposal.attendeeEmail ? [{ email: proposal.attendeeEmail }] : [] }),
  });
  const payload = await response.json() as { message?: string };
  if (!response.ok) throw new Error(payload.message ?? "La création de l’événement a échoué.");
  return `« ${proposal.title} » a été planifiée dans votre calendrier. Ouvrez Réglages → Connexions → Calendrier si vous voulez vérifier le compte utilisé.`;
}

export function AssistantPanel({ todayEvents }: { todayEvents: CalendarEvent[] }) {
  const data = useDemoData();
  const { settings } = useSettings();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<AssistantMessage[]>([INTRO]);
  const [pendingActionProposal, setPendingActionProposal] = useState<ActionAssistantProposal | null>(null);
  const [pendingCalendarProposal, setPendingCalendarProposal] = useState<CalendarAssistantProposal | null>(null);
  const [lastActionId, setLastActionId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const activeUser = settings.users.find((user) => user.active);
  const introduitPar = activeUser ? `${activeUser.firstName} ${activeUser.lastName}` : "Assistant";

  function appendMessages(...entries: AssistantMessage[]) {
    setConversation((current) => [...current, ...entries]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text || isBusy) return;
    const userMessage: AssistantMessage = { id: crypto.randomUUID(), role: "user", text };

    if (MAIL_COMPOSE_INTENT.test(text) && !/répond|réponse/i.test(text)) {
      window.sessionStorage.setItem(MAIL_COMPOSE_HANDOFF_KEY, text);
      appendMessages(userMessage, { id: crypto.randomUUID(), role: "assistant", text: "La rédaction de mails se fait dans le Mail Copilot, avec le contexte de production et une confirmation avant tout envoi.", href: "/mails/assistant", linkLabel: "Ouvrir le Mail Copilot avec cette demande" });
      setMessage("");
      return;
    }

    if (pendingCalendarProposal) {
      if (isConfirmation(text)) {
        appendMessages(userMessage);
        setMessage("");
        setIsBusy(true);
        try {
          const confirmation = await applyCalendarProposal(pendingCalendarProposal);
          appendMessages({ id: crypto.randomUUID(), role: "assistant", text: confirmation });
        } catch (error) {
          appendMessages({ id: crypto.randomUUID(), role: "assistant", text: error instanceof Error ? error.message : "La création de l’événement a échoué." });
        } finally {
          setPendingCalendarProposal(null);
          setIsBusy(false);
        }
        return;
      }
      if (isCancellation(text)) {
        appendMessages(userMessage, { id: crypto.randomUUID(), role: "assistant", text: "D’accord, rien n’a été modifié." });
        setPendingCalendarProposal(null);
        setMessage("");
        return;
      }
    }

    if (pendingActionProposal) {
      if (isConfirmation(text)) {
        const confirmation = applyActionProposal(pendingActionProposal, introduitPar);
        appendMessages(userMessage, { id: crypto.randomUUID(), role: "assistant", text: confirmation });
        setPendingActionProposal(null);
        setMessage("");
        return;
      }
      if (isCancellation(text)) {
        appendMessages(userMessage, { id: crypto.randomUUID(), role: "assistant", text: "D’accord, rien n’a été modifié." });
        setPendingActionProposal(null);
        setMessage("");
        return;
      }
    }

    if (isCalendarAssistantRequest(text)) {
      const outcome = interpretCalendarAssistantMessage(text, todayEvents);
      appendMessages(userMessage, { id: crypto.randomUUID(), role: "assistant", text: outcome.reply });
      setPendingCalendarProposal(outcome.proposal);
      setMessage("");
      return;
    }

    const outcome = interpretActionAssistantMessage(text, data.actions, lastActionId);
    appendMessages(userMessage, { id: crypto.randomUUID(), role: "assistant", text: outcome.reply });
    setPendingActionProposal(outcome.proposal);
    if (outcome.referencedActionId) setLastActionId(outcome.referencedActionId);
    setMessage("");
  }

  return (
    <section aria-labelledby="assistant-title" className="mt-8 overflow-hidden rounded-3xl bg-[#123d30] p-6 text-white shadow-[0_20px_55px_rgba(18,61,48,0.18)] sm:p-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/70">Assistant ProdPilot</p>
        <h2 id="assistant-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Revue des actions et de l’agenda</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-50/70">Assistant local · aucune donnée ne quitte l’application sans votre confirmation. Toute modification est reformulée puis appliquée seulement après votre accord.</p>
      </div>
      <div aria-live="polite" className="mt-6 max-h-72 space-y-2 overflow-y-auto pr-1">
        {conversation.map((entry) => <div key={entry.id} className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${entry.role === "user" ? "ml-auto max-w-[85%] bg-white/15" : "max-w-[95%] bg-white/10"}`}>
          <p>{entry.text}</p>
          {entry.href ? <Link href={entry.href} className="mt-2 inline-block font-semibold underline">{entry.linkLabel ?? "Ouvrir"}</Link> : null}
        </div>)}
      </div>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4">
        <label htmlFor="assistant-message" className="sr-only">Votre demande à l’assistant</label>
        <textarea
          id="assistant-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Exemple : qu’est-ce que j’ai aujourd’hui ?"
          className="min-h-20 w-full resize-y rounded-2xl border border-white/15 bg-white/10 p-4 text-base text-white placeholder:text-emerald-50/45 focus:bg-white/12"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button type="submit" disabled={isBusy} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#123d30] hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">{isBusy ? "Planification…" : "Envoyer"}</button>
        </div>
      </form>
    </section>
  );
}
