import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { pool?: Pool }

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // 让连接保活，降低被 Neon 因空闲而中断的概率
    keepAlive: true,
    // 空闲连接在 Neon 关闭它之前先主动回收，避免取到陈旧连接
    idleTimeoutMillis: 10_000,
    // 建立连接的超时时间
    connectionTimeoutMillis: 10_000,
    max: 10,
  })

  // 关键：监听池级错误。空闲连接被服务端关闭时 node-postgres 会发出 error 事件，
  // 没有监听器的话该错误会被直接抛出，可能拖垮进程或冒泡为未捕获错误。
  pool.on('error', (err) => {
    console.error('[v0] pg pool error (idle client):', err.message)
  })

  return pool
}

export const pool = globalForDb.pool ?? createPool()

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export const db = drizzle(pool, { schema })
