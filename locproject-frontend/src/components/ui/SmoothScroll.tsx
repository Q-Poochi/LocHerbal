'use client'
import Lenis from 'lenis'
import { useEffect } from 'react'

/**
 * Cuộn mượt (Lenis) cho toàn bộ storefront — được bọc 1 lần duy nhất ở
 * app/(storefront)/layout.tsx.
 *
 * Lưu ý:
 * - Nếu người dùng bật "giảm chuyển động" trong hệ điều hành thì bỏ qua,
 *   giữ cuộn native (a11y).
 * - Hủy cả requestAnimationFrame khi unmount để không rò rỉ vòng lặp.
 * - KHÔNG bọc thêm ở layout con: 2 instance Lenis trên cùng window sẽ
 *   tranh nhau điều khiển scroll (giật/lag).
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}