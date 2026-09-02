import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { Answers, SchemeResult } from "./types";

// The chat widget lives in the app shell so it is present on every page,
// but the questionnaire state it needs lives inside the Scheme Navigator.
// This carries results outward without lifting the whole form into the
// shell, and keeps the widget usable (with no context) on pages other
// workstreams add later.
interface ChatContextValue {
  answers: Answers;
  results: SchemeResult[] | null;
  publish: (answers: Answers, results: SchemeResult[] | null) => void;
}

const ChatContext = createContext<ChatContextValue>({
  answers: {},
  results: null,
  publish: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    answers: Answers;
    results: SchemeResult[] | null;
  }>({ answers: {}, results: null });

  const publish = useCallback(
    (answers: Answers, results: SchemeResult[] | null) =>
      setState({ answers, results }),
    [],
  );

  const value = useMemo(
    () => ({ ...state, publish }),
    [state, publish],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  return useContext(ChatContext);
}
