'use client'

interface Props {
  oldText: string
  newText: string
}

export default function VersionDiff({ oldText, newText }: Props) {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')

  // Simple line-based diff
  const diff = computeLineDiff(oldLines, newLines)

  return (
    <div className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 font-mono text-xs dark:border-gray-700 dark:bg-gray-950">
      {diff.map((line, i) => (
        <div
          key={i}
          className={`whitespace-pre-wrap px-3 py-0.5 ${
            line.type === 'add'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : line.type === 'remove'
              ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <span className="mr-2 inline-block w-4 select-none text-gray-400">
            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
          </span>
          {line.text}
        </div>
      ))}
      {diff.length === 0 && (
        <p className="p-4 text-center text-gray-400">変更なし</p>
      )}
    </div>
  )
}

interface DiffLine {
  type: 'add' | 'remove' | 'same'
  text: string
}

function computeLineDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  // LCS-based diff
  const m = oldLines.length
  const n = newLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const result: DiffLine[] = []
  let i = m, j = n
  const stack: DiffLine[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'same', text: oldLines[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', text: newLines[j - 1] })
      j--
    } else {
      stack.push({ type: 'remove', text: oldLines[i - 1] })
      i--
    }
  }

  stack.reverse()
  return stack
}
