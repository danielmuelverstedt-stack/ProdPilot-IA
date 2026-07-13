import "server-only";

import { getCurrentMailOwnerContext } from "@/features/mail/server/accounts/mail-owner-context";
import type { GoogleTokenKey } from "@/features/mail/server/google/google-token-repository";

export function getGoogleTokenKey(accountId: string): GoogleTokenKey {
  const owner = getCurrentMailOwnerContext();
  return { ...owner, accountId, provider: "google" };
}
