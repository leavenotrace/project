'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

type DeviceLabelProps = {
  value: string
  onChange: (value: string) => void
}

// 现场每台平板设置一个机号（如「3 号机」），存本地，便于排查
export function DeviceLabel({ value, onChange }: DeviceLabelProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const save = () => {
    const v = draft.trim()
    onChange(v)
    localStorage.setItem('device_label', v)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="机号"
          className="h-10 w-24 text-center"
          autoFocus
        />
        <Button size="sm" onClick={save}>
          保存
        </Button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      className="shrink-0 rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40"
    >
      {value ? `本机：${value}` : '设置机号'}
    </button>
  )
}
