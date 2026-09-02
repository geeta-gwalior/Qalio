export default function Loading() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
        <div>
          <div className="h-6 w-48 bg-gray-200 animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 animate-pulse"></div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>

        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-gray-200"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
