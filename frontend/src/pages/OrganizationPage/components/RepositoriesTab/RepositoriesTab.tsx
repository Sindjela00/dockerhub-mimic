import InputField from "@/components/InputField/InputField";
import { REPOS } from "../../mock/mock";
import RepoCard from "@/components/Cards/RepoCard/RepoCard";
import { Search } from "lucide-react";
import { useState } from "react";

interface RepositoriesTabProps {
  onRepoClick?: (repo: any) => void;
  onRepoEdit?: (repo: any) => void;
  onRepoDelete?: (repo: any) => void;
}

export function RepositoriesTab({
  onRepoClick,
  onRepoEdit,
  onRepoDelete,
}: RepositoriesTabProps) {
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">(
    "all",
  );

  const filtered = REPOS.filter((r) => {
    const matchesSearch = r.name
      .toLowerCase()
      .includes(search.toLowerCase().trim());
    const matchesVis =
      visibility === "all" ||
      (visibility === "public" && !r.isPrivate) ||
      (visibility === "private" && r.isPrivate);
    return matchesSearch && matchesVis;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <InputField
            value={search}
            onChange={(value) => setSearch(value)}
            placeholder="Find a repository..."
            startIcon={<Search size={13} className="text-text-muted" />}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-12">
            No repositories match your search.
          </p>
        ) : (
          filtered.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onClick={(r) => onRepoClick?.(r)}
              onEdit={(r) => onRepoEdit?.(r)}
              onDelete={(r) => onRepoDelete?.(r)}
            />
          ))
        )}
      </div>
    </div>
  );
}
