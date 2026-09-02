import { useEffect, useMemo, useState, type MouseEvent } from "react";

import {
  FixtureResilienceJarApi,
  ResilienceJarPage,
} from "../features/resilience-jar/index.ts";
import { resolveAppRoute } from "./routing.ts";

export function App() {
  const fixtureApi = useMemo(() => new FixtureResilienceJarApi(), []);
  const [pathname, setPathname] = useState(window.location.pathname);
  const route = resolveAppRoute(pathname);

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path: "/resilience-jar" | "/resilience-jar/plan") {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    setPathname(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleHomeLink(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    navigate("/resilience-jar");
  }

  if (route === "not_found") {
    return (
      <main className="app-not-found">
        <p className="app-brand">Resilience</p>
        <h1>Page not found</h1>
        <a href="/resilience-jar" onClick={handleHomeLink}>
          Open the Emergency Fund
        </a>
      </main>
    );
  }

  return (
    <>
      <header className="app-header">
        <a
          className="app-logo"
          href="/resilience-jar"
          aria-label="Emergency Fund home"
          onClick={handleHomeLink}
        >
          <span aria-hidden="true">R</span>
          <strong>Resilience</strong>
        </a>
        <span className="app-demo-label">Local demo</span>
      </header>
      <ResilienceJarPage
        api={fixtureApi}
        view={route}
        onNavigate={navigate}
      />
    </>
  );
}
