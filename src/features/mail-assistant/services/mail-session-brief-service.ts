import type { MailAssistantSession, MailAssistantStartSettings, MailOpeningBrief, MailOpeningBriefMetrics } from "@/features/mail-assistant/types/mail-assistant";
import type { MailMemoryRepository } from "@/features/mail-memory/repositories/mail-memory-repository";
import type { LocalAssistantSession, LocalMailMessage, MailMemoryContext, MailMemoryRecord } from "@/features/mail-memory/types/mail-memory";

type PendingRecord = MailMemoryRecord & { status?: string; dueAt?: string | null; sessionId?: string };
export interface CreateBriefInput { repository: MailMemoryRepository; context: MailMemoryContext; session: MailAssistantSession | null; firstName: string; isDemo: boolean; lastSyncAt: string | null; synchronizationAvailable: boolean; settings: MailAssistantStartSettings; now?: Date }

export async function createMailSessionBrief(input: CreateBriefInput): Promise<MailOpeningBrief> {
  const { repository, context, session, settings } = input; const now = input.now ?? new Date();
  const [messages, sessions, replies, drafts, followUps, meetings, actions] = await Promise.all([
    repository.list<LocalMailMessage>("mailMessages", context), repository.list<LocalAssistantSession>("assistantSessions", context),
    repository.list<PendingRecord>("replyProposals", context), repository.list<PendingRecord>("draftReferences", context), repository.list<PendingRecord>("followUps", context),
    repository.list<PendingRecord>("meetingRequests", context), repository.list<PendingRecord>("internalActions", context),
  ]).catch(() => [[], [], [], [], [], [], []] as [LocalMailMessage[], LocalAssistantSession[], PendingRecord[], PendingRecord[], PendingRecord[], PendingRecord[], PendingRecord[]]);
  const today = now.toISOString().slice(0, 10); const current = session?.messages ?? [];
  const metrics: MailOpeningBriefMetrics = {
    newMail: current.filter((message) => !input.lastSyncAt || message.receivedAt > input.lastSyncAt).length,
    unread: messages.filter((message) => !message.isRead).length,
    pendingReplies: replies.filter((item) => item.sessionId !== session?.id && ["pending", "approved"].includes(item.status ?? "")).length + current.filter((message) => message.classification.requiresReply && !message.processed && !message.ignored).length,
    pendingDrafts: settings.includePendingDrafts ? drafts.filter((item) => item.sessionId !== session?.id && item.status === "prepared").length + (session?.draftsCreated.length ?? 0) : 0,
    withoutClassification: current.filter((message) => message.classification.group === "review").length,
    withoutStatus: settings.includeMessagesWithoutStatus ? messages.filter((message) => !message.workflowStatus).length : 0,
    followUpsDueToday: followUps.filter((item) => item.status !== "completed" && item.dueAt?.slice(0, 10) === today).length,
    overdueFollowUps: settings.includeOverdueFollowUps ? followUps.filter((item) => item.status !== "completed" && Boolean(item.dueAt) && item.dueAt!.slice(0, 10) < today).length : 0,
    preparedMeetings: meetings.filter((item) => ["prepared", "awaiting_information"].includes(item.status ?? "")).length,
    openActions: actions.filter((item) => !["completed", "cancelled"].includes(item.status ?? "")).length,
    review: current.filter((message) => message.classification.group === "review").length + messages.filter((message) => message.workflowStatus === "review").length,
    urgent: current.filter((message) => message.classification.isUrgent && !message.ignored).length,
    informational: settings.includeInformationalMessages ? current.filter((message) => message.classification.group === "information").length : 0,
    noAction: current.filter((message) => message.classification.group === "no_action").length,
    unresolvedSessions: sessions.filter((item) => item.sourceId !== session?.id && item.status !== "finished" && item.unresolvedItems.length > 0).reduce((sum, item) => sum + item.unresolvedItems.length, 0), totalPending: 0,
    processedTotal: messages.filter((message) => message.workflowStatus === "processed").length,
    noActionTotal: messages.filter((message) => message.workflowStatus === "no_action").length,
  };
  metrics.totalPending = metrics.pendingReplies + metrics.pendingDrafts + metrics.withoutStatus + metrics.followUpsDueToday + metrics.overdueFollowUps + metrics.preparedMeetings + metrics.openActions + metrics.review + metrics.unresolvedSessions;
  const state = !input.synchronizationAvailable ? "synchronization_unavailable" : metrics.newMail > 0 ? "new_mail" : metrics.totalPending > 0 ? "pending_only" : "up_to_date";
  const text = buildDeterministicBrief(state, metrics, input.firstName, input.isDemo, input.lastSyncAt, settings);
  return { state, text, metrics, lastSyncAt: input.lastSyncAt, isLocalDataStale: !input.lastSyncAt || now.getTime() - new Date(input.lastSyncAt).getTime() > 86_400_000, isDemo: input.isDemo, generation: "deterministic" };
}

