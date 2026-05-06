import { useEffect, useState, useCallback } from 'react'
import { useStore, getCacheStats, pruneExpiredCache, dedupCache, cleanupDeletedTaskCache, getAllStoredImages, removeCachedImage, getThumbnail, initRemoteImageCache, type StoredImage } from '../store'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'

export default function DbManageModal() {
  const showDbManage = useStore((s) => s.showDbManage)
  const setShowDbManage = useStore((s) => s.setShowDbManage)
  const setLightboxImageUrl = useStore((s) => s.setLightboxImageUrl)
  const showToast = useStore((s) => s.showToast)

  const [stats, setStats] = useState(getCacheStats())
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [storedImages, setStoredImages] = useState<Array<StoredImage & { thumb: string }>>([])
  const [galleryLoading, setGalleryLoading] = useState(false)

  useCloseOnEscape(showDbManage, () => setShowDbManage(false))

  useEffect(() => {
    if (!showDbManage) return
    initRemoteImageCache().then(() => {
      setStats(getCacheStats())
    }).catch(() => {
      setStats(getCacheStats())
    })
    navigator.storage?.estimate().then((e) => {
      if (e.usage != null && e.quota != null) {
        setStorageEstimate({ usage: e.usage, quota: e.quota })
      }
    }).catch(() => {})
  }, [showDbManage])

  const loadGallery = useCallback(async () => {
    setGalleryLoading(true)
    await initRemoteImageCache()
    setStats(getCacheStats())
    const images = getAllStoredImages()
    const withThumbs = await Promise.all(
      images.map(async (img) => ({
        ...img,
        thumb: await getThumbnail(img.dataUrl),
      })),
    )
    setStoredImages(withThumbs)
    setGalleryLoading(false)
  }, [])

  const handleOpenGallery = () => {
    setShowGallery(true)
    loadGallery()
  }

  const fmtBytes = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  const handlePrune = async () => {
    setBusy(true)
    const n = await pruneExpiredCache()
    setStats(getCacheStats())
    setBusy(false)
    showToast(n > 0 ? `已清理 ${n} 条失效缓存` : '没有失效缓存', n > 0 ? 'success' : 'info')
  }

  const handleDedup = async () => {
    setBusy(true)
    const n = await dedupCache()
    setStats(getCacheStats())
    setBusy(false)
    showToast(n > 0 ? `已去重 ${n} 条重复缓存` : '没有重复缓存', n > 0 ? 'success' : 'info')
  }

  const handleCleanupDeleted = async () => {
    setBusy(true)
    const n = await cleanupDeletedTaskCache()
    setStats(getCacheStats())
    setBusy(false)
    showToast(n > 0 ? `已清理 ${n} 条已删除任务的缓存` : '没有需要清理的缓存', n > 0 ? 'success' : 'info')
  }

  const handleDeleteImage = (cacheKey: string) => {
    removeCachedImage(cacheKey)
    setStoredImages((prev) => prev.filter((img) => img.cacheKey !== cacheKey))
    setStats(getCacheStats())
    showToast('已删除缓存', 'success')
  }

  const handleOpenLightbox = (dataUrl: string) => {
    const allUrls = storedImages.map((img) => img.dataUrl)
    setLightboxImageUrl(dataUrl, allUrls)
  }

  if (!showDbManage) return null

  const galleryWidth = showGallery ? 'max-w-2xl' : 'max-w-sm'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setShowDbManage(false)}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-overlay-in" />
      <div
        className={`relative z-10 w-full ${galleryWidth} rounded-3xl border border-white/50 bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 animate-modal-in max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            {showGallery ? '浏览存储图片' : '本地数据库'}
          </h3>
          <div className="flex items-center gap-2">
            {showGallery && (
              <button
                onClick={() => setShowGallery(false)}
                className="rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
              >
                返回
              </button>
            )}
            <button
              onClick={() => setShowDbManage(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!showGallery ? (
          <>
            {/* 缓存统计 */}
            <section className="mb-5">
              <h4 className="text-xs font-medium text-gray-500 mb-3">存储统计</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">远程缓存</span>
                  <span className="font-mono text-gray-700">{stats.cacheCount} 张</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">任务输出图 (base64)</span>
                  <span className="font-mono text-gray-700">{stats.taskCount} 张</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-gray-600 font-medium">合计</span>
                  <span className="font-mono text-gray-800 font-medium">{stats.count} 张</span>
                </div>
                {stats.bytes > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">估算大小</span>
                    <span className="font-mono text-gray-400">{fmtBytes(stats.bytes)}</span>
                  </div>
                )}
                {storageEstimate && storageEstimate.quota > 0 && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">浏览器存储</span>
                      <span className="font-mono text-gray-400">
                        {fmtBytes(storageEstimate.usage)} / {fmtBytes(storageEstimate.quota)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all"
                        style={{ width: `${(storageEstimate.usage / storageEstimate.quota) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* 操作 */}
            <section>
              <h4 className="text-xs font-medium text-gray-500 mb-3">操作</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleOpenGallery}
                  className="w-full py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  浏览所有存储图片 · {stats.count} 张
                </button>
                <button
                  onClick={handlePrune}
                  disabled={busy}
                  className="w-full py-2 rounded-xl text-sm font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  {busy ? '处理中...' : '清理失效缓存（检查远程 URL 是否可访问）'}
                </button>
                <button
                  onClick={handleDedup}
                  disabled={busy}
                  className="w-full py-2 rounded-xl text-sm font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  {busy ? '处理中...' : '去重（删除内容相同的重复缓存）'}
                </button>
                <button
                  onClick={handleCleanupDeleted}
                  disabled={busy}
                  className="w-full py-2 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {busy ? '处理中...' : '清理已删除任务的图片缓存'}
                </button>
              </div>
            </section>
          </>
        ) : (
          /* 图片浏览 */
          <div className="flex-1 overflow-y-auto -mx-2 px-2">
            {galleryLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : storedImages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">暂无存储图片</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {storedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.thumb}
                      className="w-full aspect-square rounded-xl object-cover border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity bg-gray-50"
                      onClick={() => handleOpenLightbox(img.dataUrl)}
                      alt=""
                      loading="lazy"
                    />
                    {/* 来源标签 */}
                    <span className={`absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full ${
                      img.source === 'cache'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {img.source === 'cache' ? '缓存' : '任务'}
                    </span>
                    {/* 操作按钮 - 仅缓存可删 */}
                    {img.deletable && img.cacheKey && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.cacheKey!) }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                        title="删除缓存"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <a
                      href={img.dataUrl}
                      download={`image-${img.id.slice(-20)}.png`}
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      title="下载"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
