import { useEffect, useCallback } from "react"

interface ShortcutConfig {
  key: string
  modifiers?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  }
  callback: (e: KeyboardEvent) => void
  enabled?: boolean
  preventDefault?: boolean
}

/**
 * 键盘快捷键 Hook
 * 支持跨平台（Mac/Windows/Linux）
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (!shortcut.enabled && shortcut.enabled !== undefined) {
          continue
        }

        const { key, modifiers = {}, callback, preventDefault = true } = shortcut
        const { ctrl = false, shift = false, alt = false, meta = false } = modifiers

        // 检测修饰键（Mac 使用 meta/Cmd，Windows/Linux 使用 ctrl）
        const isCtrlOrMeta = ctrl || meta ? e.ctrlKey || e.metaKey : !(e.ctrlKey || e.metaKey)
        const isShift = shift ? e.shiftKey : !e.shiftKey
        const isAlt = alt ? e.altKey : !e.altKey

        // 检查按键匹配
        if (e.key.toLowerCase() === key.toLowerCase() && isCtrlOrMeta && isShift && isAlt) {
          if (preventDefault) {
            e.preventDefault()
          }
          callback(e)
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * 简化版：单个快捷键
 */
export function useKeyboardShortcut(config: ShortcutConfig) {
  useKeyboardShortcuts([config])
}
