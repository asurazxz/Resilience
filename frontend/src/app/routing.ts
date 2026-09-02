export type AppRoute = "jar" | "plan" | "scenario" | "schemes" | "not_found";

export type AppPath =
  | "/resilience-jar"
  | "/resilience-jar/plan"
  | "/scenario-simulator"
  | "/scheme-navigator";

export function resolveAppRoute(pathname: string): AppRoute {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/" || path === "/resilience-jar") return "jar";
  if (path === "/resilience-jar/plan") return "plan";
  if (path === "/scenario-simulator") return "scenario";
  if (path === "/scheme-navigator") return "schemes";
  return "not_found";
}
