import { Skeleton } from "@/components/ui/skeleton"

export default function JobDetailsLoading() {
  return (
    <div className="max-w mx-auto px-1 py-6">
      {/* Back button and title skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Main job card skeleton */}
      <div className="bg-white rounded-lg border shadow-xl mb-8 relative">
        <div className="p-2">
          <div className="flex flex-wrap gap-9.5">
            <div className="flex">
              <div className="pr-2">
                <Skeleton className="w-16 h-16 rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-5 w-32 mt-2" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:pl-7 mt-4 md:mt-0">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="px-0 md:px-8">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16 mt-1" />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

          {/* Content skeletons */}
          <div className="mt-6 space-y-6">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-20 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Similar jobs skeleton */}
      <div className="mb-4 flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="border-t border-dashed border-gray-300"></div>
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
