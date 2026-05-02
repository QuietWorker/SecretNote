"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen && !isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onCancel}
      />

      {/* 对话框 */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-sm bg-red-50">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl font-medium">{title}</CardTitle>
              </div>
              <button
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{message}</p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="btn-minimal"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-red-600 text-white hover:bg-red-700 btn-minimal"
            >
              {confirmText}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
