import "server-only";
import { randomUUID } from "node:crypto";
import { classifyMailForAssistant, createMailAssistantBrief } from "@/features/mail-assistant/services/mail-assistant-classifier";
import { canExecuteMailCommand } from "@/features/mail-assistant/services/mail-approval-engine";
import { interpretMailAssistantCommand } from "@/features/mail-assistant/services/mail-command-interpreter";
import { mailAssistantSessionRepository } from "@/features/mail-assistant/server/mail-assistant-session-repository";
import { getActiveMailContext, listActiveMailMessages } from "@/features/mail/services/mail-account-context";
import type { CreateMailDraftInput } from "@/features/mail/types/mail";
import type { MailAssistantAuditEvent, MailAssistantReplyProposal, MailAssistantSession, MailAssistantSessionMessage } from "@/features/mail-assistant/types/mail-assistant";

export async function startMailAssistantSession(): Promise<MailAssistantSession> {
  const { account, messages } = await listActiveMailMessages({ limit: 25 });
  const now = new Date().toISOString();
  const sessionMessages = messages.map((message, index) => ({ ...message, sessionNumber: index + 1, classification: classifyMailForAssistant(message), processed: false, ignored: false }));
  const brief = createMailAssistantBrief(sessionMessages.map((message) => message.classification));
  const replies = sessionMessages.filter((message) => message.classification.requiresReply).map((message) => createReplyProposal(message, now));
  const intro = `Vous avez reçu ${brief.newMessages} nouveau${brief.newMessages > 1 ? "x" : ""} message${brief.newMessages > 1 ? "s" : ""}. ${brief.noReply} ne nécessite${brief.noReply > 1 ? "nt" : ""} probablement aucune réponse. ${brief.replies} nécessite${brief.replies > 1 ? "nt" : ""} une réponse, ${brief.actions} peu${brief.actions > 1 ? "vent" : "t"} devenir une action et ${brief.urgent} semble${brief.urgent > 1 ? "nt" : ""} urgent${brief.urgent > 1 ? "s" : ""}. ${brief.explanation}`;
  const session: MailAssistantSession = {
    id: randomUUID(), account: { id: account.id, displayName: account.displayName, emailAddress: account.emailAddress, provider: account.provider, mode: account.mode }, status: "ready", startedAt: now, endedAt: null,
    messages: sessionMessages, replies, conversation: [{ id: randomUUID(), role: "assistant", text: intro, createdAt: now }],
    audits: sessionMessages.map((message) => audit(account.id, "classification_proposed", [message.id], now)), draftsCreated: [], actionsCreated: [], pendingApproval: null, lastExecutedCommand: null, errors: [],
  };
  await mailAssistantSessionRepository.save(session);
  return session;
}

export async function executeMailAssistantText(sessionId: string, text: string): Promise<MailAssistantSession> {
  const session = await requireCurrentSession(sessionId);
  const command = interpretMailAssistantCommand(text, session.messages, session.pendingApproval?.intent);
  session.conversation.push({ id: randomUUID(), role: "user", text, createdAt: new Date().toISOString() });
  session.lastExecutedCommand = command;
  const authorization = canExecuteMailCommand(command);
  if (!authorization.allowed) return respondAndSave(session, authorization.reason ?? "Cette instruction ne peut pas être exécutée.");
  if (command.intent === "finish_session") { session.status = "finished"; session.endedAt = new Date().toISOString(); return respondAndSave(session, createFinishSummary(session)); }
  if (command.intent === "undo" || command.intent === "redo") return moveReplyVersion(session, command.messageIds, command.intent);
  if (command.intent === "modify_reply") return modifyReply(session, command.messageIds, command.instruction ?? text);
  if (command.intent === "ignore_message") return ignoreMessages(session, command.messageIds);
  if (command.intent === "mark_processed") return approveReplies(session, command.messageIds);
  if (command.intent === "create_action") return createActions(session, command.messageIds, text);
  if (command.intent === "create_draft" || command.intent === "send_email") return createDrafts(session, command.messageIds, command.intent === "send_email");
  if (/réponses? (?:sont )?(?:bonnes?|prêtes?|validées?)/i.test(text)) { session.pendingApproval = { intent: "create_draft", messageIds: session.replies.filter((reply) => reply.status === "pending").map((reply) => reply.messageId), level: 2 }; return respondAndSave(session, "Je peux créer les brouillons correspondants. Dites « OK » ou « Prépare les brouillons ». Aucun message ne sera envoyé."); }
  if (/^(ok|oui|d’accord|fais-le)[.!\s]*$/i.test(text) && !session.pendingApproval) return respondAndSave(session, "D’accord. Indiquez l’action à effectuer : préparer les brouillons, créer une action ou modifier une réponse.");
  return respondAndSave(session, "Je peux modifier une proposition, préparer les brouillons, créer une action locale, ignorer un message ou terminer la session.");
}

