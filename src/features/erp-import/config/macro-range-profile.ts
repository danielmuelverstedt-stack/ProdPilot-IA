export const ERP_TOP_FILE_NAME = "REQ_MacroGamme_Top.xlsx";
export const ERP_DETAILS_FILE_NAME = "REQ_MacroGamme_Details.xlsx";

export const ERP_TOP_HEADERS = [
  "Status", "Nouveau_Délais", "Code_Article", "Description", "IDArticles", "IDArticle_Grp_1",
  "Num_OF", "Nom", "CDE_Client_Num", "CDE_Client_Poste", "Délai_Confirmé", "Délais",
  "Qté_Cdée", "Réf_Cde_Client", "Expr1", "OF_Cde", "Statut_Ligne_Cde", "Resp_Cde_OF",
  "IDCde_Clients_Detail",
] as const;

export const ERP_DETAILS_HEADERS = [
  "Num_OF", "Operation_Num", "IDOperation_Status", "Code_Tâche", "debut_reel", "fin_reel", "ST",
  "Status", "Nouveau_Délais", "Code_Article", "Description", "Macro_Gamme", "Priorite", "Macro_Gamme_Pe",
] as const;

export const ERP_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const ERP_MAX_ROWS = 100_000;

export function assertExpectedHeaders(actual: unknown[], expected: readonly string[], fileName: string): void {
  const normalized = actual.map((value) => String(value ?? "").trim());
  const missing = expected.filter((header) => !normalized.includes(header));
  const unexpected = normalized.filter((header) => header && !expected.includes(header));
  if (missing.length || unexpected.length || normalized.length !== expected.length) {
    const details = [
      missing.length ? `colonnes manquantes : ${missing.join(", ")}` : "",
      unexpected.length ? `colonnes inattendues : ${unexpected.join(", ")}` : "",
    ].filter(Boolean).join(" ; ");
    throw new Error(`Le format de ${fileName} ne correspond pas au profil ERP attendu${details ? ` (${details})` : ""}.`);
  }
}
