export type AppRoute = "jar" | "plan" | "scenario" | "not_found";

export type AppPath =
  | "/resilience-jar"
  | "/resilience-jar/plan"
  | "/scenario-simulator";

export function resolveAppRoute(pathname: string): AppRoute {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/" || path === "/resilience-jar") return "jar";
  if (path === "/resilience-jar/plan") return "plan";
  if (path === "/scenario-simulator") return "scenario";
  return "not_found";
}
