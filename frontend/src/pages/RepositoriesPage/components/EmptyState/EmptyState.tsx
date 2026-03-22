import { BookMarked, Plus } from "lucide-react";

import Button from "../../../../components/Button/Button";

interface EmptyStateProps {
  onCreate: () => void;
}

export default function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full m-auto text-center">
      <div
        className="w-14 h-14 rounded-xl bg-bg-elevated flex items-center
                      justify-center text-text-secondary mb-5"
      >
        <BookMarked size={24} />
      </div>
      <h2 className="text-base font-medium text-text-primary mb-2">
        No repositories yet
      </h2>
      <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-6">
        Create your first repository to start pushing and pulling Docker images.
      </p>
      <Button variant="primary" size="md" onClick={onCreate}>
        <Plus size={15} />
        Create repository
      </Button>
    </div>
  );
}
