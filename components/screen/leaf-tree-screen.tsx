'use client'

import useSWR from 'swr'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TreeConfig } from '@/app/actions/config'

type LeafData = {
  id: number
  name: string
  college: string | null
  gender: string | null
  signatureImage: string
}

type ApiResponse = {
  leaves: LeafData[]
  stats: {
    totalStudents: number
    signedStudents: number
    totalSignatures: number
  }
  config?: TreeConfig
}

type PlacedLeaf = LeafData & {
  // 树冠上的落点（百分比）
  targetX: number
  targetY: number
  rotation: number
  hue: number
  flying: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// 树冠落点参数（百分比坐标）—— 覆盖整个树冠椭圆
const CANOPY = { cx: 50, cy: 34, rx: 40, ry: 31 }
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)) // ≈137.5°

// 简单确定性哈希：同一 id 永远得到同一抖动
function hash01(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// 基数反演（Van der Corput，base 2）：低差异序列，少量点也能均匀铺满
function radicalInverse(i: number) {
  let bits = i + 1
  let r = 0
  let f = 0.5
  while (bits > 0) {
    r += (bits & 1) * f
    bits >>= 1
    f /= 2
  }
  return r
}

// 落点：半径用低差异序列、角度用黄金角，使任意数量的树叶都均匀散布整个树冠
function canopyPoint(index: number, id: number) {
  const r = Math.sqrt(radicalInverse(index)) // 全程铺满，而非中心向外堆
  const angle = index * GOLDEN_ANGLE
  const jx = (hash01(id) - 0.5) * 2.6
  const jy = (hash01(id + 7) - 0.5) * 2.6
  return {
    x: CANOPY.cx + Math.cos(angle) * r * CANOPY.rx + jx,
    y: CANOPY.cy + Math.sin(angle) * r * CANOPY.ry + jy,
    rotation: (hash01(id + 3) - 0.5) * 36,
  }
}

const LEAF_HUES = [110, 125, 95, 140, 80]

export function LeafTreeScreen({
  initialConfig,
}: {
  initialConfig: TreeConfig
}) {
  const sinceRef = useRef(0)
  const [leaves, setLeaves] = useState<PlacedLeaf[]>([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    signedStudents: 0,
    totalSignatures: 0,
  })
  const [config, setConfig] = useState<TreeConfig>(initialConfig)
  const [banner, setBanner] = useState<LeafData | null>(null)
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data } = useSWR<ApiResponse>(
    () => `/api/leaves?since=${sinceRef.current}`,
    fetcher,
    { refreshInterval: 1500 },
  )

  const showBanner = useCallback((leaf: LeafData) => {
    setBanner(leaf)
    if (bannerTimer.current) clearTimeout(bannerTimer.current)
    bannerTimer.current = setTimeout(() => setBanner(null), 3500)
  }, [])

  useEffect(() => {
    if (!data) return
    if (data.stats) setStats(data.stats)
    if (data.config) setConfig(data.config)
    if (!data.leaves || data.leaves.length === 0) return

    const maxId = data.leaves[data.leaves.length - 1].id
    if (maxId > sinceRef.current) sinceRef.current = maxId

    const isInitial = leaves.length === 0
    let placed: PlacedLeaf[] = []

    setLeaves((prev) => {
      placed = data.leaves.map((l, i) => {
        const seq = prev.length + i // 全局签名序号，决定稳定落点
        const pt = canopyPoint(seq, l.id)
        return {
          ...l,
          targetX: pt.x,
          targetY: pt.y,
          rotation: pt.rotation,
          hue: LEAF_HUES[seq % LEAF_HUES.length],
          flying: !isInitial,
        }
      })
      return [...prev, ...placed]
    })

    // 新签名：播放飞入动画 + 顶部播报最新一位
    if (!isInitial) {
      const newest = data.leaves[data.leaves.length - 1]
      showBanner(newest)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setLeaves((prev) =>
            prev.map((l) =>
              placed.find((p) => p.id === l.id) ? { ...l, flying: false } : l,
            ),
          )
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background">
      {/* 标题 */}
      <header className="absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-8">
        <div>
          <img
            src="/tree-title-calligraphy.png"
            alt={config.treeName}
            className="h-20 w-auto object-contain mix-blend-multiply md:h-28"
          />
          <p className="mt-1 text-lg text-muted-foreground">
            每一片树叶，都是一段青春的落款
          </p>
        </div>
      </header>

      {/* 树 + 树叶 */}
      <div className="absolute inset-0 flex items-end justify-center">
        <div className="relative aspect-square h-full max-h-[92vh]">
          <img
            src={config.treeBackground || '/graduation-tree.png'}
            alt="毕业之树"
            className="absolute inset-0 h-full w-full object-contain"
          />
          {leaves.map((leaf) => (
            <Leaf key={leaf.id} leaf={leaf} />
          ))}
        </div>
      </div>

      {/* 最新签名播报 */}
      {banner && (
        <div className="absolute bottom-10 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4 rounded-2xl border border-accent/40 bg-card/90 px-6 py-4 shadow-lg backdrop-blur">
            <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-secondary">
              <img
                src={banner.signatureImage || '/placeholder.svg'}
                alt={`${banner.name}的签名`}
                className="max-h-12 max-w-full object-contain"
              />
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-primary">
                {banner.name}
                {banner.gender && (
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    {banner.gender}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {banner.college} · 已签名
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function Leaf({ leaf }: { leaf: PlacedLeaf }) {
  // flying=true 时位于屏幕底部中央且透明，随后过渡到树冠落点
  const style: React.CSSProperties = leaf.flying
    ? {
        left: '50%',
        top: '108%',
        opacity: 0,
        transform: 'translate(-50%, -50%) scale(0.4) rotate(0deg)',
      }
    : {
        left: `${leaf.targetX}%`,
        top: `${leaf.targetY}%`,
        opacity: 1,
        transform: `translate(-50%, -50%) scale(1) rotate(${leaf.rotation}deg)`,
      }

  return (
    <div
      className="absolute z-10 transition-all duration-[2200ms] ease-out"
      style={style}
    >
      <div className="relative flex flex-col items-center">
        <svg
          viewBox="0 0 40 48"
          className="h-8 w-7 drop-shadow"
          aria-hidden="true"
        >
          <path
            d="M20 2 C30 10 36 22 20 46 C4 22 10 10 20 2 Z"
            fill={`oklch(0.62 0.13 ${leaf.hue})`}
            stroke={`oklch(0.42 0.1 ${leaf.hue})`}
            strokeWidth="1.2"
          />
          <path
            d="M20 6 L20 42"
            stroke={`oklch(0.42 0.1 ${leaf.hue})`}
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <div
          className="-mt-1 w-24 rounded-md border bg-card/95 px-1.5 py-1 shadow-md backdrop-blur-sm"
          style={{ borderColor: `oklch(0.62 0.13 ${leaf.hue} / 0.6)` }}
        >
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="font-heading text-xs font-bold leading-none text-primary">
              {leaf.name}
            </span>
            {leaf.gender && (
              <span className="text-[9px] leading-none text-muted-foreground">
                {leaf.gender}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-center text-[8px] leading-tight text-muted-foreground">
            {leaf.college}
          </p>
          <div className="mt-0.5 rounded-sm bg-secondary/70 px-0.5">
            <img
              src={leaf.signatureImage || '/placeholder.svg'}
              alt={`${leaf.name}的签名`}
              className="h-5 w-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
