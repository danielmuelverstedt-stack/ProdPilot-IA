import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { MAIL_WORKFLOW_LABELS } from "../src/features/mail-management/types/mail-management.ts";
import { buildMailLabelMutation, getMailWorkflowView } from "../src/features/mail-management/services/mail-workflow.ts";
import { canAutomaticallyArchive, classifyMailForManagement, parseMailClassificationDecision } from "../src/features/mail-management/services/mail-classification-service.ts";

const labels = Object.values(MAIL_WORKFLOW_LABELS).map((name, index) => ({ id: `Label_${index + 1}`, name, type: "user" }));
const baseMessage = {
  id: "message-1", accountId: "account-1", provider: "google", threadId: "thread-1",
  from: { email: "newsletter@example.com" }, to: [{ email: "user@example.com" }], cc: [],
  subject: "Information mensuelle", snippet: "newsletter", bodyText: "Newsletter - unsubscribe",
  summary: "Information", proposedAction: "Lire", category: "information", priority: "normal",
  receivedAt: "2026-07-19T08:00:00.000Z", isRead: false, isArchived: false,
  attachments: [], labels: ["INBOX", "UNREAD"], isImportant: false, isFlagged: false,
};
const archiveRule = { id: "rule-1", name: "Newsletters", condition: { kind: "newsletter", value: "newsletter" }, action: "archive", isActive: true, priority: 50, origin: "user", createdAt: "2026-07-19T08:00:00.000Z", lastUsedAt: null };

test("les quatre libellés ProdPilot sont uniques", () => {
  assert.deepEqual(Object.values(MAIL_WORKFLOW_LABELS), ["ProdPilot/À traiter", "ProdPilot/En attente", "ProdPilot/Traités", "ProdPilot/Archivé par IA"]);
  assert.equal(new Set(Object.values(MAIL_WORKFLOW_LABELS)).size, 4);
});

test("un libellé existant est réutilisé et les créations concurrentes sont sérialisées", async () => {
  const source = await readFile(new URL("../src/features/mail/providers/google/google-mail-provider.ts", import.meta.url), "utf8");
  assert.match(source, /if \(byName\.has\(name\)\) continue/);
  assert.match(source, /labelCreationQueue/);
  assert.match(source, /\[\.\.\.new Set\(names\)\]/);
});

test("les transitions ajoutent et retirent les bons identifiants Gmail", () => {
  const waiting = buildMailLabelMutation("waiting", labels, "user");
  assert.deepEqual(waiting.addLabelIds, ["Label_2"]);
  assert.ok(waiting.removeLabelIds.includes("Label_1") && waiting.removeLabelIds.includes("INBOX"));
  const processed = buildMailLabelMutation("processed", labels, "user");
  assert.deepEqual(processed.addLabelIds, ["Label_3"]);
  assert.ok(processed.removeLabelIds.includes("Label_2") && processed.removeLabelIds.includes("INBOX"));
  const aiArchive = buildMailLabelMutation("archive", labels, "ai");
  assert.deepEqual(aiArchive.addLabelIds, ["Label_4"]);
  const restore = buildMailLabelMutation("restore", labels, "user");
  assert.ok(restore.addLabelIds.includes("INBOX") && restore.addLabelIds.includes("Label_1"));
  assert.deepEqual(buildMailLabelMutation("mark_read", labels, "user").removeLabelIds, ["UNREAD"]);
  assert.deepEqual(buildMailLabelMutation("mark_unread", labels, "user").addLabelIds, ["UNREAD"]);
});

test("les vues Nouveaux, À traiter, En attente, Traités et IA reposent sur Gmail", () => {
  assert.equal(getMailWorkflowView(baseMessage, labels), "new");
  assert.equal(getMailWorkflowView({ ...baseMessage, isRead: true, labels: ["INBOX"] }, labels), "to_process");
  assert.equal(getMailWorkflowView({ ...baseMessage, labels: ["Label_2"] }, labels), "waiting");
  assert.equal(getMailWorkflowView({ ...baseMessage, labels: ["Label_3"] }, labels), "processed");
  assert.equal(getMailWorkflowView({ ...baseMessage, labels: ["Label_4"] }, labels), "ai_archived");
});

test("un nouveau message d’un ancien fil est réévalué comme Nouveau", () => {
  const newMessage = { ...baseMessage, id: "message-2", threadId: "ancien-thread", labels: ["INBOX", "UNREAD"] };
  assert.equal(getMailWorkflowView(newMessage, labels), "new");
});

test("la classification est stricte et une réponse IA invalide est rejetée", () => {
  const result = classifyMailForManagement(baseMessage, [archiveRule]);
  assert.ok(parseMailClassificationDecision(result));
  assert.equal(parseMailClassificationDecision({ ...result, confidence: 2 }), null);
  assert.equal(parseMailClassificationDecision({ ...result, proposedOperation: { type: "delete", requiresConfirmation: false } }), null);
});

