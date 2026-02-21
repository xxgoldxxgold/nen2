export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
        ))}
      </div>
      <div className="h-48 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
    </div>
  )
}
