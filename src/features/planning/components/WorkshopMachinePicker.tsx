/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { fieldClass, secondaryButton } from "@/components/ui/ModuleUi";
import { useMachinePhotos } from "@/features/machines/services/machine-photo-store";
import type { MachineSettings } from "@/features/settings/types/settings";

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

  return <div className="relative inline-block">
    <button type="button" className={`${secondaryButton} gap-2`} disabled={busy} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
      <MachineThumbnail photoDataUrl={currentMachine ? photos[currentMachine.id] : undefined} />
      <span>{currentMachine?.displayName ?? "Non définie"}</span>
    </button>
    {isOpen ? <div className="absolute z-40 mt-1 w-72 rounded-xl border border-[var(--app-border)] bg-white p-2 shadow-lg">
      <input autoFocus className={`${fieldClass} w-full`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une machine" />
      <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
        {candidates.map((machine) => <li key={machine.id}>
          <button
            type="button"
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50 ${machine.id === currentMachineId ? "bg-slate-100 font-semibold" : ""}`}
            onClick={() => select(machine.id)}
          >
            <MachineThumbnail photoDataUrl={photos[machine.id]} />
            <span className="flex-1">{machine.displayName}</span>
            {!machine.active ? <span className="text-xs text-slate-400">Inactive</span> : null}
            {!machine.visible ? <span className="text-xs text-slate-400">Masquée</span> : null}
          </button>
        </li>)}
        {!candidates.length ? <li className="px-2 py-3 text-xs text-slate-400">Aucune machine trouvée</li> : null}
      </ul>
    </div> : null}
  </div>;
}

function MachineThumbnail({ photoDataUrl }: { photoDataUrl: string | undefined }) {
  if (!photoDataUrl) return <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400" aria-hidden="true">—</span>;
  return <img src={photoDataUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />;
}
