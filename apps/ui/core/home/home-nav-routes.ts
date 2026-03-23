import type { HomeNavItemId } from "./home-nav";

export type HomeNavRoute = HomeNavItemId;

export function homeNavRoute(id: HomeNavItemId): HomeNavRoute {
  return id;
}
