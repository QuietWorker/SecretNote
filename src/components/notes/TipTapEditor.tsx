"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { useEffect, useRef } from "react"

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  onEditorReady?: (editor: any) => void
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = "开始输入内容...",
  onEditorReady,
}: TipTapEditorProps) {
  const hasNotifiedRef = useRef(false)

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Image.configure({
          inline: false,
          allowBase64: false,
        }),
        Placeholder.configure({
          placeholder,
        }),
      ],
      content,
      immediatelyRender: false, // 避免 SSR hydration 不匹配
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        onChange(html)
      },
      editorProps: {
        attributes: {
          class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] px-4 py-3",
        },
      },
    },
    []
  )

  // 当外部 content 变化时，更新编辑器内容
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // 通知父组件编辑器已就绪（只通知一次）
  useEffect(() => {
    if (editor && onEditorReady && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      // 使用 requestAnimationFrame 确保在渲染完成后调用
      requestAnimationFrame(() => {
        onEditorReady(editor)
      })
    }
  }, [editor, onEditorReady])

  // 提供插入图片的方法
  const insertImage = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <EditorContent editor={editor} />
    </div>
  )
}

// 导出类型以便父组件使用
export type TipTapEditorRef = {
  insertImage: (url: string) => void
} | null
