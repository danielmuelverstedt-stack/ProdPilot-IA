import { parseRelativeFrenchDate } from "@/features/actions/services/action-assistant-interpreter";
import type { CalendarEvent } from "@/features/calendar/types/calendar";

export interface CalendarAssistantProposal {
  kind: "create_event";
  title: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  attendeeEmail: string | null;
}

export interface CalendarAssistantOutcome {
  reply: string;
  proposal: CalendarAssistantProposal | null;
}

const AGENDA_QUERY_PATTERN = /qu.est-ce que j.ai|mon planning|mon agenda du jour|mes r[ée]unions (?:du jour|d.aujourd.hui|aujourd.hui)|programme du jour|qu.ai-je aujourd.hui/i;
const CREATE_EVENT_PATTERN = /\b(planifie|programme|organise)\b.*\b(r[ée]union|rendez-vous|rdv|point|call)\b/i;

const timeFormatter = new Intl.DateTimeFormat("fr-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });

export function isCalendarAssistantRequest(rawText: string): boolean {
  const normalized = rawText.trim().toLocaleLowerCase("fr");
  return AGENDA_QUERY_PATTERN.test(normalized) || CREATE_EVENT_PATTERN.test(normalized);
}

/** Interprète une commande en langage naturel sur l'agenda du jour, entièrement en local (aucun appel IA payant). */
export function interpretCalendarAssistantMessage(rawText: string, events: CalendarEvent[], today = new Date().toISOString().slice(0, 10)): CalendarAssistantOutcome {
  const text = rawText.trim();
  const normalized = text.toLocaleLowerCase("fr");

  if (CREATE_EVENT_PATTERN.test(normalized)) {
    const dateIso = parseRelativeFrenchDate(text, today) ?? today;
    const times = extractTimes(normalized);
    if (!times) return { reply: "À quelle heure souhaitez-vous planifier cette réunion ? Précisez par exemple « à 14h » ou « de 14h à 15h ».", proposal: null };
    const title = extractTitle(text);
    const attendeeEmail = extractAttendeeEmail(text);
    const attendeeNote = attendeeEmail ? ` avec ${attendeeEmail}` : "";
    return {
      reply: `Je vais planifier « ${title} »${attendeeNote} le ${dateIso} de ${times.start} à ${times.end}. Confirmez-vous ?`,
      proposal: { kind: "create_event", title, dateIso, startTime: times.start, endTime: times.end, attendeeEmail },
    };
  }

  if (AGENDA_QUERY_PATTERN.test(normalized)) return { reply: buildAgendaReply(events), proposal: null };

  return { reply: "Je peux résumer votre agenda du jour ou planifier une nouvelle réunion (par exemple : « planifie une réunion avec jean@client.com à 14h pour le point qualité »).", proposal: null };
}

export function buildAgendaReply(events: CalendarEvent[]): string {
  if (!events.length) return "Vous n’avez aucun événement à votre agenda aujourd’hui.";
  const lines = events.map((event) => `- ${timeFormatter.format(new Date(event.start))} : ${event.title}${event.location ? ` (${event.location})` : ""}`);
  return `Voici votre agenda du jour :\n${lines.join("\n")}`;
}

function extractTimes(normalized: string): { start: string; end: string } | null {
  const matches = [...normalized.matchAll(/(\d{1,2})\s*h\s*(\d{2})?/g)].map((match) => `${match[1].padStart(2, "0")}:${match[2] ?? "00"}`);
  if (!matches.length) return null;
  const start = matches[0];
  const end = matches[1] && matches[1] !== start ? matches[1] : addMinutes(start, 30);
  return { start, end };
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = ((hours * 60 + mins + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function extractTitle(text: string): string {
  const afterPour = text.match(/pour\s+(.+?)(?:\s+avec\s|\s+[àa]\s+\d|[.!]|$)/i)?.[1];
  return afterPour?.trim() || "Réunion";
}

function extractAttendeeEmail(text: string): string | null {
  return text.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@.,;]+/)?.[0] ?? null;
}
