'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createStudent,
  deleteStudent,
  listStudents,
  updateStudent,
  type AdminStudent,
  type StudentInput,
} from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'

const EMPTY: StudentInput = {
  name: '',
  college: '',
  studentNo: '',
  gender: '',
  studyPeriod: '',
}

export function StudentManager({ passcode }: { passcode: string }) {
  const [students, setStudents] = useState<AdminStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  // 编辑/新增弹窗
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<StudentInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<AdminStudent | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function refresh() {
    setLoading(true)
    const rows = await listStudents(passcode)
    setStudents(rows)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentNo.toLowerCase().includes(q) ||
        s.college.toLowerCase().includes(q),
    )
  }, [students, query])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY)
    setFormError('')
    setOpen(true)
  }

  function openEdit(s: AdminStudent) {
    setEditingId(s.id)
    setForm({
      name: s.name,
      college: s.college,
      studentNo: s.studentNo,
      gender: s.gender ?? '',
      studyPeriod: s.studyPeriod ?? '',
    })
    setFormError('')
    setOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setFormError('')
    const res =
      editingId == null
        ? await createStudent(passcode, form)
        : await updateStudent(passcode, editingId, form)
    setSaving(false)
    if (res.ok) {
      setOpen(false)
      await refresh()
    } else {
      setFormError(res.error || '保存失败')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteStudent(passcode, deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    await refresh()
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            毕业生信息
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {students.length} 名学生
          </p>
        </div>
        <Button onClick={openCreate} className="w-fit">
          <Plus className="mr-2 h-4 w-4" />
          新增学生
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索姓名、学号或学院"
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>学院</TableHead>
              <TableHead>学号</TableHead>
              <TableHead className="hidden md:table-cell">性别</TableHead>
              <TableHead className="hidden md:table-cell">在校时间</TableHead>
              <TableHead className="text-center">已签</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  加载中…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  没有匹配的学生
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.college}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {s.studentNo}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {s.gender || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {s.studyPeriod || '—'}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {s.signedCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                        aria-label={`编辑 ${s.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(s)}
                        aria-label={`删除 ${s.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 新增 / 编辑弹窗 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId == null ? '新增学生' : '编辑学生'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Field label="姓名 *">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </Field>
            <Field label="学院 *">
              <Input
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                placeholder="请输入学院"
              />
            </Field>
            <Field label="学号 *">
              <Input
                value={form.studentNo}
                onChange={(e) =>
                  setForm({ ...form, studentNo: e.target.value })
                }
                placeholder="请输入完整学号"
                className="font-mono"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="性别">
                <Input
                  value={form.gender ?? ''}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  placeholder="男 / 女"
                />
              </Field>
              <Field label="在校时间">
                <Input
                  value={form.studyPeriod ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, studyPeriod: e.target.value })
                  }
                  placeholder="2023.09-2026.06"
                />
              </Field>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-sm text-muted-foreground">
            确定要删除学生{' '}
            <span className="font-medium text-foreground">
              {deleteTarget?.name}
            </span>{' '}
            （{deleteTarget?.studentNo}）吗？该学生已有的签名记录也会一并删除，此操作不可撤销。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '删除中…' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
