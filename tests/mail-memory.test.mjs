import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { InMemoryLocalDatabaseAdapter } from "../src/features/mail-memory/repositories/local-database-adapter.ts";
import { AdapterMailMemoryRepository } from "../src/features/mail-memory/repositories/mail-memory-repository.ts";
import { searchMailMemory } from "../src/features/mail-memory/services/mail-memory-search.ts";
import { createMailSourceLink, resolveSourceLink } from "../src/features/mail-memory/services/source-link-resolver.ts";

const context = { accountId: "gmail-work", provider: "google", userId: "user-1", companyId: "company-1", mode: "oauth" };
const otherAccount = { ...context, accountId: "gmail-personal" };
const otherCompany = { ...context, companyId: "company-2" };
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function message(overrides = {}) {
  return { ...context, id: "company-1:user-1:gmail-work:message:m1", sourceId: "m1", createdAt: "2026-07-15T08:00:00.000Z", updatedAt: "2026-07-15T08:00:00.000Z", synchronizationStatus: "synchronized", threadId: "t1", from: { name: "Julian", email: "julian@example.com" }, to: [{ email: "work@example.com" }], cc: [], subject: "Licences SolidWorks", receivedAt: "2026-07-15T08:00:00.000Z", cleanedText: "Renouvellement des licences SolidWorks", snippet: "Renouvellement", labels: ["INBOX"], isRead: false, isImportant: true, contentFingerprint: "fp-1", synchronizedAt: "2026-07-15T08:01:00.000Z", attachments: [{ attachmentId: "a1", sourceMessageId: "m1", provider: "google", filename: "devis.pdf", mimeType: "application/pdf", approximateSizeBytes: 1200, sourceLinkId: "link-a1", accessState: "available" }], sourceLinkIds: ["link-m1"], searchTerms: ["julian", "solidworks", "licences", "devis.pdf"], ...overrides };
}

test("le contrat de dépôt isole strictement compte et entreprise", async () => {
  const repository = new AdapterMailMemoryRepository(new InMemoryLocalDatabaseAdapter());
  await repository.save("mailMessages", message());
  await repository.save("mailMessages", message({ ...otherAccount, id: "personal:m1" }));
  await repository.save("mailMessages", message({ ...otherCompany, id: "other-company:m1" }));
  assert.deepEqual((await repository.list("mailMessages", context)).map((item) => item.id), ["company-1:user-1:gmail-work:message:m1"]);
  assert.deepEqual((await repository.list("mailMessages", otherAccount)).map((item) => item.id), ["personal:m1"]);
  assert.deepEqual((await repository.list("mailMessages", otherCompany)).map((item) => item.id), ["other-company:m1"]);
});

test("la recherche locale retrouve expéditeur, sujet, texte et nom de fichier sans IA", async () => {
  const repository = new AdapterMailMemoryRepository(new InMemoryLocalDatabaseAdapter());
  await repository.save("mailMessages", message());
  for (const text of ["Julian", "SolidWorks", "devis.pdf"]) {
    const result = await searchMailMemory(repository, context, { text });
    assert.equal(result.messages.length, 1); assert.equal(result.orchestrationLevel, 0);
  }
});

test("une décision confirmée est prioritaire sur une suggestion IA", async () => {
  const repository = new AdapterMailMemoryRepository(new InMemoryLocalDatabaseAdapter());
  const base = { ...context, sourceId: "t1", createdAt: "2026-07-15T08:00:00.000Z", updatedAt: "2026-07-15T09:00:00.000Z", synchronizationStatus: "local", title: "VTC 800", description: "Intervention mardi", decidedAt: "2026-07-15", participants: [], status: "confirmed", confidence: 1, sourceLinkIds: [], relatedThreadId: "t1" };
  await repository.save("mailDecisions", { ...base, id: "confirmed", confirmedByUser: true, authority: "user_confirmed" });
  await repository.save("mailDecisions", { ...base, id: "suggested", confirmedByUser: false, authority: "unconfirmed_ai", updatedAt: "2026-07-15T10:00:00.000Z" });
  const result = await searchMailMemory(repository, context, { text: "VTC 800" });
  assert.equal(result.decisions[0].id, "confirmed");
});

test("les liens Gmail sont résolus centralement", () => {
  const link = createMailSourceLink(context, { externalId: "m1", displayName: "SolidWorks", sourceType: "mail", accountEmail: "work@example.com" });
  const resolved = resolveSourceLink(link);
  assert.match(resolved.href, /^https:\/\/mail\.google\.com\/mail\/u\//); assert.equal(resolved.label, "Ouvrir dans Gmail");
});

test("le schéma IndexedDB est versionné et interdit le binaire et les secrets", async () => {
  const adapter = await read("src/features/mail-memory/repositories/indexeddb-mail-memory-adapter.ts");
  const defaults = await read("src/features/mail-memory/config/mail-memory-defaults.ts");
  assert.match(defaults, /MAIL_MEMORY_DATABASE_VERSION = 1/); assert.match(adapter, /createIndex\("context"/);
  assert.match(adapter, /instanceof Blob|instanceof ArrayBuffer/); assert.match(adapter, /token\|secret\|password\|apiKey/);
});

test("la sauvegarde exclut secrets, audio et contenu binaire", async () => {
  const backup = await read("src/features/mail-memory/services/mail-memory-backup.ts");
  assert.match(backup, /FORBIDDEN_BACKUP_KEYS/); assert.match(backup, /token\|secret\|password\|apiKey/); assert.match(backup, /instanceof Blob/);
});

test("l’assistant persiste sessions et métadonnées de pièces jointes sans contenu", async () => {
  const service = await read("src/features/mail-memory/services/mail-memory-service.ts");
  assert.match(service, /persistMailAssistantSession/); assert.match(service, /approximateSizeBytes/); assert.doesNotMatch(service, /attachment\.data|attachment\.content|downloadAttachment/);
});

test("l’orchestrateur respecte les niveaux local, cache et IA", async () => {
  const orchestrator = await read("src/features/mail-memory/services/mail-ai-orchestrator.ts");
  assert.match(orchestrator, /level: 0/); assert.match(orchestrator, /level: 1/); assert.match(orchestrator, /level: 2/); assert.match(orchestrator, /contentFingerprint === analysis\.contentFingerprint/);
});
