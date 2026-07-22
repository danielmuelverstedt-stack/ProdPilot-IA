import { getActiveCalendarContext } from "@/features/calendar/services/calendar-account-context";
import { apiError, apiJson, isTrustedSameOriginRequest } from "@/features/mail/server/mail-api-response";
import type { CalendarEventAttendee, CreateCalendarEventInput } from "@/features/calendar/types/calendar";

export const runtime = "nodejs";

interface CreateEventRequestBody {
  confirmed?: unknown;
  title?: unknown;
  description?: unknown;
  location?: unknown;
  start?: unknown;
  end?: unknown;
  attendees?: unknown;
}

export async function POST(request: Request) {
  if (!isTrustedSameOriginRequest(request)) return apiError("La requête de création est refusée.", 403);
  let body: CreateEventRequestBody;
  try { body = await request.json() as CreateEventRequestBody; } catch { return apiError("Le contenu de la demande est invalide.", 400); }
  if (body.confirmed !== true) return apiError("La création de l’événement nécessite une confirmation explicite.", 400);
  if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 300) return apiError("Le titre de l’événement est invalide.", 400);
  if (typeof body.start !== "string" || typeof body.end !== "string" || Number.isNaN(Date.parse(body.start)) || Number.isNaN(Date.parse(body.end)) || Date.parse(body.end) <= Date.parse(body.start)) {
    return apiError("L’horaire de l’événement est invalide.", 400);
  }
  const attendees = parseAttendees(body.attendees);
  if (attendees === null) return apiError("La liste des participants est invalide.", 400);
  if (body.description !== undefined && typeof body.description !== "string") return apiError("La description est invalide.", 400);
  if (body.location !== undefined && typeof body.location !== "string") return apiError("Le lieu est invalide.", 400);

  const input: CreateCalendarEventInput = {
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description : undefined,
    location: typeof body.location === "string" ? body.location : undefined,
    start: body.start,
    end: body.end,
    attendees,
  };
  try {
    const { provider } = await getActiveCalendarContext();
    const event = await provider.createEvent(input);
    return apiJson({ event }, 201);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "La création de l’événement a échoué.", 502);
  }
}

function parseAttendees(value: unknown): CalendarEventAttendee[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) return null;
  const attendees: CalendarEventAttendee[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const email = (item as { email?: unknown }).email;
    const name = (item as { name?: unknown }).name;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    if (name !== undefined && typeof name !== "string") return null;
    attendees.push({ email, name });
  }
  return attendees;
}
