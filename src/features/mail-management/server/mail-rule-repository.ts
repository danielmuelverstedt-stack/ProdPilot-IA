import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";
import { SerializedAtomicJsonFile } from "@/features/mail/server/accounts/serialized-atomic-json-file";
import type { MailAutomationRule } from "@/features/mail-management/types/mail-management";

interface StoredRules { version: 1; accounts: Record<string, MailAutomationRule[]> }

class MailRuleRepository {
  private readonly storage = new SerializedAtomicJsonFile<StoredRules>({
    storageFile: path.join(process.cwd(), ".local-data", "mail-management-rules.json"),
    parse: parseStoredRules,
    createDefault: () => ({ version: 1, accounts: {} }),
    normalize: (value) => value,
    readErrorMessage: "Le registre local des règles Mail est illisible.",
  });

  async list(accountId: string): Promise<MailAutomationRule[]> {
    return structuredClone((await this.storage.read()).accounts[accountId] ?? []);
  }

  async add(accountId: string, input: Omit<MailAutomationRule, "id" | "createdAt" | "lastUsedAt" | "origin">): Promise<MailAutomationRule> {
    validateRuleInput(input);
    return this.storage.update((stored) => {
      const rule: MailAutomationRule = { ...input, id: `mail-rule-${randomUUID()}`, origin: "user", createdAt: new Date().toISOString(), lastUsedAt: null };
      stored.accounts[accountId] = [...(stored.accounts[accountId] ?? []), rule];
      return { value: stored, result: structuredClone(rule) };
    });
  }

  async setActive(accountId: string, id: string, isActive: boolean): Promise<MailAutomationRule> {
    return this.storage.update((stored) => {
      const rules = stored.accounts[accountId] ?? [];
      const index = rules.findIndex((rule) => rule.id === id);
      if (index < 0) throw new Error("La règle Mail est introuvable.");
      rules[index] = { ...rules[index], isActive };
      stored.accounts[accountId] = rules;
      return { value: stored, result: structuredClone(rules[index]) };
    });
  }

  async markUsed(accountId: string, ids: string[], usedAt: string): Promise<void> {
    const selected = new Set(ids);
    if (!selected.size) return;
    await this.storage.update((stored) => {
      stored.accounts[accountId] = (stored.accounts[accountId] ?? []).map((rule) => selected.has(rule.id) ? { ...rule, lastUsedAt: usedAt } : rule);
      return { value: stored, result: undefined };
    });
  }
}

function validateRuleInput(input: Omit<MailAutomationRule, "id" | "createdAt" | "lastUsedAt" | "origin">): void {
  if (!input.name.trim() || input.name.length > 100 || !input.condition.value.trim() || input.condition.value.length > 200) throw new Error("Le nom et la condition de la règle sont obligatoires.");
  if (!["sender_domain", "sender", "subject_contains", "newsletter"].includes(input.condition.kind) || !["keep_to_process", "archive", "mark_waiting"].includes(input.action)) throw new Error("La règle Mail est invalide.");
  if (!Number.isInteger(input.priority) || input.priority < 0 || input.priority > 100) throw new Error("La priorité de la règle doit être comprise entre 0 et 100.");
}

function parseStoredRules(value: unknown): StoredRules | null {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.accounts)) return null;
  return Object.values(value.accounts).every((rules) => Array.isArray(rules) && rules.every(isRule)) ? value as unknown as StoredRules : null;
}

function isRule(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && isRecord(value.condition) && typeof value.condition.value === "string" && typeof value.isActive === "boolean" && typeof value.priority === "number" && typeof value.createdAt === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
export const mailRuleRepository = new MailRuleRepository();
