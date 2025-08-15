"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";
import { SearchResults } from "./search-results";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchInputProps {
  onSearch?: (query: string) => void;
}

export function SearchInput({ onSearch }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 1) {
      setShowResults(true);
      onSearch?.(debouncedQuery);
    } else {
      setShowResults(false);
    }
  }, [debouncedQuery, onSearch]);

  useEffect(() => {
    if (query.trim().length >= 1 && query !== debouncedQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [query, debouncedQuery]);

  const clearSearch = () => {
    setQuery("");
    setShowResults(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-md">
          <Input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-8"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {query && !isSearching && (
              <button
                onClick={clearSearch}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showResults && debouncedQuery.trim().length >= 1 && (
        <SearchResults
          query={debouncedQuery}
          onClose={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