test("seule une newsletter couverte par une règle utilisateur peut être auto-archivée", () => {
  const result = classifyMailForManagement(baseMessage, [archiveRule]);
  assert.equal(result.confidence, 0.99);
  assert.equal(canAutomaticallyArchive(baseMessage, result, [archiveRule]), true);
  assert.equal(canAutomaticallyArchive(baseMessage, { ...result, confidence: 0.8 }, [archiveRule]), false);
  assert.equal(canAutomaticallyArchive({ ...baseMessage, attachments: [{ id: "a", filename: "commande.pdf", mimeType: "application/pdf", sizeBytes: 10, isInline: false }] }, result, [archiveRule]), false);
  assert.equal(canAutomaticallyArchive({ ...baseMessage, isImportant: true }, result, [archiveRule]), false);
});

test("les termes de production et les pièces jointes imposent une vérification humaine", () => {
  assert.equal(classifyMailForManagement({ ...baseMessage, subject: "Retard livraison OF 123", bodyText: "urgent" }, [archiveRule]).classification, "needs_review");
  assert.equal(classifyMailForManagement({ ...baseMessage, attachments: [{ id: "a", filename: "audit.pdf", mimeType: "application/pdf", sizeBytes: 10, isInline: false }] }, [archiveRule]).classification, "needs_review");
});

test("une question ou une échéance bloque aussi l’archivage malgré une règle newsletter", () => {
  const question = classifyMailForManagement({ ...baseMessage, bodyText: "Newsletter : pouvez-vous confirmer ?" }, [archiveRule]);
  const deadline = classifyMailForManagement({ ...baseMessage, bodyText: "Newsletter à valider avant le 21/07/2026" }, [archiveRule]);
  assert.equal(question.classification, "to_process");
  assert.equal(canAutomaticallyArchive(baseMessage, question, [archiveRule]), false);
  assert.equal(deadline.classification, "needs_review");
  assert.ok(deadline.detectedDeadlines.length > 0);
});

test("le fournisseur Google utilise modify, batchModify et threads.modify puis relit Gmail", async () => {
  const source = await readFile(new URL("../src/features/mail/providers/google/google-mail-provider.ts", import.meta.url), "utf8");
  assert.match(source, /users\.labels\.create/);
  assert.match(source, /users\.messages\.modify/);
  assert.match(source, /users\.messages\.batchModify/);
  assert.match(source, /users\.threads\.modify/);
  assert.match(source, /this\.getThread\(input\.threadId\)/);
  assert.match(source, /Promise\.all\(messageIds\.map\(\(id\) => this\.getMessage\(id\)\)\)/);
});

test("le scope modify, la reconnexion, la confirmation, le journal et l’annulation sont contrôlés", async () => {
  const config = await readFile(new URL("../src/features/mail/server/google/google-config.ts", import.meta.url), "utf8");
  const service = await readFile(new URL("../src/features/mail-management/services/mail-management-service.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../src/app/api/mail/management/route.ts", import.meta.url), "utf8");
  assert.match(config, /gmail\.modify/);
  assert.match(service, /if \(!input\.confirmed\)/);
  assert.match(service, /provider\.getMessage\(id\)/);
  assert.match(service, /snapshotsBefore/);
  assert.match(service, /mailActivityRepository\.markUndone/);
  assert.match(service, /restoreSnapshots\(provider, snapshotsBefore\)/);
  assert.match(service, /gmailResult: "failed"/);
  assert.match(service, /Un message sélectionné n’existe pas dans le compte Gmail actif/);
  assert.match(service, /Les mutations Gmail automatiques sans confirmation précise sont désactivées/);
  assert.match(route, /isTrustedSameOriginRequest/);
});

test("aucun connecteur Plaud fantôme ni secret n’est ajouté et les licences sont documentées", async () => {
  const packageManifest = await readFile("package.json", "utf8");
  const diagnostic = await readFile("src/features/mail-diagnostics/components/MailDiagnosticsScreen.tsx", "utf8");
  assert.doesNotMatch(packageManifest, /plaud/i);
  assert.match(diagnostic, /aucun connecteur ni session Plaud n’existe/);
  assert.match(diagnostic, /"plaud", "Plaud", "warning"/);
  const notices = await readFile("THIRD_PARTY_NOTICES.md", "utf8");
  assert.match(notices, /a890d19189bbc1325b8728fab830fc278cfd8804/);
  assert.match(notices, /AGPL-3\.0/);
  assert.match(notices, /GPL-3\.0/);
  const management = await readFile(new URL("../src/features/mail-management/services/mail-management-service.ts", import.meta.url), "utf8");
  assert.doesNotMatch(management, /refreshToken|clientSecret|OPENAI_API_KEY/);
});
