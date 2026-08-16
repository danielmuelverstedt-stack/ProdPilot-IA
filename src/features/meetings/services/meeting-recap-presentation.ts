export interface MeetingRecapSection {
  title: string;
  lines: string[];
}

export interface MeetingRecapGroup {
  title: string;
  details: string[];
}

export interface MeetingRecapPresentation {
  title: string;
  participants: string;
  sections: MeetingRecapSection[];
  disclaimer: string;
  metrics: { dossiers: number; decisions: number; actions: number; terrain: number };
}

const sectionTitles = [
  "Dossiers prioritaires",
  "Maintenance",
  "Remontées terrain",
  "Déroulé de la réunion",
  "Actions créées ou suivies pendant la réunion",
  "Points au parking lot",
] as const;

const sectionIndexes = new Map<string, number>(sectionTitles.map((title, index) => [title, index]));

export function cleanMeetingRecapLine(line: string): string {
  return line.replace(/^\s*-\s*/, "").replace(/^\d+\.\s*/, "").trim();
}

/** Regroupe une ligne principale avec ses précisions pour éviter une succession de blocs sans hiérarchie. */
export function groupMeetingRecapSection(section: MeetingRecapSection): MeetingRecapGroup[] {
  const groups: MeetingRecapGroup[] = [];
  const detailPattern = /^(Échanges|Décision|Commentaire(?:s)?|Machines|OF|Dossiers prioritaires|Action)\s*:/i;
  for (const rawLine of section.lines) {
    const clean = cleanMeetingRecapLine(rawLine);
    if (!clean) continue;
    const isDetail = detailPattern.test(clean);
    const isStepHeading = section.title === "Déroulé de la réunion" && /\s:$/.test(clean) && !isDetail;
    const isPrimary = /^-\s*(?:\d+\.\s*)?/.test(rawLine) && !isDetail;
    if (!groups.length || isPrimary || isStepHeading) groups.push({ title: clean.replace(/\s:$/, ""), details: [] });
    else groups.at(-1)?.details.push(clean);
  }
  return groups;
}

/** Transforme le texte éditable du compte rendu en blocs communs au PDF et à l'e-mail HTML. */
export function parseMeetingRecapDocument(documentBody: string): MeetingRecapPresentation {
  const lines = documentBody.replace(/\r\n/g, "\n").split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  const title = firstContentIndex >= 0 ? lines[firstContentIndex].trim() : "Compte rendu de réunion";
  let participants = "Non renseignés";
  let disclaimer = "";
  const sections: MeetingRecapSection[] = [];
  let current: MeetingRecapSection | null = null;

  for (const rawLine of lines.slice(firstContentIndex + 1)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^Participants\s*:/i.test(line)) { participants = line.replace(/^Participants\s*:\s*/i, "") || "Non renseignés"; continue; }
    if (/^Message généré/i.test(line)) { disclaimer = line; continue; }
    const heading = line.endsWith(":") ? line.slice(0, -1).trim() : "";
    const headingIndex = sectionIndexes.get(heading);
    const currentIndex = current ? sectionIndexes.get(current.title) : undefined;
    // Dans le déroulé, les noms des étapes peuvent être identiques à des rubriques précédentes.
    // Une rubrique de premier niveau suit toujours l'ordre officiel du document.
    if (headingIndex !== undefined && (currentIndex === undefined || headingIndex > currentIndex)) { current = { title: heading, lines: [] }; sections.push(current); continue; }
    if (!current) { current = { title: "Synthèse", lines: [] }; sections.push(current); }
    current.lines.push(rawLine);
  }

  const dossierSection = sections.find((section) => section.title === "Dossiers prioritaires");
  const actionSection = sections.find((section) => section.title === "Actions créées ou suivies pendant la réunion");
  const fieldSection = sections.find((section) => section.title === "Remontées terrain");
  return {
    title,
    participants,
    sections,
    disclaimer,
    metrics: {
      dossiers: dossierSection?.lines.filter((line) => /^\s*-\s*\d+\.\s/.test(line) || /^\d+\.\s/.test(line)).length ?? 0,
      decisions: sections.flatMap((section) => section.lines).filter((line) => /Décision\s*:/i.test(line)).length,
      actions: actionSection?.lines.filter((line) => /^-\s/.test(line)).length ?? 0,
      terrain: fieldSection?.lines.filter((line) => /^-\s/.test(line) && !/^\s*-\s+(Commentaires|Machines|OF|Dossiers prioritaires|Action)\s*:/i.test(line)).length ?? 0,
    },
  };
}
