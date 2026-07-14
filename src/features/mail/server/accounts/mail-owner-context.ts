import "server-only";

export interface MailOwnerContext {
  userId: string;
  companyId: string;
  isAdministrator: boolean;
}

/**
 * Identité serveur temporaire pour le développement local.
 * Elle devra être remplacée par l'identité de session authentifiée avant la production.
 */
export function getCurrentMailOwnerContext(): MailOwnerContext {
  return {
    userId: "local-development-user",
    companyId: "local-development-company",
    isAdministrator: true,
  };
}
