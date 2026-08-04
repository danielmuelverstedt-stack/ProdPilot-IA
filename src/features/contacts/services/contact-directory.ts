import type { Contact, ContactType } from "@/features/demo/types/demo";

export interface ContactFilters {
  search: string;
  categoryId: string | "Toutes";
  type: ContactType | "Tous";
}

export function createDefaultContactFilters(): ContactFilters {
  return { search: "", categoryId: "Toutes", type: "Tous" };
}

export function contactFullName(contact: Contact): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

/** Recherche par nom (prénom, nom, société) : les trois champs les plus utilisés pour retrouver quelqu'un dans un annuaire. */
function matchesSearch(contact: Contact, search: string): boolean {
  if (!search.trim()) return true;
  const normalized = search.trim().toLocaleLowerCase("fr");
  const haystack = `${contactFullName(contact)} ${contact.company ?? ""}`.toLocaleLowerCase("fr");
  return haystack.includes(normalized);
}

export function filterContacts(contacts: Contact[], filters: ContactFilters): Contact[] {
  return contacts.filter((contact) =>
    matchesSearch(contact, filters.search)
    && (filters.categoryId === "Toutes" || contact.categoryIds.includes(filters.categoryId))
    && (filters.type === "Tous" || contact.type === filters.type));
}

export function sortContactsByName(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => contactFullName(a).localeCompare(contactFullName(b), "fr"));
}
