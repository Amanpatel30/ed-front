"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseTableQueryOptions<F extends Record<string, unknown> = Record<string, unknown>> {
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
  initialFilters?: F;
  debounceMs?: number;
}

export function useTableQuery<F extends Record<string, unknown> = Record<string, unknown>>({
  initialPage = 1,
  initialPageSize = 10,
  initialSearch = "",
  initialSortBy,
  initialSortOrder = "asc",
  initialFilters = {} as F,
  debounceMs = 300,
}: UseTableQueryOptions<F> = {}) {
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [search, setSearch] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);
  const [filters, setFilters] = useState<F>(initialFilters);

  // Debounce search input
  const isFirstRender = useRef(true);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      // Auto-reset page to 1 on search change (skip initial mount)
      if (!isFirstRender.current) {
        setPage(1);
      }
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [search, debounceMs]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  // Set individual filter and auto-reset page to 1
  const setFilter = useCallback(
    <K extends keyof F>(key: K, value: F[K]) => {
      setFilters((prev) => {
        if (prev[key] === value) return prev;
        return {
          ...prev,
          [key]: value,
        };
      });
      setPage(1);
    },
    []
  );

  // Set multiple filters at once
  const updateFilters = useCallback(
    (newFilters: Partial<F>) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
      }));
      setPage(1);
    },
    []
  );

  // Reset filters and search back to initial
  const resetFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setFilters(initialFilters);
    setPage(1);
  }, [initialFilters]);

  // Handle column sort toggle
  const handleSort = useCallback(
    (columnKey: string) => {
      setSortBy((prevSortBy) => {
        if (prevSortBy === columnKey) {
          setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
          return columnKey;
        }
        setSortOrder("asc");
        return columnKey;
      });
      setPage(1);
    },
    []
  );

  // Handle page size change (resets to page 1)
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  // Check if any active filter or search term differs from defaults
  const isFiltered = useMemo(() => {
    if (search.trim().length > 0) return true;
    for (const key of Object.keys(filters)) {
      if (filters[key] !== initialFilters[key]) {
        return true;
      }
    }
    return false;
  }, [search, filters, initialFilters]);

  // Query arguments formatted for RTK Query endpoints
  const queryArgs = useMemo(() => {
    const args: Record<string, unknown> = {
      page,
      limit: pageSize,
    };

    const trimmed = debouncedSearch.trim();
    if (trimmed) {
      args.search = trimmed;
    }

    if (sortBy) {
      args.sort = sortBy;
      args.order = sortOrder;
    }

    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== "all" && val !== "") {
        args[key] = val;
      }
    }

    return args;
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder, filters]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    search,
    setSearch,
    debouncedSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filters,
    setFilter,
    updateFilters,
    resetFilters,
    handleSort,
    isFiltered,
    queryArgs,
  };
}
