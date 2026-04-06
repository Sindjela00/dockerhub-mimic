import { starRepository, unstarRepository } from "../repositories.api";
import { useEffect, useState } from "react";

export function useStarRepository(
  repositoryId: number,
  initialStarred: boolean,
  initialCount: number,
) {
  const [starred, setStarred] = useState(initialStarred);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStarred(initialStarred);
    setCount(initialCount);
  }, [initialStarred, initialCount]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (starred) {
        await unstarRepository(repositoryId);
        setStarred(false);
        setCount((c) => c - 1);
      } else {
        await starRepository(repositoryId);
        setStarred(true);
        setCount((c) => c + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return { starred, count, loading, toggle };
}
