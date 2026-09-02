import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "./api";
import { useChatContext } from "./ChatContext";
import type { ChatMessage, SchemeResult } from "./types";

const GREETING =
  "Hi. I can explain the schemes you were screened for, and point you toward other Singapore support that might exist. I can't work out amounts or tell you whether you qualify — only the agency decides that.";

/** Inline SVG so there is no binary asset and no external request. */
function BotAvatar({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[60%] w-[60%]"
      >
        {/* antenna */}
        <path d="M12 3.5v2.5" />
        <circle cx="12" cy="2.6" r="1" fill="currentColor" stroke="none" />
        {/* head */}
        <rect x="4" y="6" width="16" height="12" rx="3.5" />
        {/* eyes */}
        <circle cx="9" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
        {/* smile */}
        <path d="M9.5 14.8c1.5 1 3.5 1 5 0" />
      </svg>
    </span>
  );
}

/** One-tap prompts, derived from whatever results are on screen. */
function suggestionsFor(results: SchemeResult[] | null): string[] {
  const matched = results?.filter((r) => r.status === "matched") ?? [];
  const notMatched = results?.filter((r) => r.status === "not_matched") ?? [];

  const suggestions: string[] = [];
  if (matched.length > 0) {
    suggestions.push(`Why did I match ${matched[0].name}?`);
  }
  if (notMatched.length > 0) {
    suggestions.push(`Why didn't I match ${notMatched[0].name}?`);
  }
  suggestions.push("What other support might be available to me?");
  if (suggestions.length < 3) {
    suggestions.push("How does this screening work?");
  }
  return suggestions.slice(0, 3);
}

export function ChatWidget() {
  const { answers, results } = useChatContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  async function send(question: string) {
    if (!question || sending) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setDraft("");
    setSending(true);
    setErrorMessage(null);

    try {
      const response = await sendChatMessage(next, answers, results ?? []);
      setMessages([...next, { role: "assistant", content: response.reply }]);
    } catch {
      // Even when the request never reaches the API, give the person
      // somewhere to go rather than a status report about our server.
      setErrorMessage(
        "Where to get an answer on that:\n" +
          "• SupportGoWhere (supportgowhere.life.gov.sg) — lists government support\n" +
          "• ComCare Call 1800-222-0000 — to speak to someone",
      );
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the scheme assistant"
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg ring-2 ring-white transition hover:scale-105"
      >
        <BotAvatar className="h-14 w-14" />
      </button>
    );
  }

  return (
    <section
      aria-label="Scheme assistant"
      className="fixed bottom-4 right-4 z-50 flex h-[30rem] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-lg border border-slate-300 bg-white shadow-xl"
    >
      <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
        <BotAvatar className="h-8 w-8" />
        <h2 className="flex-1 text-sm font-semibold text-slate-900">
          Scheme assistant
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the scheme assistant"
          className="rounded px-2 text-lg leading-none text-slate-500"
        >
          ×
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div className="flex gap-2">
          <BotAvatar className="h-7 w-7" />
          <p className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {GREETING}
          </p>
        </div>

        {messages.map((message, index) =>
          message.role === "user" ? (
            <p
              key={`user-${index}`}
              className="ml-8 rounded bg-emerald-700 px-3 py-2 text-sm text-white"
            >
              {message.content}
            </p>
          ) : (
            <div key={`bot-${index}`} className="flex gap-2">
              <BotAvatar className="h-7 w-7" />
              {/* whitespace-pre-line keeps the line breaks the backend sends;
                  without it the bulleted answers collapse into one paragraph. */}
              <p className="whitespace-pre-line rounded bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-800">
                {message.content}
              </p>
            </div>
          ),
        )}

        {sending && <p className="pl-9 text-xs text-slate-500">Thinking...</p>}
        {errorMessage && (
          <p className="whitespace-pre-line text-xs text-red-600">{errorMessage}</p>
        )}

        {/* Suggestions replace the blank-box problem, and steer people to
            questions the assistant can actually answer well. */}
        {!sending && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestionsFor(results).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                className="rounded-full border border-emerald-700 px-2.5 py-1 text-xs text-emerald-800"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft.trim());
        }}
        className="border-t border-slate-200 p-2"
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about a scheme..."
            aria-label="Your question"
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Does not decide eligibility or calculate amounts. Anything outside the
          schemes screened here is unverified — confirm on SupportGoWhere.
        </p>
      </form>
    </section>
  );
}
