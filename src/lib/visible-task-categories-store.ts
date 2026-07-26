"use client";

import { useSyncExternalStore } from "react";

/**
 * Stockage dédié pour le réglage partagé « catégories de tâche visibles » (Cockpit ERP, Planning
 * capacité, Atelier), séparé du gros objet Réglages (`AppSettings`, `src/features/settings/`).
 *
 * Avant ce store, ce réglage vivait dans `settings.production.visibleTaskCategoryCodes` : chaque
 * changement (par ex. sélectionner un onglet de département dans l'Atelier) passait par
 * `updateSettings`, qui clone l'intégralité de l'arbre des Réglages, le réécrit en entier dans
 * localStorage de façon synchrone, puis force le recalcul de tous les écrans qui lisent les
 * Réglages (utilisés dans plus de 30 fichiers) — beaucoup trop coûteux pour un réglage qui change
 * à chaque clic. Ce store isole ce seul champ dans son propre stockage minuscule, avec ses propres
 * abonnés : changer de catégorie ne touche plus le reste de l'application.
 *
 * Migration automatique une seule fois depuis l'ancien emplacement (`prodpilot.settings`), pour ne
 * pas perdre les catégories déjà configurées par un utilisateur existant.
 */
const STORAGE_KEY = "prodpilot.visible-task-categories.v1";
const LEGACY_SETTINGS_STORAGE_KEY = "prodpilot.settings";

const listeners = new Set<() => void>();
let snapshot: string[] = [];
let hydrated = false;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function migrateFromLegacySettings(): string[] | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const production = (parsed as { production?: unknown }).production;
    if (typeof production !== "object" || production === null) return null;
    const codes = (production as { visibleTaskCategoryCodes?: unknown }).visibleTaskCategoryCodes;
    return isStringArray(codes) ? codes : null;
  } catch {
    return null;
  }
}

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isStringArray(parsed)) { snapshot = parsed; return; }
    }
    const migrated = migrateFromLegacySettings();
    if (migrated) { snapshot = migrated; window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); }
  } catch {
    // Conserve le tableau vide par défaut si le stockage local est indisponible ou corrompu.
  }
}

function subscribe(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string[] {
  hydrate();
  return snapshot;
}

function getServerSnapshot(): string[] {
  return [];
}

export function useVisibleTaskCategoryCodes(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setVisibleTaskCategoryCodes(codes: string[]): void {
  snapshot = codes;
  hydrated = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
    } catch {
      // Stockage local indisponible (quota, navigation privée…) : l'état en mémoire reste correct pour la session en cours.
    }
  }
  listeners.forEach((listener) => listener());
}
