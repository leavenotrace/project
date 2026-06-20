'use server'

import { db } from '@/lib/db'
import { signatures, students } from '@/lib/db/schema'
import { asc, eq, sql } from 'drizzle-orm'

// 口令校验：默认口令 admin888，可用环境变量 ADMIN_PASSCODE 覆盖
function getPasscode() {
  return process.env.ADMIN_PASSCODE || 'admin888'
}

export async function verifyPasscode(passcode: string) {
  return { ok: passcode === getPasscode() }
}

async function assertAuthed(passcode: string) {
  if (passcode !== getPasscode()) {
    throw new Error('口令错误，无权操作')
  }
}

export type AdminStudent = {
  id: number
  name: string
  college: string
  studentNo: string
  gender: string | null
  studyPeriod: string | null
  signedCount: number
}

export async function listStudents(passcode: string): Promise<AdminStudent[]> {
  await assertAuthed(passcode)
  return db
    .select({
      id: students.id,
      name: students.name,
      college: students.college,
      studentNo: students.studentNo,
      gender: students.gender,
      studyPeriod: students.studyPeriod,
      signedCount: students.signedCount,
    })
    .from(students)
    .orderBy(asc(students.studentNo))
}

export type StudentInput = {
  name: string
  college: string
  studentNo: string
  gender: string | null
  studyPeriod: string | null
}

export async function createStudent(passcode: string, input: StudentInput) {
  await assertAuthed(passcode)
  const name = input.name.trim()
  const studentNo = input.studentNo.trim()
  if (!name || !input.college.trim() || !studentNo) {
    return { ok: false as const, error: '姓名、学院、学号为必填项' }
  }

  const [exists] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.studentNo, studentNo))
    .limit(1)
  if (exists) {
    return { ok: false as const, error: '该学号已存在' }
  }

  const [row] = await db
    .insert(students)
    .values({
      name,
      college: input.college.trim(),
      studentNo,
      gender: input.gender?.trim() || null,
      studyPeriod: input.studyPeriod?.trim() || null,
    })
    .returning({ id: students.id })

  return { ok: true as const, id: row.id }
}

export async function updateStudent(
  passcode: string,
  id: number,
  input: StudentInput,
) {
  await assertAuthed(passcode)
  const name = input.name.trim()
  const studentNo = input.studentNo.trim()
  if (!name || !input.college.trim() || !studentNo) {
    return { ok: false as const, error: '姓名、学院、学号为必填项' }
  }

  // 学号唯一性校验（排除自身）
  const [conflict] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.studentNo, studentNo))
    .limit(1)
  if (conflict && conflict.id !== id) {
    return { ok: false as const, error: '该学号已被其他学生占用' }
  }

  await db
    .update(students)
    .set({
      name,
      college: input.college.trim(),
      studentNo,
      gender: input.gender?.trim() || null,
      studyPeriod: input.studyPeriod?.trim() || null,
    })
    .where(eq(students.id, id))

  return { ok: true as const }
}

export async function deleteStudent(passcode: string, id: number) {
  await assertAuthed(passcode)
  // 一并删除该学生已有的签名记录，避免大屏残留
  await db.delete(signatures).where(eq(signatures.studentId, id))
  await db.delete(students).where(eq(students.id, id))
  return { ok: true as const }
}

// 重置某学生的已签次数（可选维护用）
export async function resetStudentSign(passcode: string, id: number) {
  await assertAuthed(passcode)
  await db.delete(signatures).where(eq(signatures.studentId, id))
  await db
    .update(students)
    .set({ signedCount: sql`0` })
    .where(eq(students.id, id))
  return { ok: true as const }
}
