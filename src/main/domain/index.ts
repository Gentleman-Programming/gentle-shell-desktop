/**
 * Domain barrel. Pure types and logic only — no Electron or Node imports
 * allowed here, so the domain stays testable and framework-agnostic
 * (hexagonal main process, see src/README.md).
 *
 * T2 replaced the RPC/dialog placeholders with the real protocol types
 * (src/main/domain/rpc) and the PiSession adapter-of-ports
 * (src/main/domain/session). SessionPlaceholder stays a placeholder for T3
 * (SessionManager.listAll()).
 */
export * from "./rpc/types";
export * from "./rpc/codec";
export * from "./rpc/chatReducer";
export * from "./session/PiSession";

export interface SessionPlaceholder {
  readonly id: string;
}
