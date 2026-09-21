// Channel names live in src/shared/ipc-channels.ts (the Scope Rule: both
// this process and src/preload/bridge.ts need them). This barrel only
// re-exports the handler registration entry point.
export * from "./registerHandlers";
