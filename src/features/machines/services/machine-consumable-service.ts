import type { ConsumableCategory, DemoData, MachineConsumable } from "@/features/demo/types/demo";

export interface MachineConsumableInput {
  category: ConsumableCategory;
  designation: string;
  manufacturerReference: string;
  supplier: string;
  replacementFrequency: string;
  storageLocation: string;
  notes: string;
}

export const CONSUMABLE_CATEGORIES: ConsumableCategory[] = ["Filtre", "Huile", "Graisse", "Liquide de coupe", "Autre"];

export const machineConsumableService = {
  create(draft: DemoData, machineId: string, input: MachineConsumableInput): void {
    const consumable: MachineConsumable = { id: `CONS-${Date.now()}`, machineId, ...input };
    draft.consumables.push(consumable);
  },

  update(draft: DemoData, id: string, input: MachineConsumableInput): void {
    const consumable = draft.consumables.find((entry) => entry.id === id);
    if (consumable) Object.assign(consumable, input, { isExample: false });
  },

  remove(draft: DemoData, id: string): void {
    draft.consumables = draft.consumables.filter((entry) => entry.id !== id);
  },
};
