import "server-only";

import type { MailProvider } from "@/features/mail/services/mail-provider";
import type {
  MailAccount,
  MailConnectionStatus,
  MailDraft,
  MailMessage,
  MailThread,
} from "@/features/mail/types/mail";

export class MicrosoftMailProvider implements MailProvider {
  readonly type = "microsoft" as const;
  readonly name = "Microsoft 365";
  readonly description =
    "La connexion à Outlook via Microsoft Graph sera disponible dans une prochaine étape.";
  readonly isAvailable = false;
  readonly isMock = false;

  async connect(): Promise<MailAccount> {
    return this.unavailable();
  }

  async disconnect(): Promise<void> {
    return this.unavailable();
  }

  async getConnectionStatus(): Promise<MailConnectionStatus> {
    return {
      provider: this.type,
      state: "unavailable",
      emailAddress: null,
      connectedAt: null,
    };
  }

  async listMessages(): Promise<MailMessage[]> {
    return this.unavailable();
  }

  async getMessage(): Promise<MailMessage | null> {
    return this.unavailable();
  }

  async getThread(): Promise<MailThread | null> {
    return this.unavailable();
  }

  async searchMessages(): Promise<MailMessage[]> {
    return this.unavailable();
  }

  async createDraft(): Promise<MailDraft> {
    return this.unavailable();
  }

  async sendDraft(): Promise<MailMessage> {
    return this.unavailable();
  }

  async archiveMessage(): Promise<void> {
    return this.unavailable();
  }

  private unavailable(): never {
    throw new Error(
      "La connexion Microsoft 365 n’est pas encore disponible.",
    );
  }
}
