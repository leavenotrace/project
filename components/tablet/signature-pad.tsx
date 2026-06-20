'use client'

import { Button } from '@/components/ui/button'
import { useCallback, useEffect, useRef, useState } from 'react'

type Point = { x: number; y: number }

type SignaturePadProps = {
  onSave: (dataUrl: string) => void
  disabled?: boolean
}

export function SignaturePad({ onSave, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<Point | null>(null)
  const [hasInk, setHasInk] = useState(false)

  // 适配高分屏 + 容器尺寸
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ratio = window.devicePixelRatio || 1
    const { width, height } = parent.getBoundingClientRect()
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 28
    ctx.strokeStyle = '#1f3d2b'
  }, [])

  useEffect(() => {
    setupCanvas()
    const onResize = () => {
      // 调整尺寸会清空画布，签名时不缩放窗口即可
      setupCanvas()
      setHasInk(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setupCanvas])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    drawing.current = true
    lastPoint.current = getPoint(e)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !lastPoint.current) return
    const p = getPoint(e)
    // 速度感应：移动慢→线粗，移动快→线细，形成自然的毛笔笔锋
    const dist = Math.hypot(p.x - lastPoint.current.x, p.y - lastPoint.current.y)
    const width = Math.max(18, 36 - dist * 0.5)
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPoint.current = p
    if (!hasInk) setHasInk(true)
  }

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false
    lastPoint.current = null
    canvasRef.current?.releasePointerCapture?.(e.pointerId)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
  }

  // 裁剪出笔迹区域并输出透明背景 PNG
  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasInk) return
    onSave(canvas.toDataURL('image/png'))
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative flex-1 overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-card">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="absolute inset-0 touch-none"
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="font-heading text-2xl text-muted-foreground/60">
              请在此处签名
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={clear}
          disabled={disabled}
          className="h-14 flex-1 text-lg"
        >
          重写
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={disabled || !hasInk}
          className="h-14 flex-[2] text-lg"
        >
          确认签名，放飞树叶
        </Button>
      </div>
    </div>
  )
}
