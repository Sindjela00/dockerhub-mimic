import { Repository } from "@/services/repositories/repositories.api";
import type { TabItem } from "@/components/Tabs/Tabs";

export interface TagDetail {
  name: string;
  digest: string;
  size: string;
  pushedAt: string;
  os: string;
  arch: string;
}

export interface RepositoryDetail extends Repository {
  tagDetails: TagDetail[];
  createdAt: string;
  readme?: string;
}

export type Tab = "overview" | "tags";

export const TABS: TabItem<Tab>[] = [
  { value: "overview", label: "Overview" },
  { value: "tags", label: "Tags" },
];
