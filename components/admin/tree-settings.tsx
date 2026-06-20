'use client'

import { useRef, useState } from 'react'
import {
  updateTreeBackground,
  updateTreeName,
  type TreeConfig,
} from '@/app/actions/config'
import { clearAllSignatures } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'

export function TreeSettings({
  passcode,
  initialConfig,
}: {
  passcode: string
  initialConfig: TreeConfig
}) {
  const [treeName, setTreeName] = useState(initialConfig.treeName)
  const [background, setBackground] = useState(initialConfig.treeBackground)
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [bgMsg, setBgMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [clearing, setClearing] = useState(false)
  const [clearMsg, setClearMsg] = useState('')
  const [clearOpen, setClearOpen] = useState(false)

  async function handleClearAll() {
    setClearing(true)
    setClearMsg('')
    const res = await clearAllSignatures(passcode)
    setClearing(false)
    setClearOpen(false)
    setClearMsg(
      res.ok ? '已清空全部签名记录，大屏将在数秒内恢复空树' : '清空失败',
    )
  }

  async function saveName() {
    setSavingName(true)
    setNameMsg('')
    const res = await updateTreeName(treeName)
    setSavingName(false)
    setNameMsg(res.ok ? '已保存' : res.error || '保存失败')
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setBgMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('passcode', passcode)
      const res = await fetch('/api/admin/upload-background', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '上传失败')
      await updateTreeBackground(json.url)
      setBackground(json.url)
      setBgMsg('背景图已更新')
    } catch (err) {
      setBgMsg(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  async function resetToDefault() {
    setUploading(true)
    setBgMsg('')
    await updateTreeBackground('')
    setBackground('')
    setUploading(false)
    setBgMsg('已恢复默认背景图')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 树名称 */}
      <Card className="p-6">
        <h2 className="font-heading text-lg font-bold text-foreground">
          智慧树名称
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          显示在大屏顶部的标题
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="treeName">名称</Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="treeName"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              placeholder="例如：卓越工程师成长之树"
            />
            <Button onClick={saveName} disabled={savingName} className="shrink-0">
              {savingName ? '保存中…' : '保存名称'}
            </Button>
          </div>
          {nameMsg && (
            <p className="text-sm text-muted-foreground">{nameMsg}</p>
          )}
        </div>
      </Card>

      {/* 背景图 */}
      <Card className="p-6">
        <h2 className="font-heading text-lg font-bold text-foreground">
          智慧树背景图
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          大屏展示的树形图片，建议使用透明背景 PNG、竖向构图
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
            {background ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={background || '/placeholder.svg'}
                alt="当前背景图"
                className="h-full w-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/graduation-tree.png"
                alt="默认背景图"
                className="h-full w-full object-contain"
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUpload(f)
                e.target.value = ''
              }}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-fit"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? '上传中…' : '上传新背景图'}
            </Button>
            <Button
              variant="outline"
              onClick={resetToDefault}
              disabled={uploading}
              className="w-fit"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              恢复默认背景图
            </Button>
            {bgMsg && <p className="text-sm text-muted-foreground">{bgMsg}</p>}
            <p className="max-w-xs text-xs text-muted-foreground">
              {background
                ? '当前使用：自定义背景图'
                : '当前使用：系统默认背景图'}
            </p>
          </div>
        </div>
      </Card>

      {/* 危险操作区 */}
      <Card className="border-destructive/40 p-6">
        <h2 className="font-heading text-lg font-bold text-destructive">
          清空签名记录
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          删除全部已签名记录并将所有学生的已签次数归零，大屏会恢复为空树。常用于测试结束或典礼正式开始前重置。此操作不可撤销，学生名单不受影响。
        </p>
        <Button
          variant="destructive"
          className="w-fit"
          onClick={() => setClearOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          清空全部签名记录
        </Button>
        <Dialog open={clearOpen} onOpenChange={setClearOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认清空全部签名记录？</DialogTitle>
              <DialogDescription>
                将删除所有签名并把每位学生的已签次数重置为 0，大屏上的所有树叶会消失。学生名单本身不会被删除。此操作无法撤销。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setClearOpen(false)}
                disabled={clearing}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                disabled={clearing}
              >
                {clearing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {clearing ? '清空中…' : '确认清空'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {clearMsg && (
          <p className="mt-3 text-sm text-muted-foreground">{clearMsg}</p>
        )}
      </Card>
    </div>
  )
}
