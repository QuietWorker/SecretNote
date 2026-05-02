"use client"

import { Editor } from "@tiptap/react"
import { Bold, Italic, Heading1, Heading2, List, Image as ImageIcon } from "lucide-react"
import { useRef } from "react"

interface EditorToolbarProps {
  editor: Editor | null
  onImageUpload: (file: File) => Promise<void>
}

export default function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) {
    return null
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await onImageUpload(file)
      // 清空 input，允许重复选择同一文件
      e.target.value = ""
    } catch (error) {
      console.error("图片上传失败:", error)
    }
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-secondary/50 rounded-t-sm">
      {/* 粗体 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-sm hover:bg-secondary transition-colors ${editor.isActive("bold") ? "bg-secondary" : ""}`}
        title="粗体"
      >
        <Bold className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* 斜体 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-sm hover:bg-secondary transition-colors ${editor.isActive("italic") ? "bg-secondary" : ""}`}
        title="斜体"
      >
        <Italic className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* 标题1 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-sm hover:bg-secondary transition-colors ${
          editor.isActive("heading", { level: 1 }) ? "bg-secondary" : ""
        }`}
        title="标题1"
      >
        <Heading1 className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* 标题2 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-sm hover:bg-secondary transition-colors ${
          editor.isActive("heading", { level: 2 }) ? "bg-secondary" : ""
        }`}
        title="标题2"
      >
        <Heading2 className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* 无序列表 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-sm hover:bg-secondary transition-colors ${
          editor.isActive("bulletList") ? "bg-secondary" : ""
        }`}
        title="无序列表"
      >
        <List className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* 分隔线 */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* 图片上传 */}
      <button
        type="button"
        onClick={handleImageClick}
        className="p-2 rounded-sm hover:bg-secondary transition-colors"
        title="插入图片"
      >
        <ImageIcon className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="选择图片文件"
      />
    </div>
  )
}
