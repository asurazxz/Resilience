export type AppRoute = "jar" | "plan" | "not_found";

export function resolveAppRoute(pathname: string): AppRoute {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/" || path === "/resilience-jar") return "jar";
  if (path === "/resilience-jar/plan") return "plan";
  return "not_found";
}
