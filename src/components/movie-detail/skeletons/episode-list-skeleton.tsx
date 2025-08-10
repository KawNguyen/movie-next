import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function EpisodeListSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <span>•</span>
            <Skeleton className="h-5 w-20" />
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex w-full mb-2 space-x-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>

        <ScrollArea className="h-[350px] w-full rounded-md border p-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
