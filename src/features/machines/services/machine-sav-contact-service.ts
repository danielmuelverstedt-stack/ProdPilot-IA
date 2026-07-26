import type { DemoData, MachineSavContact } from "@/features/demo/types/demo";

export interface MachineSavContactInput {
  company: string;
  contactName: string;
  phone: string;
  email: string;
  contractReference: string;
  contractExpiry: string | null;
  notes: string;
}

export const machineSavContactService = {
  create(draft: DemoData, machineId: string, input: MachineSavContactInput): void {
    const contact: MachineSavContact = { id: `SAV-${Date.now()}`, machineId, ...input };
    draft.savContacts.push(contact);
  },

  update(draft: DemoData, id: string, input: MachineSavContactInput): void {
    const contact = draft.savContacts.find((entry) => entry.id === id);
    if (contact) Object.assign(contact, input);
  },

  remove(draft: DemoData, id: string): void {
    draft.savContacts = draft.savContacts.filter((entry) => entry.id !== id);
  },
};
