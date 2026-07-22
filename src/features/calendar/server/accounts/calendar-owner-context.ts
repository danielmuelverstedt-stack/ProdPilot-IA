import "server-only";

export interface CalendarOwnerContext {
  userId: string;
  companyId: string;
  isAdministrator: boolean;
}

/**
 * Identité serveur temporaire pour le développement local.
 * Elle devra être remplacée par l'identité de session authentifiée avant la production.
 */
export function getCurrentCalendarOwnerContext(): CalendarOwnerContext {
  return {
    userId: "local-development-user",
    companyId: "local-development-company",
    isAdministrator: true,
  };
}
