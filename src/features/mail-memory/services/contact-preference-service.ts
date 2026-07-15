import type { MailMemoryRepository } from "@/features/mail-memory/repositories/mail-memory-repository";
import type { ContactPreference, MailMemoryContext } from "@/features/mail-memory/types/mail-memory";

export async function confirmContactPreference(repository: MailMemoryRepository, context: MailMemoryContext, input: Omit<ContactPreference, keyof MailMemoryContext | "id" | "sourceId" | "createdAt" | "updatedAt" | "synchronizationStatus" | "confirmedByUser">): Promise<ContactPreference> {
  const now = new Date().toISOString(); const sourceId = input.contactKey.toLocaleLowerCase("fr");
  const record: ContactPreference = { ...context, ...input, id: `${context.companyId}:${context.userId}:${context.accountId}:contact:${sourceId}`, sourceId, createdAt: now, updatedAt: now, synchronizationStatus: "local", confirmedByUser: true };
  await repository.save("contactPreferences", record); return record;
}

export async function removeContactPreference(repository: MailMemoryRepository, context: MailMemoryContext, contactKey: string): Promise<void> {
  await repository.remove("contactPreferences", `${context.companyId}:${context.userId}:${context.accountId}:contact:${contactKey.toLocaleLowerCase("fr")}`, context);
}
