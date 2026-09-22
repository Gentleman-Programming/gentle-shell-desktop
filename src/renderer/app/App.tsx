import { ChatsContainer } from "@renderer/features/chats/ChatsContainer";
import { ConversationContainer } from "@renderer/features/conversation/ConversationContainer";
import "./App.css";

// App shell: composes feature-level containers only (Scope Rule — layout
// wiring lives here, feature internals stay inside their own folder).
// First-run (link vs isolated) is T5 scope; the shell below is what
// renders once that choice, or its absence, has already been resolved.
export function App() {
  return (
    <div className="gc-app">
      <ChatsContainer />
      <ConversationContainer />
    </div>
  );
}
