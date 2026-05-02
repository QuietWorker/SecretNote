"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react"

export type ToastType = "success" | "error" | "warning"

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 显示动画
    setIsVisible(true)

    // 自动关闭
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // 等待淡出动画完成
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  }

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
  }

  const textColors = {
    success: "text-green-900",
    error: "text-red-900",
    warning: "text-yellow-900",
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-sm border shadow-sm transition-all duration-300 ${
        bgColors[type]
      } ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
    >
      {icons[type]}
      <span className={`text-sm font-medium ${textColors[type]}`}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="关闭通知"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