async function requireCurrentSession(sessionId: string) {
  const session = await mailAssistantSessionRepository.get(sessionId);
  if (!session) throw new Error("La session mails est introuvable ou a expiré.");
  const { account } = await getActiveMailContext();
  if (account.id !== session.account.id) throw new Error("Le compte actif a changé. Démarrez une nouvelle session pour éviter tout mélange de comptes.");
  return session;
}

async function createDrafts(session: MailAssistantSession, ids: string[], sendRequested: boolean) {
  const targets = ids.length ? ids : session.replies.filter((reply) => reply.status === "pending").map((reply) => reply.messageId);
  if (!targets.length) return respondAndSave(session, "Aucune réponse prête ne correspond à cette instruction.");
  const { account, provider } = await getActiveMailContext();
  const succeeded: string[] = [], failed: string[] = [], skipped: string[] = [];
  session.pendingApproval = null;
  if (sendRequested) session.audits.push(audit(account.id, "send_explicitly_requested", targets));
  session.audits.push(audit(account.id, "draft_creation_approved", targets));
  for (const messageId of targets) {
    if (session.draftsCreated.includes(messageId)) { skipped.push(messageId); continue; }
    const message = session.messages.find((item) => item.id === messageId);
    const reply = session.replies.find((item) => item.messageId === messageId);
    if (!message || !reply || message.accountId !== account.id) { failed.push(messageId); continue; }
    const current = reply.versions[reply.currentVersion];
    try {
      const input: CreateMailDraftInput = { to: reply.recipients, subject: reply.subject, bodyText: current.bodyText, replyToMessageId: message.id, replyToThreadId: message.threadId };
      await provider.createDraft(input);
      const verified = await getActiveMailContext();
      if (verified.account.id !== account.id) throw new Error("Le compte actif a changé.");
      session.draftsCreated.push(messageId); reply.status = "draft_created"; succeeded.push(messageId); session.audits.push(audit(account.id, "draft_created", [messageId]));
    } catch { failed.push(messageId); session.audits.push(audit(account.id, "execution_failure", [messageId])); }
  }
  const demo = account.mode === "demo" ? " Les brouillons sont simulés en mode démonstration et n’ont pas affecté Gmail." : "";
  const send = sendRequested ? " L’envoi direct n’est pas activé : aucun message n’a été envoyé." : " Aucun message n’a été envoyé.";
  return respondAndSave(session, `${succeeded.length} brouillon${succeeded.length > 1 ? "s ont" : " a"} été créé${succeeded.length > 1 ? "s" : ""}. ${failed.length} échec${failed.length > 1 ? "s" : ""}, ${skipped.length} ignoré${skipped.length > 1 ? "s" : ""}.${demo}${send}`);
}

function modifyReply(session: MailAssistantSession, ids: string[], instruction: string) {
  if (ids.length !== 1) return respondAndSave(session, ids.length ? "La modification doit viser une seule proposition." : "Quelle proposition souhaitez-vous modifier ?");
  const reply = session.replies.find((item) => item.messageId === ids[0]);
  if (!reply) return respondAndSave(session, "Aucune proposition de réponse ne correspond à ce message.");
  const previous = reply.versions[reply.currentVersion].bodyText;
  const bodyText = deterministicRewrite(previous, instruction);
  reply.versions = reply.versions.slice(0, reply.currentVersion + 1);
  reply.versions.push({ id: randomUUID(), bodyText, createdAt: new Date().toISOString(), source: "assistant", instruction });
  reply.currentVersion = reply.versions.length - 1;
  session.audits.push(audit(session.account.id, "reply_modified", ids));
  return respondAndSave(session, `La proposition n° ${session.messages.find((item) => item.id === ids[0])?.sessionNumber} a été mise à jour. Vous pouvez encore la corriger avant de préparer le brouillon.`);
}

function moveReplyVersion(session: MailAssistantSession, ids: string[], intent: "undo" | "redo") {
  const candidates = ids.length ? session.replies.filter((reply) => ids.includes(reply.messageId)) : session.replies.filter((reply) => reply.status === "pending");
  if (candidates.length !== 1) return respondAndSave(session, "Précisez la proposition pour laquelle vous souhaitez annuler ou rétablir une version.");
  const reply = candidates[0];
  const next = intent === "undo" ? reply.currentVersion - 1 : reply.currentVersion + 1;
  if (next < 0 || next >= reply.versions.length) return respondAndSave(session, intent === "undo" ? "Aucune version antérieure n’est disponible." : "Aucune version suivante n’est disponible.");
  reply.currentVersion = next;
  return respondAndSave(session, intent === "undo" ? "La version précédente a été restaurée." : "La version suivante a été rétablie.");
}

