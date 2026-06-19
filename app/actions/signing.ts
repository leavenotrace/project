'use server'

import { db } from '@/lib/db'
import { signatures, students } from '@/lib/db/schema'
import { desc, eq, ilike, or, sql } from 'drizzle-orm'

export type SearchResult = {
  id: number
  name: string
  college: string
  studentNo: string
  gender: string | null
  signedCount: number
}

// 根据学号后四位（或姓名）搜索学生
export async function searchStudents(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      college: students.college,
      studentNo: students.studentNo,
      gender: students.gender,
      signedCount: students.signedCount,
    })
    .from(students)
    .where(
      or(
        ilike(students.studentNo, `%${q}`),
        ilike(students.name, `%${q}%`),
      ),
    )
    .orderBy(students.studentNo)
    .limit(20)

  return rows
}

export type SubmitResult =
  | { ok: true; signatureId: number; signedCount: number }
  | { ok: false; error: string }

// 提交一条签名：写入签名记录 + 累加已签次数
export async function submitSignature(input: {
  studentId: number
  signatureImage: string
  deviceLabel?: string
}): Promise<SubmitResult> {
  const { studentId, signatureImage, deviceLabel } = input

  if (!signatureImage || signatureImage.length < 100) {
    return { ok: false, error: '签名内容为空，请重新签名' }
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1)

  if (!student) {
    return { ok: false, error: '未找到该学生' }
  }

  const [updated] = await db
    .update(students)
    .set({ signedCount: sql`${students.signedCount} + 1` })
    .where(eq(students.id, studentId))
    .returning({ signedCount: students.signedCount })

  const [row] = await db
    .insert(signatures)
    .values({
      studentId: student.id,
      name: student.name,
      college: student.college,
      studentNo: student.studentNo,
      signatureImage,
      deviceLabel: deviceLabel ?? null,
    })
    .returning({ id: signatures.id })

  return {
    ok: true,
    signatureId: row.id,
    signedCount: updated.signedCount,
  }
}

// 大屏统计：已签人数 / 总人数 / 签名总次数
export async function getStats() {
  const [totals] = await db
    .select({
      totalStudents: sql<number>`count(*)::int`,
      signedStudents: sql<number>`count(*) filter (where ${students.signedCount} > 0)::int`,
    })
    .from(students)

  const [sig] = await db
    .select({ totalSignatures: sql<number>`count(*)::int` })
    .from(signatures)

  return {
    totalStudents: totals?.totalStudents ?? 0,
    signedStudents: totals?.signedStudents ?? 0,
    totalSignatures: sig?.totalSignatures ?? 0,
  }
}

// 最近签名（用于大屏初始化）
export async function getRecentSignatures(limit = 200) {
  return db
    .select({
      id: signatures.id,
      name: signatures.name,
      college: signatures.college,
      signatureImage: signatures.signatureImage,
      createdAt: signatures.createdAt,
    })
    .from(signatures)
    .orderBy(desc(signatures.id))
    .limit(limit)
}
