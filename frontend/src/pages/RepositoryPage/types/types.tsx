import { TabItem } from "@/components/Tabs/Tabs";

export type RepoVisibility = "public" | "private";

export interface TagDetail {
  name: string;
  digest: string;
  size: string;
  pushedAt: string;
  os: string;
  arch: string;
}

export interface Repository {
  id: string;
  name: string;
  namespace: string;
  description: string;
  visibility: RepoVisibility;
  pullCount: number;
  stars: number;
  tags: string[];
  updatedAt: string;
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
