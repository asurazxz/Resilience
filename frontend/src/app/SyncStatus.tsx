import { useState } from "react";

import { useFoundation } from "../features/foundation-input/FoundationContext";

/**
 * Sync status is deliberately silent when everything is fine: the floating
 * button and its panel render only once a pending mutation needs a human
 * (failed or in conflict). The plain offline banner stays independent of
 * that, since it communicates connectivity rather than sync health.
 */
export function SyncStatus({ navOpen }: { navOpen: boolean }) {
  const { online, pending, syncNow, resolveConflict } = useFoundation();
  const [open, setOpen] = useState(false);
  const needsAttention = pending.filter((item) => item.status === "failed" || item.status === "conflict");
  const conflicts = pending.filter((item) => item.status === "conflict");
  const shift = navOpen ? " sync-shifted" : "";
  return (
    <>
      {!online && (
        <div className="px-4 py-3 text-center mono-label ink-heading" style={{ background: "var(--surface-obsidian-button)" }}>
          Offline — changes are saved on this device and will sync when you reconnect.
        </div>
      )}
      {needsAttention.length > 0 && (
        <>
          <button
            className={`sync-fab${shift} button-pill fixed bottom-4 left-4 z-30 px-4 py-3 text-sm`}
            onClick={() => setOpen(!open)}
            type="button"
          >
            {online ? "Online" : "Offline"} · {needsAttention.length} need{needsAttention.length === 1 ? "s" : ""} attention
          </button>
          {open && (
            <aside className={`sync-panel${shift} card fixed bottom-20 left-4 z-30 w-[min(24rem,calc(100vw-2rem))]`} aria-label="Sync status">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Device sync</p>
                  <h2 className="mt-2 display-lg" style={{ fontSize: "20px" }}>Some changes need attention</h2>
                </div>
                <button className="button-secondary" style={{ minHeight: "auto", padding: "6px 10px" }} onClick={() => setOpen(false)} type="button">Close</button>
              </div>
              {pending.map((item) => (
                <div className="note mt-3" key={item.id}>
                  <strong className="mono-label ink-heading">{item.status}</strong>
                  <p className="mt-2 break-all body-text-sm">{item.method} {item.path}</p>
                  {item.error && <p className="mt-2 body-text-sm">{item.error.message}</p>}
                  {item.status === "conflict" && (
                    <div className="mt-3 flex gap-2">
                      <button className="button-secondary" style={{ minHeight: "auto", padding: "6px 12px" }} onClick={() => void resolveConflict(item.id, false)} type="button">Use server</button>
                      <button className="button-primary" style={{ minHeight: "auto", padding: "6px 12px" }} onClick={() => void resolveConflict(item.id, true)} type="button">Keep mine</button>
                    </div>
                  )}
                </div>
              ))}
              <button className="button-primary mt-4 w-full" disabled={!online || conflicts.length > 0 || pending.length === 0} onClick={() => void syncNow()} type="button">Sync now</button>
            </aside>
          )}
        </>
      )}
    </>
  );
}
