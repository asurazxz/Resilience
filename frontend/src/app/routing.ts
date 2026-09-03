export type AppRoute =
  | "home"
  | "signin"
  | "onboarding"
  | "jar"
  | "savings"
  | "plan"
  | "scenario"
  | "schemes"
  | "profile"
  | "not_found";

export type AppPath =
  | "/"
  | "/signin"
  | "/onboarding"
  | "/transactions"
  | "/transactions/new"
  | "/income-reality"
  | "/resilience-jar"
  | "/resilience-jar/plan"
  | "/savings"
  | "/scenario-simulator"
  | "/scheme-navigator"
  | "/profile"
  | "/settings";

/**
 * A signed-out visitor sees the landing page at "/" (and any unrecognised
 * path) with "/signin" as its one carve-out for the sign-in form. A
 * signed-in user who has not completed onboarding keeps seeing the landing
 * page at every path except "/onboarding"; `resolveAppRoute` describes the
 * shell's own path space once onboarding is complete.
 */
export function resolveAppRoute(pathname: string): AppRoute {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/signin") return "signin";
  if (path === "/onboarding") return "onboarding";
  if (path === "/resilience-jar") return "jar";
  if (path === "/resilience-jar/plan") return "plan";
  if (path === "/savings") return "savings";
  if (path === "/scenario-simulator") return "scenario";
  if (path === "/scheme-navigator") return "schemes";
  // "/settings" was the standalone Financial details screen; it now redirects
  // into Profile, so both paths resolve to the same route here.
  if (path === "/profile" || path === "/settings") return "profile";
  return "not_found";
}
