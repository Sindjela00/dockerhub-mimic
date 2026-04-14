import {
  BookMarked,
  Home,
  Search,
  Settings,
  Shield,
  Users,
  Webhook,
} from "lucide-react";
import { NavSection, Plan } from "./types";

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Explore",
    items: [
      { label: "Home", icon: <Home size={16} />, path: "/" },
      {
        label: "Repositories",
        icon: <BookMarked size={16} />,
        path: "/repositories",
        badge: 12,
      },
    ],
  },
  {
    title: "Personal",
    items: [
      {
        label: "Organizations",
        icon: <Users size={16} />,
        path: "/organizations",
      },
      // { label: "Security", icon: <Shield size={16} />, path: "/security" },
      // { label: "Webhooks", icon: <Webhook size={16} />, path: "/webhooks" },
      // { label: "Settings", icon: <Settings size={16} />, path: "/settings" },
    ],
  },
];

export const PLAN_COLOR: Record<Plan, string> = {
  Free: "text-[var(--color-text-muted)]",
  Pro: "text-[var(--color-brand)]",
  Team: "text-[var(--color-success)]",
};
