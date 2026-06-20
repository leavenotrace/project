'use client'

import {
  searchStudents,
  submitSignature,
  type SearchResult,
} from '@/app/actions/signing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useRef, useState } from 'react'
import { DeviceLabel } from './device-label'
import { SignaturePad } from './signature-pad'

type View = 'search' | 'sign' | 'success'

export function SigningApp() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [view, setView] = useState<View>('search')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [device, setDevice] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDevice(localStorage.getItem('device_label') ?? '')
  }, [])

  // 搜索防抖
  useEffect(() => {
    if (view !== 'search') return
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const rows = await searchStudents(q)
        setResults(rows)
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query, view])

  const pick = (s: SearchResult) => {
    setSelected(s)
    setError(null)
    setView('sign')
  }

  const handleSave = async (dataUrl: string) => {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    const res = await submitSignature({
      studentId: selected.id,
      signatureImage: dataUrl,
      deviceLabel: device || undefined,
    })
    setSubmitting(false)
    if (res.ok) {
      setView('success')
      setTimeout(() => resetToSearch(), 2600)
    } else {
      setError(res.error)
    }
  }

  const resetToSearch = () => {
    setSelected(null)
    setQuery('')
    setResults([])
    setError(null)
    setView('search')
    inputRef.current?.focus()
  }

  return (
    <main className="mx-auto flex h-dvh max-w-3xl flex-col px-5 py-6">
      <header className="flex items-center justify-between gap-3 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">
            毕业签名树
          </h1>
          <p className="text-sm text-muted-foreground">
            搜索学号后四位或姓名，签名放飞你的树叶
          </p>
        </div>
        <DeviceLabel value={device} onChange={setDevice} />
      </header>

      {view === 'search' && (
        <section className="flex flex-1 flex-col gap-4">
          <div className="relative">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputMode="text"
              placeholder="输入学号后四位 / 姓名"
              className="h-16 rounded-2xl px-5 text-xl"
              autoFocus
            />
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {searching && (
              <p className="px-1 text-sm text-muted-foreground">搜索中…</p>
            )}
            {!searching && query.trim() && results.length === 0 && (
              <p className="px-1 text-sm text-muted-foreground">
                未找到匹配的同学，请确认学号或姓名
              </p>
            )}
            {results.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pick(s)}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xl font-bold text-foreground">
                      {s.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {s.gender}
                    </span>
                    {s.signedCount > 0 && (
                      <Badge variant="secondary" className="text-primary">
                        已签 {s.signedCount} 次
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {s.college} · {s.studentNo}
                  </p>
                  {s.studyPeriod && (
                    <p className="truncate text-xs text-muted-foreground/80">
                      在校时间：{s.studyPeriod}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  去签名
                </span>
              </button>
            ))}
          </div>

          <a
            href="/screen"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 self-center text-xs text-muted-foreground/70 underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            打开大屏展示页
          </a>
        </section>
      )}

      {view === 'sign' && selected && (
        <section className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
            <div>
              <p className="font-heading text-xl font-bold text-foreground">
                {selected.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selected.college} · {selected.studentNo}
                {selected.studyPeriod ? ` · 在校 ${selected.studyPeriod}` : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={resetToSearch}
              disabled={submitting}
            >
              返回
            </Button>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="min-h-0 flex-1">
            <SignaturePad onSave={handleSave} disabled={submitting} />
          </div>
        </section>
      )}

      {view === 'success' && selected && (
        <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <LeafMark />
          <div>
            <p className="font-heading text-3xl font-bold text-primary">
              签名成功！
            </p>
            <p className="mt-2 text-lg text-foreground">
              {selected.name} 的树叶正在飞向毕业之树
            </p>
          </div>
          <Button size="lg" onClick={resetToSearch} className="h-14 px-10 text-lg">
            下一位
          </Button>
        </section>
      )}
    </main>
  )
}

function LeafMark() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
      <svg
        viewBox="0 0 24 24"
        className="h-16 w-16 text-primary"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
      </svg>
    </div>
  )
}
