'use client'

import { useState } from 'react'
import { verifyPasscode } from '@/app/actions/admin'
import type { TreeConfig } from '@/app/actions/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TreeSettings } from './tree-settings'
import { StudentManager } from './student-manager'
import { Lock, TreePine } from 'lucide-react'

export function AdminPanel({ initialConfig }: { initialConfig: TreeConfig }) {
  const [passcode, setPasscode] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await verifyPasscode(passcode)
    setLoading(false)
    if (res.ok) {
      setAuthed(true)
    } else {
      setError('口令错误，请重试')
    }
  }

  if (!authed) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              管理后台
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              请输入管理口令以继续
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="passcode">管理口令</Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="请输入口令"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? '验证中…' : '进入'}
          </Button>
        </form>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <TreePine className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            毕业签名树 · 管理后台
          </h1>
          <p className="text-sm text-muted-foreground">
            管理智慧树展示与毕业生信息
          </p>
        </div>
      </header>

      <Tabs defaultValue="tree">
        <TabsList className="mb-6">
          <TabsTrigger value="tree">智慧树设置</TabsTrigger>
          <TabsTrigger value="students">学生管理</TabsTrigger>
        </TabsList>
        <TabsContent value="tree">
          <TreeSettings passcode={passcode} initialConfig={initialConfig} />
        </TabsContent>
        <TabsContent value="students">
          <StudentManager passcode={passcode} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
