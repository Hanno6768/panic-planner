import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      className="max-w-6xl mx-auto p-8 space-y-8"
      aria-label="Loading your planner"
    >
      <Skeleton className="h-14 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </main>
  );
}
