import "server-only";

export interface AiRequestCoordinator {
  run<T>(key: string, operation: () => Promise<T>): Promise<T>;
}

/** Dédoublonnage local au processus. À remplacer par un verrou partagé avant déploiement multi-instance. */
class LocalProcessAiRequestCoordinator implements AiRequestCoordinator {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  async run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const current = this.inFlight.get(key);
    if (current) return current as Promise<T>;
    const pending = operation().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, pending);
    return pending;
  }
}

export const aiRequestCoordinator: AiRequestCoordinator = new LocalProcessAiRequestCoordinator();
