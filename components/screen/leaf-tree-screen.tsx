'use client'

import useSWR from 'swr'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TreeConfig } from '@/app/actions/config'

type LeafData = {
  id: number
  name: string
  college: string | null
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

// 树冠区域内随机生成落点（椭圆范围）
function randomCanopyPoint() {
  const angle = Math.random() * Math.PI * 2
  const r = Math.sqrt(Math.random())
  const x = 50 + Math.cos(angle) * r * 32
  const y = 34 + Math.sin(angle) * r * 24
  return { x, y }
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
    setStats(data.stats)
    if (data.config) setConfig(data.config)
    if (data.leaves.length === 0) return

    const maxId = data.leaves[data.leaves.length - 1].id
    if (maxId > sinceRef.current) sinceRef.current = maxId

    const isInitial = leaves.length === 0
    const placed: PlacedLeaf[] = data.leaves.map((l, i) => {
      const pt = randomCanopyPoint()
      return {
        ...l,
        targetX: pt.x,
        targetY: pt.y,
        rotation: Math.random() * 60 - 30,
        hue: LEAF_HUES[i % LEAF_HUES.length],
        flying: !isInitial,
      }
    })

    setLeaves((prev) => [...prev, ...placed])

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
          <h1 className="font-heading text-4xl font-black text-primary md:text-5xl">
            {config.treeName}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            每一片树叶，都是一段青春的落款
          </p>
        </div>
        <div className="flex gap-4">
          <StatCard label="已签名" value={stats.signedStudents} accent />
          <StatCard label="毕业生" value={stats.totalStudents} />
          <StatCard label="签名总数" value={stats.totalSignatures} />
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div
      className={`min-w-24 rounded-2xl px-5 py-3 text-center ${
        accent
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-foreground'
      }`}
    >
      <div className="font-heading text-3xl font-black tabular-nums">
        {value}
      </div>
      <div
        className={`text-xs ${accent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
      >
        {label}
      </div>
    </div>
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
          className="h-12 w-10 drop-shadow"
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
        <div className="-mt-1 max-w-16 rounded bg-card/85 px-1.5 py-0.5">
          <img
            src={leaf.signatureImage || '/placeholder.svg'}
            alt={`${leaf.name}的签名`}
            className="h-5 w-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}
