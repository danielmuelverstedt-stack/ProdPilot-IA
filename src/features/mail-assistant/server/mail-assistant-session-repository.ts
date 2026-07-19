import "server-only";
import type { MailAssistantSession } from "@/features/mail-assistant/types/mail-assistant";

export interface MailAssistantSessionRepository {
  get(sessionId: string): Promise<MailAssistantSession | null>;
  save(session: MailAssistantSession): Promise<void>;
}

class LocalMailAssistantSessionRepository implements MailAssistantSessionRepository {
  private readonly sessions = getSharedSessions();
  async get(sessionId: string) { return structuredClone(this.sessions.get(sessionId) ?? null); }
  async save(session: MailAssistantSession) { this.sessions.set(session.id, structuredClone(session)); }
}

interface MailAssistantGlobal { __prodpilotMailAssistantSessions?: Map<string, MailAssistantSession> }
function getSharedSessions() {
  const shared = globalThis as typeof globalThis & MailAssistantGlobal;
  return shared.__prodpilotMailAssistantSessions ??= new Map<string, MailAssistantSession>();
}

export const mailAssistantSessionRepository: MailAssistantSessionRepository = new LocalMailAssistantSessionRepository();
