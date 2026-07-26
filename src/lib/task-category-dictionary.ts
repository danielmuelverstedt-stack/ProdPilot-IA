/**
 * Dictionnaire des catégories de tâche ERP (colonne `Code_Tâche` des exports Details),
 * fourni par l'utilisateur. Les codes 1 et 2 existent dans l'ERP mais leur signification
 * n'est pas encore connue : ils ne sont volontairement pas dans ce dictionnaire et retombent
 * sur le libellé générique `UNKNOWN_TASK_CATEGORY_LABEL`, comme tout futur code inattendu.
 *
 * Vit dans `src/lib/` (et non dans une feature précise) car réutilisé à la fois par l'import ERP
 * (filtre de visibilité des opérations par catégorie) et par le Parc Machines (catégorisation
 * manuelle des machines) : aucune des deux features ne doit dépendre de l'autre pour ce
 * vocabulaire partagé.
 */
export const TASK_CATEGORY_LABELS: Record<string, string> = {
  "0": "Non défini",
  "3": "Affûtage",
  "4": "Rectification cylindrique",
  "5": "Tournage",
  "6": "Décolletage",
  "7": "Sciage",
  "8": "Laser",
  "9": "Pliage",
  "10": "Ajustage",
  "11": "Forage/Taraudage",
  "12": "Sablage",
  "13": "Microbillage",
  "14": "Soudure",
  "15": "Ebavurage",
  "16": "Passivation",
  "17": "Lavage",
  "18": "Peinture",
  "19": "Montage",
  "20": "Contrôle Qualité",
  "21": "Emballage",
  "22": "Service",
  "23": "Maintenance/entretien",
  "24": "Transport",
  "25": "Travaux internes",
  "26": "Tournage/Fraisage",
  "27": "Fraisage",
  "28": "Cisaillage",
  "29": "Marquage",
  "30": "T. Thermique",
  "31": "T. Surface",
  "32": "T. Non destructif",
  "33": "Dessin",
  "34": "Maintenance machine",
  "35": "Pinçonnage",
  "36": "Mortaisage",
  "37": "Rectification plane",
  "38": "Cintrage",
  "39": "Découpe fil",
  "40": "Combiné Laser-poinçonnage",
  "41": "Tournage Cots",
  "42": "Réception marchandises",
};

/** Codes connus, triés numériquement (et non lexicographiquement : "10" doit suivre "9"). */
export const TASK_CATEGORY_CODES: string[] = Object.keys(TASK_CATEGORY_LABELS).sort((a, b) => Number(a) - Number(b));

export const UNKNOWN_TASK_CATEGORY_LABEL = "Catégorie inconnue";

/** Valeur sentinelle pour « Non catégorisées » dans les filtres/regroupements par catégorie (Parc Machines, Planning, Atelier) — jamais une clé réelle de `TASK_CATEGORY_LABELS`. */
export const UNCATEGORIZED_TASK_CATEGORY_VALUE = "none";

export function getTaskCategoryLabel(taskCode: string): string {
  return TASK_CATEGORY_LABELS[taskCode] ?? UNKNOWN_TASK_CATEGORY_LABEL;
}
