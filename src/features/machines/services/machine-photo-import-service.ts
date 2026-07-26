import type { MachineSettings } from "@/features/settings/types/settings";

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fileBaseName(fileName: string): string {
  return fileName.replace(/\.[a-z0-9]+$/i, "");
}

/**
 * Associe un fichier image à une machine du référentiel en comparant son nom
 * (sans extension) au nom technique, au nom affiché puis à l'identifiant de chaque
 * machine. Deux niveaux de tolérance, tous deux stricts (aucune correspondance
 * approximative pour éviter d'associer une photo à la mauvaise machine) : normalisation
 * exacte, puis normalisation sans espaces pour absorber un espacement différent
 * autour d'un modèle (« LB15 » contre « LB 15 »).
 */
export function findMachineForFileName(machines: MachineSettings[], fileName: string): MachineSettings | undefined {
  const base = fileBaseName(fileName);
  const target = normalizeLabel(base);
  if (!target) return undefined;
  const candidateLabels = (machine: MachineSettings) => [machine.name, machine.displayName, machine.id];

  const exact = machines.find((machine) => candidateLabels(machine).some((label) => normalizeLabel(label) === target));
  if (exact) return exact;

  const targetCompact = target.replace(/ /g, "");
  return machines.find((machine) => candidateLabels(machine).some((label) => normalizeLabel(label).replace(/ /g, "") === targetCompact));
}
