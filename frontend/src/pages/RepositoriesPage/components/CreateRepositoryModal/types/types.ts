import {
  RepoVisibility,
  Repository,
} from "@/pages/RepositoriesPage/types/types";

export interface FormState {
  name: string;
  description: string;
  visibility: RepoVisibility;
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
