import { getTreeConfig } from '@/app/actions/config'
import { db } from '@/lib/db'
import { signatures, students } from '@/lib/db/schema'
import { asc, gt, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 大屏轮询：返回 id 大于 since 的新签名 + 实时统计
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const since = Number(searchParams.get('since') ?? '0') || 0

  const newLeaves = await db
    .select({
      id: signatures.id,
      name: signatures.name,
      college: signatures.college,
      signatureImage: signatures.signatureImage,
    })
    .from(signatures)
    .where(gt(signatures.id, since))
    .orderBy(asc(signatures.id))
    .limit(100)

  const [totals] = await db
    .select({
      totalStudents: sql<number>`count(*)::int`,
      signedStudents: sql<number>`count(*) filter (where ${students.signedCount} > 0)::int`,
    })
    .from(students)

  const [sig] = await db
    .select({ totalSignatures: sql<number>`count(*)::int` })
    .from(signatures)

  const config = await getTreeConfig()

  return NextResponse.json({
    leaves: newLeaves,
    stats: {
      totalStudents: totals?.totalStudents ?? 0,
      signedStudents: totals?.signedStudents ?? 0,
      totalSignatures: sig?.totalSignatures ?? 0,
    },
    config,
  })
}
