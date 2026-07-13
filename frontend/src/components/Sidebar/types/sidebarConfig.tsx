import {
  BadgeCheck,
  BarChart3,
  BookMarked,
  Home,
  Search,
  Settings,
  Shield,
  Users,
  Webhook,
} from "lucide-react";
import { NavSection, Plan } from "./types";

import type { Role } from "@/context/types/types";
import { isAdminRole } from "@/context/types/types";

export function getNavSections(role: Role): NavSection[] {
  const sections: NavSection[] = [
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

  const adminItems = [
    ...(isAdminRole(role)
      ? [
          { label: "Analytics", icon: <BarChart3 size={16} />, path: "/admin/logs" },
          { label: "User badges", icon: <BadgeCheck size={16} />, path: "/admin/badges" },
        ]
      : []),
    ...(role === "SuperAdmin"
      ? [{ label: "Administrators", icon: <Shield size={16} />, path: "/admin/users" }]
      : []),
  ];

  if (adminItems.length > 0) {
    sections.push({ title: "Administration", items: adminItems });
  }

  return sections;
}

export const PLAN_COLOR: Record<Plan, string> = {
  Free: "text-[var(--color-text-muted)]",
  Pro: "text-[var(--color-brand)]",
  Team: "text-[var(--color-success)]",
};
