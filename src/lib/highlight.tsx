import React from "react"

/**
 * 高亮文本中的搜索关键词
 * @param text 原始文本
 * @param query 搜索关键词
 * @returns React 节点数组
 */
export function highlightText(text: string, query: string): React.ReactNode[] {
  if (!query.trim()) {
    return [text]
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      )
    }
    return part
  })
}
