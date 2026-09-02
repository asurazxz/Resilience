import { ChatProvider } from "./features/scheme-navigator/ChatContext";
import { ChatWidget } from "./features/scheme-navigator/ChatWidget";
import { SchemeNavigator } from "./features/scheme-navigator/SchemeNavigator";

// Minimal root: the shared PWA shell, navigation, and other features'
// screens belong to their own workstreams. This pass wires up only the
// Scheme Navigator so it is runnable and demoable on its own.
//
// The chat assistant is mounted here rather than inside the Scheme
// Navigator so it stays present on every screen as other workstreams add
// theirs. It degrades on its own when no results have been published yet,
// so it does not constrain what those screens look like.
function App() {
  return (
    <ChatProvider>
      <div className="min-h-screen bg-slate-50">
        <SchemeNavigator />
      </div>
      <ChatWidget />
    </ChatProvider>
  );
}

export default App;
