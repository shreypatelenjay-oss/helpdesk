import { Navbar } from "./Navbar";
import { Skeleton } from "./ui/skeleton";

export function TicketDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" data-testid="detail-loading">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