export function buildDeterministicBrief(state: MailOpeningBrief["state"], m: MailOpeningBriefMetrics, firstName: string, isDemo: boolean, lastSyncAt: string | null, settings: MailAssistantStartSettings): string {
  const hello = `Bonjour ${firstName}. ${isDemo ? "Mode démonstration. " : ""}`;
  const handled = alreadyHandledSentence(m);
  if (state === "synchronization_unavailable") return `${hello}${handled}Je n’ai pas pu actualiser la boîte. ${lastSyncAt ? `Les données locales datent de ${formatTime(lastSyncAt)}. ` : "Les données locales disponibles sont utilisées. "}${pendingSentence(m)}.`;
  if (state === "up_to_date") return `${hello}${handled}Aucun nouveau mail et aucun élément en attente. Votre boîte est à jour.`;
  const start = state === "new_mail" ? `Vous avez reçu ${count(m.newMail, "nouveau mail", "nouveaux mails")}. ` : "Vous n’avez reçu aucun nouveau mail depuis la dernière synchronisation. ";
  const details = orderedDetails(m).slice(0, Math.max(1, settings.maximumItemsSpoken));
  const follow = settings.askFollowUpQuestion && orderedDetails(m).length > settings.maximumItemsSpoken ? " Souhaitez-vous le détail ?" : "";
  return `${hello}${handled}${start}${details.length ? `Il reste ${joinFrench(details)}. ` : ""}${suggestion(m)}${follow}`.trim();
}
function alreadyHandledSentence(m: MailOpeningBriefMetrics): string {
  const parts = [[m.processedTotal, "mail déjà traité", "mails déjà traités"], [m.noActionTotal, "mail classé sans action nécessaire", "mails classés sans action nécessaire"]].filter(([value]) => Number(value) > 0).map(([value, one, many]) => count(Number(value), String(one), String(many)));
  return parts.length ? `Pour rappel, ${joinFrench(parts)}. ` : "";
}
function orderedDetails(m: MailOpeningBriefMetrics): string[] { return [[m.urgent, "élément urgent", "éléments urgents"], [m.overdueFollowUps, "relance en retard", "relances en retard"], [m.pendingReplies, "réponse à valider", "réponses à valider"], [m.pendingDrafts, "brouillon en attente", "brouillons en attente"], [m.followUpsDueToday, "relance à faire aujourd’hui", "relances à faire aujourd’hui"], [m.withoutStatus, "mail sans statut", "mails sans statut"], [m.review, "mail à vérifier", "mails à vérifier"], [m.informational, "message d’information", "messages d’information"], [m.noAction, "message sans action", "messages sans action"]].filter(([value]) => Number(value) > 0).map(([value, one, many]) => count(Number(value), String(one), String(many))); }
function pendingSentence(m: MailOpeningBriefMetrics): string { return m.totalPending ? `${count(m.totalPending, "élément reste", "éléments restent")} à traiter` : "Aucun élément ne reste à traiter"; }
function suggestion(m: MailOpeningBriefMetrics): string { if (m.pendingReplies) return "Je vous propose de commencer par les réponses à valider."; if (m.overdueFollowUps || m.followUpsDueToday) return "Je vous propose de commencer par les relances."; if (m.withoutStatus || m.review) return "Je vous propose de commencer par les mails à vérifier."; return "Voici votre situation."; }
function count(value: number, one: string, many: string): string { return `${new Intl.NumberFormat("fr-BE").format(value)} ${value === 1 ? one : many}`; }
function joinFrench(values: string[]): string { return values.length < 2 ? values[0] ?? "" : `${values.slice(0, -1).join(", ")} et ${values.at(-1)}`; }
function formatTime(value: string): string { return new Intl.DateTimeFormat("fr-BE", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)).replace(":", " h "); }