function ignoreMessages(session: MailAssistantSession, ids: string[]) { if (!ids.length) return respondAndSave(session, "Quel message souhaitez-vous ignorer ?"); for (const id of ids) { const message = session.messages.find((item) => item.id === id); if (message) { message.ignored = true; session.audits.push(audit(session.account.id, "message_ignored", [id])); } } return respondAndSave(session, `${ids.length} message${ids.length > 1 ? "s ont" : " a"} été ignoré${ids.length > 1 ? "s" : ""} dans cette session uniquement.`); }
function approveReplies(session: MailAssistantSession, ids: string[]) { if (!ids.length) return respondAndSave(session, "Quelle proposition souhaitez-vous valider ?"); let approved = 0; for (const id of ids) { const reply = session.replies.find((item) => item.messageId === id); if (reply && reply.status === "pending") { reply.status = "approved"; approved += 1; } } return respondAndSave(session, `${approved} proposition${approved > 1 ? "s ont" : " a"} été validée${approved > 1 ? "s" : ""}. Je peux maintenant préparer ${approved > 1 ? "les brouillons" : "le brouillon"}.`); }
function createActions(session: MailAssistantSession, ids: string[], text: string) { if (!ids.length) return respondAndSave(session, "À quel message cette action doit-elle être reliée ?"); for (const id of ids) { const key = `${id}:${text.toLocaleLowerCase("fr")}`; if (!session.actionsCreated.includes(key)) session.actionsCreated.push(key); } session.audits.push(audit(session.account.id, "action_created", ids)); return respondAndSave(session, `${ids.length} action${ids.length > 1 ? "s locales ont" : " locale a"} été créée${ids.length > 1 ? "s" : ""} dans la session. Aucune donnée externe n’a été modifiée.`); }
async function respondAndSave(session: MailAssistantSession, text: string) { session.conversation.push({ id: randomUUID(), role: "assistant", text, createdAt: new Date().toISOString() }); await mailAssistantSessionRepository.save(session); return session; }
function createReplyProposal(message: MailAssistantSessionMessage, now: string): MailAssistantReplyProposal { const greeting = message.from.name ? `Bonjour ${message.from.name.split(" ")[0]},` : "Bonjour,"; return { messageId: message.id, recipients: [message.from], subject: message.subject.startsWith("Re:") ? message.subject : `Re: ${message.subject}`, reason: message.classification.reason, confidence: message.classification.confidence, detectedDeadline: /avant midi/i.test(message.bodyText) ? "Avant midi" : null, versions: [{ id: randomUUID(), bodyText: `${greeting}\n\nMerci pour votre message. Nous vérifions les éléments disponibles et revenons vers vous avec une confirmation.\n\nCordialement,`, createdAt: now, source: "assistant" }], currentVersion: 0, isManuallyEdited: false, status: "pending" }; }
function deterministicRewrite(value: string, instruction: string) { const text = instruction.toLocaleLowerCase("fr"); if (/plus court/.test(text)) return value.split("\n").filter(Boolean).slice(0, 3).join("\n\n"); if (/diplomatique/.test(text)) return value.replace("Nous vérifions", "Nous prenons le soin de vérifier"); if (/plus direct/.test(text)) return value.replace("Merci pour votre message. ", ""); const addition = instruction.match(/(?:ajoute (?:que )?|dis plutôt (?:que )?)(.+?)(?:, puis|\.|$)/i)?.[1]; return addition ? value.replace("\n\nCordialement,", `\n\n${addition.charAt(0).toUpperCase()}${addition.slice(1)}.\n\nCordialement,`) : value; }
function createFinishSummary(session: MailAssistantSession) { const elapsed = Math.max(1, Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)); return `Session mails terminée. ${session.messages.length} messages analysés, ${session.replies.length} réponses proposées, ${session.draftsCreated.length} brouillons créés, ${session.actionsCreated.length} actions locales et ${session.errors.length} erreur. Temps passé : ${elapsed} min.`; }
function audit(accountId: string, type: MailAssistantAuditEvent["type"], messageIds: string[], createdAt = new Date().toISOString()): MailAssistantAuditEvent { return { id: randomUUID(), type, accountId, messageIds, createdAt }; }
