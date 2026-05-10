import { useEffect, useState } from 'react'
import { useStore, getTaskStats, type TaskStats } from '../store'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

export default function StatsModal() {
  const showStats = useStore((s) => s.showStats)
  const setShowStats = useStore((s) => s.setShowStats)
  const [stats, setStats] = useState<TaskStats | null>(null)

  useCloseOnEscape(showStats, () => setShowStats(false))
  useBodyScrollLock(showStats)

  useEffect(() => {
    if (showStats) setStats(getTaskStats())
  }, [showStats])

  const fmtMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const s = Math.round(ms / 1000)
    const m = Math.floor(s / 60)
    return m > 0 ? `${m}m${s % 60}s` : `${s}s`
  }

  const fmtPct = (n: number, total: number) =>
    total > 0 ? `${((n / total) * 100).toFixed(0)}%` : '-'

  if (!showStats || !stats) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setShowStats(false)}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-overlay-in" />
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/50 bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 animate-modal-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            使用统计
          </h3>
          <button onClick={() => setShowStats(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* 概要数字 */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="总任务" value={String(stats.total)} />
            <StatCard label="已完成" value={String(stats.completed)} sub={fmtPct(stats.completed, stats.total)} />
            <StatCard label="失败" value={String(stats.failed)} sub={fmtPct(stats.failed, stats.total)} />
            <StatCard label="进行中" value={String(stats.inProgress)} />
            <StatCard label="总图片数" value={String(stats.totalImages)} />
            <StatCard label="总耗时" value={fmtMs(stats.totalElapsedMs)} />
          </div>

          {/* 今日 */}
          <div className="bg-blue-50 rounded-xl p-3 text-sm">
            <span className="text-blue-500 font-medium">今日</span>
            <span className="text-blue-600 ml-2">
              生成 {stats.today.completed} / {stats.today.total} 次
            </span>
          </div>

          {/* Usage */}
          {(stats.usage.inputTokens > 0 || stats.usage.outputTokens > 0) && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
              <div className="font-medium text-gray-600 mb-1">Token 用量</div>
              <div className="flex justify-between">
                <span>输入</span>
                <span className="font-mono">{stats.usage.inputTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>输出</span>
                <span className="font-mono">{stats.usage.outputTokens.toLocaleString()}</span>
              </div>
              {stats.usage.images > 0 && (
                <div className="flex justify-between">
                  <span>API 图片数</span>
                  <span className="font-mono">{stats.usage.images}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-lg font-semibold text-gray-800 font-mono">{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
    </div>
  )
}
