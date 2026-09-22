/**
 * Placeholder ports for M1 T2 (ProcessSpawner) and T3 (SessionStore).
 * A port is an interface the domain depends on; concrete adapters
 * (src/main/adapters) implement it, so the domain never imports
 * Electron/Node APIs directly.
 */
export interface ProcessSpawnerPlaceholder {
  readonly kind: "placeholder";
}

export interface SessionStorePlaceholder {
  readonly kind: "placeholder";
}
