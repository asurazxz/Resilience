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
      className={`inline-flex shrink-0 items-center justify-center rounded-md ${className}`}
      style={{ background: "var(--color-cobalt)", color: "var(--color-pure)" }}
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
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (expanded) setExpanded(false);
        else setOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expanded, open]);

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
        className="nav-glass fixed bottom-4 right-4 z-50 transition hover:scale-105"
        style={{ borderRadius: "9999px", padding: "4px" }}
      >
        <BotAvatar className="h-14 w-14" />
      </button>
    );
  }

  return (
    <section
      aria-label="Scheme assistant"
      /* Expanded, the panel is pinned below the fixed app top bar rather than
         to the viewport top, so its header controls can never sit underneath
         that chrome. Horizontal insets keep it inside the viewport at 390px. */
      className={`nav-glass fixed z-50 flex flex-col overflow-hidden transition-[inset,width,height] ${
        expanded
          ? "inset-x-3 bottom-3 md:inset-x-8 md:bottom-8"
          : "bottom-4 right-4 h-[30rem] w-[min(22rem,calc(100vw-2rem))]"
      }`}
      style={{
        borderRadius: "16px",
        ...(expanded ? { top: "calc(var(--topbar-height, 4rem) + 12px)" } : {}),
      }}
    >
      {/* Single row, but every control is shrink-0 and only the title may
          collapse, so the close button survives a 390px-wide viewport. */}
      <header className="divider flex items-center gap-2 border-b px-3 py-2">
        <BotAvatar className="h-8 w-8" />
        <h2
          className="body-text min-w-0 flex-1 truncate"
          style={{ color: "var(--color-ivory)", fontWeight: 500 }}
        >
          Scheme assistant
        </h2>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Return the scheme assistant to the corner" : "Expand the scheme assistant"}
          aria-expanded={expanded}
          className="mono-label inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded px-2 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          {/* The wording is what pushed the close button off-screen on mobile;
              below `sm` the same control shows as a glyph instead. */}
          <span className="hidden sm:inline">{expanded ? "Corner view" : "Full window"}</span>
          <span aria-hidden="true" className="text-base leading-none sm:hidden">
            {expanded ? "⤡" : "⤢"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setExpanded(false); setOpen(false); }}
          aria-label="Close the scheme assistant"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded text-xl leading-none transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          style={{ color: "var(--color-ash)" }}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      {/* 24px between turns so a long reply reads as its own block rather
          than merging into the next one. */}
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="flex gap-3">
          <BotAvatar className="h-7 w-7" />
          <p
            className="body-text prose rounded-lg px-3 py-2"
            style={{ background: "var(--surface-obsidian-button)" }}
          >
            {GREETING}
          </p>
        </div>

        {messages.map((message, index) =>
          message.role === "user" ? (
            <p
              key={`user-${index}`}
              className="body-text prose ml-10 rounded-lg px-3 py-2"
              style={{ background: "var(--color-cobalt)", color: "var(--color-pure)" }}
            >
              {message.content}
            </p>
          ) : (
            <div key={`bot-${index}`} className="flex gap-3">
              <BotAvatar className="h-7 w-7" />
              {/* whitespace-pre-line keeps the line breaks the backend sends;
                  without it the bulleted answers collapse into one paragraph. */}
              <p
                className="body-text prose whitespace-pre-line rounded-lg px-3 py-2"
                style={{ background: "var(--surface-obsidian-button)" }}
              >
                {message.content}
              </p>
            </div>
          ),
        )}

        {sending && <p className="mono-label pl-10">Thinking...</p>}
        {errorMessage && (
          <p className="mono-label prose whitespace-pre-line">{errorMessage}</p>
        )}

        {/* Suggestions replace the blank-box problem, and steer people to
            questions the assistant can actually answer well. */}
        {!sending && (
          <div className="flex flex-wrap gap-2 pt-3">
            {suggestionsFor(results).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                className="button-pill px-3 py-2 text-xs"
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
        className="divider border-t p-3"
      >
        <div className="flex gap-2">
          <input
            value={draft}
            maxLength={500}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about a scheme..."
            aria-label="Your question"
            className="field min-w-0 flex-1 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="button-primary shrink-0 px-3 py-1.5 text-sm"
          >
            Send
          </button>
        </div>
        <p className="mono-label prose mt-3 normal-case tracking-normal">
          Does not decide eligibility or calculate amounts. Anything outside the
          schemes screened here is unverified — confirm on SupportGoWhere.
        </p>
        <p className="mono-label mt-3 text-right normal-case tracking-normal">{draft.length}/500</p>
      </form>
    </section>
  );
}
