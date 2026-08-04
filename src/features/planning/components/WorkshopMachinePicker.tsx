"use client";

import { useMemo, useState } from "react";
import { MachineThumbnail } from "@/features/machines/components/MachineThumbnail";
import { useMachinePhotos } from "@/features/machines/services/machine-photo-store";
import type { MachineSettings } from "@/features/settings/types/settings";

/** Voir la note dans WorkshopOperationRow.tsx : `fieldClass`/`secondaryButton` empilés avec des
 * utilitaires plus petits ne se comportent pas comme un simple override en Tailwind v4, d'où ces
 * classes autonomes plutôt qu'une composition partielle des primitives standard. */
const compactTriggerClass = "inline-flex h-5 w-full max-w-full items-center gap-1 rounded-md border border-[var(--app-border)] bg-white px-1 text-[10px] font-semibold hover:bg-slate-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45";
const compactSearchClass = "h-6 w-full rounded-lg border border-[var(--app-border)] bg-white px-1.5 text-[11px] outline-none focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--app-primary)_12%,transparent)]";

interface WorkshopMachinePickerProps {
  machines: MachineSettings[];
  currentMachineId: string | null;
  busy: boolean;
  onSelect: (machineId: string) => void;
}

/**
 * Sélecteur de machine avec recherche par nom et vignette photo : le nom technique d'une
 * machine n'est pas toujours reconnaissable, la photo (déjà disponible via Parc Machines)
 * aide à choisir la bonne sans se déplacer.
 */
export function WorkshopMachinePicker({ machines, currentMachineId, busy, onSelect }: WorkshopMachinePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const photos = useMachinePhotos();
  const currentMachine = machines.find((machine) => machine.id === currentMachineId) ?? null;

  const candidates = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("fr");
    return machines
      .filter((machine) => !machine.deleted)
      .filter((machine) => !normalized || machine.displayName.toLocaleLowerCase("fr").includes(normalized))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "fr", { numeric: true }));
  }, [machines, search]);

  function select(machineId: string) {
    setIsOpen(false);
    setSearch("");
    if (machineId !== currentMachineId) onSelect(machineId);
  }

  return <div className="relative inline-block max-w-full">
    <button type="button" className={compactTriggerClass} disabled={busy} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
      <MachineThumbnail photoDataUrl={currentMachine ? photos[currentMachine.id] : undefined} />
      <span className="truncate">{currentMachine?.displayName ?? "Non définie"}</span>
    </button>
    {isOpen ? <div className="absolute z-40 mt-1 w-60 rounded-lg border border-[var(--app-border)] bg-white p-1.5 shadow-lg">
      <input autoFocus className={compactSearchClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une machine" />
      <ul className="mt-1.5 max-h-56 space-y-0.5 overflow-y-auto">
        {candidates.map((machine) => <li key={machine.id}>
          <button
            type="button"
            className={`flex w-full items-center gap-1 rounded-md px-1 py-0.5 text-left text-[11px] hover:bg-slate-50 ${machine.id === currentMachineId ? "bg-slate-100 font-semibold" : ""}`}
            onClick={() => select(machine.id)}
          >
            <MachineThumbnail photoDataUrl={photos[machine.id]} />
            <span className="flex-1 truncate">{machine.displayName}</span>
            {!machine.active ? <span className="text-[9px] text-slate-400">Inactive</span> : null}
            {!machine.visible ? <span className="text-[9px] text-slate-400">Masquée</span> : null}
          </button>
        </li>)}
        {!candidates.length ? <li className="px-1.5 py-2 text-[11px] text-slate-400">Aucune machine trouvée</li> : null}
      </ul>
    </div> : null}
  </div>;
}
