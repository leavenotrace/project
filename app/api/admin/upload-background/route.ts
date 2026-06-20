import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'

const PASSCODE = process.env.ADMIN_PASSCODE || 'admin888'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const passcode = formData.get('passcode') as string | null
    const file = formData.get('file') as File | null

    if (passcode !== PASSCODE) {
      return NextResponse.json({ error: '口令错误，无权上传' }, { status: 401 })
    }
    if (!file) {
      return NextResponse.json({ error: '未选择图片' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '请上传图片文件' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'png'
    const blob = await put(`tree-background-${Date.now()}.${ext}`, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('[v0] background upload error:', error)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
