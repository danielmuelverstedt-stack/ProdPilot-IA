import type { AppSettings } from "@/features/settings/types/settings";

/**
 * Identité de démonstration active — même heuristique déjà dupliquée dans plusieurs écrans
 * (`AppShell.tsx`, `PlanningWorkshopView.tsx`, `ErpPlanningWorkspace.tsx`…) : le premier utilisateur
 * actif dont le rôle correspond au rôle de démonstration sélectionné, à défaut le premier
 * utilisateur. L'application n'ayant pas d'authentification réelle, cette identité ne sert qu'à des
 * usages cosmétiques (ex. filtrage d'affichage) — jamais à une restriction d'accès effective.
 */
export function currentDemoUserId(settings: AppSettings): string | null {
  const role = settings.roles.find((item) => item.id === settings.activeRoleId) ?? settings.roles[0];
  const user = settings.users.find((item) => item.roleId === role?.id && item.active) ?? settings.users[0];
  return user?.id ?? null;
}

/** Même résolution que `currentDemoUserId`, mais renvoie le nom affichable — source unique pour l'auteur d'un commentaire/historique et le filtre « Mes actions », repli sur « Utilisateur » sans identité connue. */
export function currentDemoUserName(settings: AppSettings): string {
  const role = settings.roles.find((item) => item.id === settings.activeRoleId) ?? settings.roles[0];
  const user = settings.users.find((item) => item.roleId === role?.id && item.active) ?? settings.users[0];
  return user ? `${user.firstName} ${user.lastName}`.trim() : "Utilisateur";
}
