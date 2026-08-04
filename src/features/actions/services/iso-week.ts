/**
 * Semaines ISO 8601 (lundi premier jour) pour la planification équipe du module Actions —
 * fichier dédié plutôt que la réutilisation de `getIsoWeek`/`buildMonthDays` de
 * `src/features/planning/services/planning-view.ts` : ce dernier calcule un numéro de semaine
 * borné à la fenêtre glissante de jours du planning machines (jours ouvrés visibles, capacité par
 * jour), alors qu'ici il faut une clé de semaine autonome (« AAAA-Www »), navigable librement dans
 * le temps (mois précédents/suivants), sans notion de jour ouvré.
 *
 * Les clés retournent toujours un numéro de semaine sur 2 chiffres (« W05 », pas « W5 ») pour que
 * la comparaison lexicale de deux clés (`"2026-W05" < "2026-W12"`) donne le bon ordre
 * chronologique sans avoir à reparser — utile pour trier/filtrer `ProductionAction.plannedWeek`
 * sans détour.
 */

export function isoWeekKey(date: Date): string {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function parseIsoWeekKey(key: string): { year: number; week: number } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return null;
  return { year: Number(match[1]), week: Number(match[2]) };
}

/** Lundi (00:00 UTC) de la semaine désignée par `key`, ou `null` si `key` est invalide. */
export function isoWeekStart(key: string): Date | null {
  const parsed = parseIsoWeekKey(key);
  if (!parsed) return null;
  const jan4 = new Date(Date.UTC(parsed.year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (parsed.week - 1) * 7);
  return start;
}

export function addIsoWeeks(key: string, count: number): string {
  const start = isoWeekStart(key);
  if (!start) return key;
  const shifted = new Date(start);
  shifted.setUTCDate(shifted.getUTCDate() + count * 7);
  return isoWeekKey(shifted);
}

/** « S31 » — sans zéro non significatif, pour l'affichage (la clé stockée reste sur 2 chiffres pour le tri). */
export function isoWeekLabel(key: string): string {
  const parsed = parseIsoWeekKey(key);
  return parsed ? `S${parsed.week}` : key;
}

/** « 27/07 – 02/08 », plage de dates de la semaine pour un survol/en-tête détaillé. */
export function isoWeekDateRangeLabel(key: string): string {
  const start = isoWeekStart(key);
  if (!start) return "";
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const formatter = new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

/** Clé de mois « AAAA-MM » du mois contenant le lundi de la semaine — règle explicite pour « le mois contenant sa semaine ». */
export function isoWeekMonthKey(key: string): string {
  const start = isoWeekStart(key);
  if (!start) return key;
  return `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** « Juillet 2026 », libellé d'en-tête pour la vue Mois. */
export function isoMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  const label = new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toLocaleUpperCase("fr") + label.slice(1);
}

export function enumerateIsoWeeks(startKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addIsoWeeks(startKey, index));
}

/** Toutes les clés de mois couvertes par `weekKeys`, dans l'ordre chronologique, sans doublon. */
export function enumerateIsoMonths(weekKeys: string[]): string[] {
  return [...new Set(weekKeys.map(isoWeekMonthKey))];
}
