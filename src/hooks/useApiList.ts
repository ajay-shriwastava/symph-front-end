import { useState, useEffect, useCallback, useRef } from "react";
import type { Paginated } from "../js/api.ts";
import { useToast } from "../context/ToastContext.tsx";

interface UseApiListResult<T> {
  items: T[];
  total: number;
  skip: number;
  loading: boolean;
  setSkip: React.Dispatch<React.SetStateAction<number>>;
  reload: () => void;
}

/**
 * Generic hook for paginated API lists.
 *
 * @param fetcher  — async function that returns `Paginated<T>` given (skip, limit).
 *                   Wrap in useCallback in the consumer so it only changes when filters change.
 * @param limit    — page size
 */
export function useApiList<T>(
  fetcher: (skip: number, limit: number) => Promise<Paginated<T>>,
  limit: number,
): UseApiListResult<T> {
  const showToast = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const prevFetcherRef = useRef(fetcher);

  // Reset to page 0 when the fetcher identity changes (i.e. filters changed)
  useEffect(() => {
    if (prevFetcherRef.current !== fetcher) {
      prevFetcherRef.current = fetcher;
      setSkip(0);
    }
  }, [fetcher]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetcher(skip, limit);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [fetcher, skip, limit, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, total, skip, loading, setSkip, reload: load };
}
