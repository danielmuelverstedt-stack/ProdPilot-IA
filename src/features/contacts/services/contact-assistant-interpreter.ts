import type { Contact } from "@/features/demo/types/demo";
import { contactFullName, filterContacts, sortContactsByName } from "./contact-directory.ts";

export type ContactAssistantField = "phone" | "email" | "all";

export interface ContactAssistantQuery {
  field: ContactAssistantField;
  name: string;
}

const PHONE_PATTERN = /\b(t[ée]l[ée]phone|t[ée]l\.?|num[ée]ro\s+de\s+t[ée]l[ée]phone|mobile|portable)\b/i;
const EMAIL_PATTERN = /\b(e-?mail|mail|courriel)\b/i;
const CONTACT_PATTERN = /\b(contact|coordonn[ée]es|fiche)\b/i;

/** Volontairement exclu des OF (« numéro de l'OF-63596 ») : cette question relève du planning, pas des Contacts. */
function isWorkOrderQuestion(text: string): boolean {
  return /\bOF[-\s]?\d/i.test(text);
}

export function isContactAssistantRequest(text: string): boolean {
  if (isWorkOrderQuestion(text)) return false;
  const hasField = PHONE_PATTERN.test(text) || EMAIL_PATTERN.test(text) || CONTACT_PATTERN.test(text);
  return hasField && /\bde\b/i.test(text);
}

function detectField(text: string): ContactAssistantField {
  if (PHONE_PATTERN.test(text)) return "phone";
  if (EMAIL_PATTERN.test(text)) return "email";
  return "all";
}

/** Ancrée sur la fin de phrase pour capturer le nom après le dernier « de » (« le numéro de téléphone de Jean Dupont »), pas le premier. */
const NAME_PATTERN = /.*\bde\s+(?:l['’]\s*)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]*?)\s*[?!.]*$/i;

export function extractContactQuery(text: string): ContactAssistantQuery | null {
  const match = text.match(NAME_PATTERN);
  if (!match) return null;
  const name = match[1].trim();
  if (!name) return null;
  return { field: detectField(text), name };
}

function describeContactField(contact: Contact, field: ContactAssistantField): string {
  const fullName = contactFullName(contact);
  if (field === "phone") {
    const numbers: string[] = [];
    if (contact.phone) numbers.push(`professionnel ${contact.phone}`);
    if (contact.mobile) numbers.push(`mobile ${contact.mobile}`);
    if (contact.internalNumber) numbers.push(`interne ${contact.internalNumber}`);
    if (contact.privateNumber) numbers.push(`privé ${contact.privateNumber}`);
    if (!numbers.length) return `Aucun numéro enregistré pour ${fullName}.`;
    return `${fullName} : ${numbers.join(", ")}.`;
  }
  if (field === "email") {
    return contact.email ? `${fullName} : ${contact.email}.` : `Aucun e-mail enregistré pour ${fullName}.`;
  }
  const parts: string[] = [];
  if (contact.phone) parts.push(`tél. ${contact.phone}`);
  if (contact.mobile) parts.push(`mobile ${contact.mobile}`);
  if (contact.email) parts.push(`e-mail ${contact.email}`);
  if (!parts.length) return `${fullName} n’a ni téléphone ni e-mail enregistré.`;
  return `${fullName} : ${parts.join(", ")}.`;
}

/** N'invente jamais un contact ni ne choisit entre plusieurs homonymes : liste les correspondances et demande de préciser. */
export function buildContactReply(name: string, field: ContactAssistantField, contacts: Contact[]): string {
  const matches = sortContactsByName(filterContacts(contacts, { search: name, categoryId: "Toutes", type: "Tous" }));
  if (!matches.length) return `Aucun contact ne correspond à « ${name} ».`;
  if (matches.length > 1) {
    const list = matches.map((contact) => `${contactFullName(contact)}${contact.company ? ` (${contact.company})` : ""}`).join(", ");
    return `Plusieurs contacts correspondent à « ${name} » : ${list}. Précisez le nom complet.`;
  }
  return describeContactField(matches[0], field);
}

export function interpretContactAssistantMessage(text: string, contacts: Contact[]): string | null {
  if (!isContactAssistantRequest(text)) return null;
  const query = extractContactQuery(text);
  if (!query) return null;
  return buildContactReply(query.name, query.field, contacts);
}
