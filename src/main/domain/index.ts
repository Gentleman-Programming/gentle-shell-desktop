/**
 * Placeholder domain types for M1 T2 (RPC protocol) and T3 (sessions).
 * Pure types only — no Electron or Node imports allowed here, so the
 * domain stays testable and framework-agnostic (hexagonal main process).
 * Kept local to src/main because only the main process needs them today;
 * the Scope Rule promotes to src/shared/ only once a second process does.
 */
export interface ChatEventPlaceholder {
  readonly kind: "placeholder";
}

export interface SessionPlaceholder {
  readonly id: string;
}

export interface DialogPlaceholder {
  readonly kind: "placeholder";
}
