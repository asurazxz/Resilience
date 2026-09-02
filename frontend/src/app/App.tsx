import { useEffect, useMemo, useState, type MouseEvent } from "react";

import {
  FixtureResilienceJarApi,
  readCachedSummary,
  ResilienceJarPage,
} from "../features/resilience-jar/index.ts";
import { ScenarioSimulatorPage } from "../features/scenario-simulator/index.ts";
import { resolveAppRoute, type AppPath } from "./routing.ts";
import "./app.css";

export function App() {
  const fixtureApi = useMemo(
    () => new FixtureResilienceJarApi(readCachedSummary()),
    [],
  );
  const [pathname, setPathname] = useState(window.location.pathname);
  const route = resolveAppRoute(pathname);

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path: AppPath) {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    setPathname(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLink(path: AppPath) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(path);
    };
  }

  if (route === "not_found") {
    return (
      <main className="app-not-found">
        <p className="app-brand">Resilience</p>
        <h1>Page not found</h1>
        <a href="/resilience-jar" onClick={handleLink("/resilience-jar")}>
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
          aria-label="Resilience home"
          onClick={handleLink("/resilience-jar")}
        >
          <span aria-hidden="true">R</span>
          <strong>Resilience</strong>
        </a>
        <nav className="app-nav" aria-label="Main navigation">
          <a
            href="/resilience-jar"
            aria-current={route === "jar" || route === "plan" ? "page" : undefined}
            onClick={handleLink("/resilience-jar")}
          >
            Emergency Fund
          </a>
          <a
            href="/scenario-simulator"
            aria-current={route === "scenario" ? "page" : undefined}
            onClick={handleLink("/scenario-simulator")}
          >
            Setback Planner
          </a>
        </nav>
        <span className="app-demo-label">Local demo</span>
      </header>
      {route === "scenario" ? (
        <ScenarioSimulatorPage />
      ) : (
        <ResilienceJarPage api={fixtureApi} view={route} onNavigate={navigate} />
      )}
    </>
  );
}
