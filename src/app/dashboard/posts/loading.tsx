export default function PostsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b border-gray-100 px-6 py-4 last:border-0 dark:border-gray-800">
            <div className="flex-1">
              <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
