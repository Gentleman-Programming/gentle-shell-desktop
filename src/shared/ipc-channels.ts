/**
 * IPC channel names shared between src/main/ipc/registerHandlers.ts and
 * src/preload/bridge.ts. Lives under src/shared/, not src/main/ipc/,
 * because both processes need it — the same Scope Rule that put
 * bridge-types.ts here instead of duplicating it locally (see
 * src/README.md).
 */
export const IPC_CHANNELS = {
  LIST_CHATS: "sessions.list",
  OPEN_CHAT: "chat.open",
  NEW_CHAT: "chat.new",
  SEND_MESSAGE: "chat.send",
  ABORT: "chat.abort",
  ANSWER_DIALOG: "dialog.answer",
  /** webContents.send push: the current chat's ChatState changed. */
  STATE_PUSH: "chat.state",
  /** webContents.send push: an error was surfaced for the current chat. */
  ERROR_PUSH: "chat.error",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
