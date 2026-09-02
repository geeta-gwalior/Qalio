import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePageSkeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="flex-1">
        {/* User info card */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 relative">
          <div className="absolute top-0 right-0">
            <Skeleton className="w-16 h-16 rounded-full" />
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Skeleton className="w-20 h-20 sm:w-14 sm:h-14 rounded-full" />
            <div className="text-center sm:text-left space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="flex items-center" key={i}>
                <Skeleton className="min-w-[40px] w-10 h-10 rounded mr-3" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs content skeleton */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <Skeleton className="h-6 w-40 mb-4" />

          <div className="flex gap-4 overflow-x-auto mb-6">
            {["Education", "Skill", "Portfolio"].map((_, i) => (
              <Skeleton key={i} className="w-24 h-8 rounded" />
            ))}
          </div>

          <div className="space-y-8">
            <Skeleton className="h-6 w-40 mb-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-full max-w-lg mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-square w-full rounded-lg"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
