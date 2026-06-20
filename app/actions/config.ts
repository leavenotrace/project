'use server'

import { db } from '@/lib/db'
import { appConfig } from '@/lib/db/schema'
import { inArray, sql } from 'drizzle-orm'

export type TreeConfig = {
  treeName: string
  treeBackground: string
}

const DEFAULTS: TreeConfig = {
  treeName: '卓越工程师成长之树',
  treeBackground: '',
}

// 读取大屏/平板展示用的配置
export async function getTreeConfig(): Promise<TreeConfig> {
  const rows = await db
    .select()
    .from(appConfig)
    .where(inArray(appConfig.key, ['tree_name', 'tree_background']))

  const map = new Map(rows.map((r) => [r.key, r.value ?? '']))
  return {
    treeName: map.get('tree_name') || DEFAULTS.treeName,
    treeBackground: map.get('tree_background') || DEFAULTS.treeBackground,
  }
}

// 写入单个配置项（upsert）
async function setConfig(key: string, value: string) {
  await db
    .insert(appConfig)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: { value, updatedAt: sql`now()` },
    })
}

export async function updateTreeName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false as const, error: '名称不能为空' }
  await setConfig('tree_name', trimmed)
  return { ok: true as const }
}

export async function updateTreeBackground(url: string) {
  await setConfig('tree_background', url.trim())
  return { ok: true as const }
}
