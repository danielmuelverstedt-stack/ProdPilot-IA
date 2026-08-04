import { updateDemoData } from "@/features/demo/services/demo-repository";
import type { Contact, ContactType } from "@/features/demo/types/demo";

export interface ContactInput {
  type: ContactType;
  firstName: string;
  lastName: string;
  company?: string | null;
  role?: string | null;
  categoryIds?: string[];
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  notes?: string | null;
}

function nextContactId(existing: Contact[]): string {
  const highest = existing.reduce((max, item) => {
    const match = /^CT-(\d+)$/.exec(item.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `CT-${String(highest + 1).padStart(3, "0")}`;
}

function normalize(input: ContactInput): Omit<Contact, "id"> {
  return {
    type: input.type,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    company: input.company?.trim() || null,
    role: input.role?.trim() || null,
    categoryIds: input.categoryIds ?? [],
    phone: input.phone?.trim() || null,
    mobile: input.mobile?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    website: input.website?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export function createContact(input: ContactInput): string {
  let id = "";
  updateDemoData((draft) => {
    id = nextContactId(draft.contacts);
    draft.contacts.unshift({ id, ...normalize(input) });
  });
  return id;
}

/** Retourne `true` si `id` correspondait à un contact réel, `false` sinon — même convention que `action-service.ts`. */
export function updateContact(id: string, input: ContactInput): boolean {
  let found = false;
  updateDemoData((draft) => {
    const index = draft.contacts.findIndex((item) => item.id === id);
    if (index < 0) return;
    found = true;
    draft.contacts[index] = { id, ...normalize(input) };
  });
  return found;
}

export function deleteContact(id: string): boolean {
  let found = false;
  updateDemoData((draft) => {
    found = draft.contacts.some((item) => item.id === id);
    draft.contacts = draft.contacts.filter((item) => item.id !== id);
  });
  return found;
}
