import { getTreeConfig } from '@/app/actions/config'
import { db } from '@/lib/db'
import { signatures, students } from '@/lib/db/schema'
import { asc, eq, gt, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 偶发的陈旧连接（Neon 关闭空闲连接）会让单次查询抛错，自动用新连接重试一次
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.error('[v0] leaves query failed, retrying once:', err)
    return await fn()
  }
}

// 大屏轮询：返回 id 大于 since 的新签名 + 实时统计
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const since = Number(searchParams.get('since') ?? '0') || 0

  try {
    const [newLeaves, totalsRows, sigRows, config] = await withRetry(() =>
      Promise.all([
        db
          .select({
            id: signatures.id,
            name: signatures.name,
            college: signatures.college,
            gender: students.gender,
            signatureImage: signatures.signatureImage,
          })
          .from(signatures)
          .leftJoin(students, eq(signatures.studentId, students.id))
          .where(gt(signatures.id, since))
          .orderBy(asc(signatures.id))
          .limit(100),
        db
          .select({
            totalStudents: sql<number>`count(*)::int`,
            signedStudents: sql<number>`count(*) filter (where ${students.signedCount} > 0)::int`,
          })
          .from(students),
        db
          .select({ totalSignatures: sql<number>`count(*)::int` })
          .from(signatures),
        getTreeConfig(),
      ]),
    )

    const totals = totalsRows[0]
    const sig = sigRows[0]

    return NextResponse.json({
      leaves: newLeaves,
      stats: {
        totalStudents: totals?.totalStudents ?? 0,
        signedStudents: totals?.signedStudents ?? 0,
        totalSignatures: sig?.totalSignatures ?? 0,
      },
      config,
    })
  } catch (err) {
    // 即便重试后仍失败，也返回空增量而非 500，让大屏维持当前画面、下次轮询再恢复
    console.error('[v0] leaves query failed after retry:', err)
    return NextResponse.json(
      { leaves: [], stats: null, config: null },
      { status: 200 },
    )
  }
}
