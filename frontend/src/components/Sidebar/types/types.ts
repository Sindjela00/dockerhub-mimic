export type Plan = "Free" | "Pro" | "Team";

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

