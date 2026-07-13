import "server-only";

import { mockMailMessages } from "@/features/mail/mock/mail-messages";
import { MockMailProvider } from "@/features/mail/mock/MockMailProvider";

export class MockGoogleMailProvider extends MockMailProvider {
  constructor() {
    super({
      type: "google",
      name: "Google Workspace",
      description: "Aperçu de Gmail avec un compte et des messages de démonstration.",
      accountId: "google-workspace-mock",
      emailAddress: "production@exemple.fr",
      messages: mockMailMessages.filter((message) => message.provider === "google"),
    });
  }
}
