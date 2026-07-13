import {
  RepoVisibility,
  Repository,
} from "@/pages/RepositoriesPage/types/types";

export interface FormState {
  owner: string;
  name: string;
  description: string;
  visibility: RepoVisibility;
  isOfficial: boolean;
}

export interface FormErrors {
  name?: string;
}

export interface CreateRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    repo: Omit<Repository, "id" | "pullCount" | "stars" | "tags" | "updatedAt">,
  ) => void;
  namespace: string;
}

export interface VisibilityToggleProps {
  value: RepoVisibility;
  onChange: (v: RepoVisibility) => void;
}

export interface Owner {
  value: string;
  label: string;
  type: "user" | "org";
}
