import { SearchInput } from "./search-input";
import { SearchSheet } from "./search-sheet";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchMobileProps {
  className?: string;
}

export function SearchMobile({ className }: SearchMobileProps) {
  return (
    <div className={className}>
      <div className="block md:hidden">
        <SearchSheet>
          <Button
            variant="outline"
            size="icon"
            className={`gap-2 ${className || ""}`}
          >
            <Search className="h-5 w-5" />
          </Button>
        </SearchSheet>
      </div>

      <div className="hidden md:block">
        <SearchInput />
      </div>
    </div>
  );
}
