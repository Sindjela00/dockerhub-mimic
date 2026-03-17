export type Filter = "all" | "public" | "private";

export type RepoVisibility = "public" | "private";

export type ViewMode = "grid" | "table";

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
