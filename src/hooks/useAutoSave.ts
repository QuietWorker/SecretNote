"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface AutoSaveOptions {
  debounceMs?: number // 防抖延迟时间（毫秒）
  draftKey: string // localStorage 中的草稿键名
  onSaveSuccess?: () => void // 保存成功回调
  onSaveError?: (error: Error) => void // 保存失败回调
}

interface SaveStatus {
  status: "idle" | "saving" | "saved" | "error"
  lastSaved?: Date
  error?: string
}

export function useAutoSave<T extends Record<string, any>>(
  formData: T,
  saveCallback: (data: T) => Promise<void>,
  options: AutoSaveOptions
) {
  const { debounceMs = 2000, draftKey, onSaveSuccess, onSaveError } = options

  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: "idle" })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousDataRef = useRef<T | null>(null)
  const isSubmittingRef = useRef(false)

  // 从 localStorage 加载草稿
  const loadDraft = useCallback((): T | null => {
    try {
      const draft = localStorage.getItem(draftKey)
      if (!draft) return null

      const parsed = JSON.parse(draft)

      // 检查草稿是否在 24 小时内
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      if (parsed.timestamp && new Date(parsed.timestamp) < twentyFourHoursAgo) {
        localStorage.removeItem(draftKey)
        return null
      }

      return parsed.data as T
    } catch (error) {
      console.error("加载草稿失败:", error)
      return null
    }
  }, [draftKey])

  // 保存草稿到 localStorage
  const saveDraftToStorage = useCallback(
    (data: T) => {
      try {
        const draft = {
          data,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem(draftKey, JSON.stringify(draft))
      } catch (error) {
        console.error("保存草稿失败:", error)
      }
    },
    [draftKey]
  )

  // 清除草稿
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.error("清除草稿失败:", error)
    }
  }, [draftKey])

  // 执行保存
  const performSave = useCallback(
    async (data: T) => {
      // 如果正在提交表单，不执行自动保存
      if (isSubmittingRef.current) {
        return
      }

      setSaveStatus({ status: "saving" })

      try {
        await saveCallback(data)
        setSaveStatus({
          status: "saved",
          lastSaved: new Date(),
        })

        // 保存到 localStorage 作为备份
        saveDraftToStorage(data)

        // 1 秒后重置状态
        setTimeout(() => {
          setSaveStatus((prev: SaveStatus) => ({
            ...prev,
            status: "idle",
          }))
        }, 1000)

        onSaveSuccess?.()
      } catch (error) {
        const err = error instanceof Error ? error : new Error("保存失败")
        setSaveStatus({
          status: "error",
          error: err.message,
        })
        onSaveError?.(err)

        // 3 秒后重置错误状态
        setTimeout(() => {
          setSaveStatus((prev: SaveStatus) => ({
            ...prev,
            status: "idle",
            error: undefined,
          }))
        }, 3000)
      }
    },
    [saveCallback, saveDraftToStorage, onSaveSuccess, onSaveError]
  )

  // 监听数据变化，触发自动保存
  useEffect(() => {
    // 跳过首次渲染
    if (previousDataRef.current === null) {
      previousDataRef.current = formData
      return
    }

    // 检查数据是否真的变化了
    const hasChanged = JSON.stringify(previousDataRef.current) !== JSON.stringify(formData)
    if (!hasChanged) {
      return
    }

    previousDataRef.current = formData

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的防抖定时器
    timeoutRef.current = setTimeout(() => {
      performSave(formData)
    }, debounceMs)

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formData, debounceMs, performSave])

  // 页面关闭前强制保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 如果有未保存的更改，尝试同步保存
      if (saveStatus.status === "saving") {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [saveStatus.status])

  // 网络恢复后重新保存
  useEffect(() => {
    const handleOnline = () => {
      if (saveStatus.status === "error") {
        performSave(formData)
      }
    }

    window.addEventListener("online", handleOnline)
    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [formData, saveStatus.status, performSave])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    saveStatus,
    loadDraft,
    clearDraft,
    setSubmitting: (submitting: boolean) => {
      isSubmittingRef.current = submitting
    },
  }
}
