"use client";

import { useEffect } from "react";
import { migrateLegacyMachinePhotos } from "@/features/machines/services/machine-photo-store";
import { useSettings } from "@/features/settings/components/SettingsProvider";
import { settingsRepository } from "@/features/settings/services/settings-repository";

let attempted = false;

/**
 * Reprend une fois par session les photos machine historiquement enregistrées dans Réglages
 * (localStorage) vers le stockage dédié IndexedDB, puis force une sauvegarde des Réglages pour
 * que les anciennes données binaires ne restent pas dans le JSON persistant. Ne rend rien.
 */
export function MachinePhotoStorageMigration() {
  const { updateSettings } = useSettings();

  useEffect(() => {
    if (attempted) return;
    attempted = true;
    const legacyPhotos = settingsRepository.extractLegacyMachinePhotos();
    if (!legacyPhotos.length) return;
    void migrateLegacyMachinePhotos(legacyPhotos).then((migratedCount) => {
      if (migratedCount > 0) updateSettings((draft) => draft, "Photos machine migrées vers un stockage dédié");
    });
  }, [updateSettings]);

  return null;
}
