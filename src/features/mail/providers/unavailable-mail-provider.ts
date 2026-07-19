import "server-only";

import { getMailProviderDefinition } from "@/features/mail/config/mail-provider-catalog";
import type { MailProvider } from "@/features/mail/services/mail-provider";
import type { MailProviderLabel } from "@/features/mail-management/types/mail-management";
import type {
  MailAccount,
  MailConnectionStatus,
  MailDraft,
  MailboxStatistics, MailMessage,
  MailProviderType,
  MailThread,
} from "@/features/mail/types/mail";

export class UnavailableMailProvider implements MailProvider {
  readonly name: string;
  readonly description: string;
  readonly isAvailable = false;
  readonly isMock = false;

  constructor(readonly type: Exclude<MailProviderType, "google" | "mock">) {
    const definition = getMailProviderDefinition(type);
    this.name = definition.label;
    this.description = definition.description;
  }

  async connect(): Promise<MailAccount> { return this.unavailable(); }
  async disconnect(): Promise<void> { return this.unavailable(); }
  async testConnection(): Promise<MailConnectionStatus> { return this.getConnectionStatus(); }
  async listMessages(): Promise<MailMessage[]> { return this.unavailable(); }
  async getMailboxStatistics(): Promise<MailboxStatistics> { return this.unavailable(); }
  async getMessage(): Promise<MailMessage | null> { return this.unavailable(); }
  async getThread(): Promise<MailThread | null> { return this.unavailable(); }
  async searchMessages(): Promise<MailMessage[]> { return this.unavailable(); }
  async createDraft(): Promise<MailDraft> { return this.unavailable(); }
  async archiveMessage(): Promise<void> { return this.unavailable(); }
  async getManagementPermission(): Promise<{ canModifyMail: boolean; reconnectRequired: boolean }> { return { canModifyMail: false, reconnectRequired: true }; }
  async listLabels(): Promise<MailProviderLabel[]> { return this.unavailable(); }
  async ensureLabels(): Promise<MailProviderLabel[]> { return this.unavailable(); }
  async modifyLabels(): Promise<MailMessage[]> { return this.unavailable(); }

  async getConnectionStatus(): Promise<MailConnectionStatus> {
    return { provider: this.type, state: "unavailable", emailAddress: null, connectedAt: null };
  }

  private unavailable(): never {
    throw new Error(`La connexion ${this.name} n’est pas encore disponible.`);
  }
}
