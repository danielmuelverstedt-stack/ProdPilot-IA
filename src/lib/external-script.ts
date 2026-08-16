const loadedScripts = new Map<string, Promise<void>>();

/**
 * Charge un script externe (balise `<script>`) une seule fois par URL et réutilise la même
 * promesse pour les appels concurrents ou ultérieurs. Rejette proprement si le chargement échoue,
 * pour permettre un repli sans erreur non gérée côté appelant.
 */
export function loadExternalScript(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("loadExternalScript ne peut être appelé que côté client."));
  const existing = loadedScripts.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Le script externe ${src} n'a pas pu être chargé.`));
    document.head.appendChild(script);
  });
  loadedScripts.set(src, promise);
  promise.catch(() => loadedScripts.delete(src));
  return promise;
}
