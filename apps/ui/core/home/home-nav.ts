import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  Bookmark,
  Home,
  List,
  Search,
  User,
} from "lucide-react-native";

export type HomeNavItemId =
  | "home"
  | "explore"
  | "notifications"
  | "bookmarks"
  | "lists"
  | "profile";

export type HomeNavItem = {
  id: HomeNavItemId;
  label: string;
  icon: LucideIcon;
};

export const HOME_NAV_ITEMS: HomeNavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Search },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "lists", label: "Lists", icon: List },
  { id: "profile", label: "Profile", icon: User },
];
