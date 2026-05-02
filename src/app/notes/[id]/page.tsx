"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Trash2, Edit, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Note } from "@/types"
import { formatDate } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import TipTapEditor from "@/components/notes/TipTapEditor"
import EditorToolbar from "@/components/notes/EditorToolbar"
import { useAutoSave } from "@/hooks/useAutoSave"

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isEncrypted: true,
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editor, setEditor] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 使用自动保存 Hook（仅在编辑模式下）
  const { saveStatus, clearDraft, setSubmitting } = useAutoSave(
    formData,
    async data => {
      // 自动保存到服务器
      if (isEditing && note) {
        try {
          const response = await fetch(`/api/notes/${params.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            throw new Error("保存失败")
          }

          const result = await response.json()
          setNote(result.note)
        } catch (err) {
          console.error("自动保存失败:", err)
          throw err
        }
      }
    },
    {
      debounceMs: 2000,
      draftKey: `draft_note_${params.id}`,
    }
  )

  // 图片上传处理函数
  const handleImageUpload = useCallback(
    async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "图片上传失败")
        }

        const data = await response.json()
        // 插入图片到编辑器
        if (editor && data.url) {
          editor.chain().focus().setImage({ src: data.url }).run()
        }
      } catch (err) {
        console.error("图片上传错误:", err)
        setError(err instanceof Error ? err.message : "图片上传失败")
      }
    },
    [editor]
  )

  useEffect(() => {
    fetchNote()
  }, [params.id])

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/notes/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setNote(data)
        setFormData({
          title: data.title,
          content: data.content,
          isEncrypted: data.isEncrypted,
        })
      } else {
        setError(data.error || "获取笔记失败")
      }
    } catch (err) {
      setError("获取笔记失败")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    setIsSubmitting(true)
    setSubmitting(true) // 暂停自动保存

    try {
      const response = await fetch(`/api/notes/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "更新失败")
      } else {
        setNote(data.note)
        setIsEditing(false)
        // 手动保存后清除草稿
        clearDraft()
        router.refresh()
      }
    } catch (err) {
      setError("更新失败，请稍后重试")
    } finally {
      setSaving(false)
      setIsSubmitting(false)
      setSubmitting(false) // 恢复自动保存
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteDialogOpen(false)

    try {
      const response = await fetch(`/api/notes/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/dashboard")
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || "删除失败")
      }
    } catch (err) {
      setError("删除失败，请稍后重试")
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary mx-auto"></div>
          <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">笔记不存在</p>
            <Link
              href="/dashboard"
              className="block mt-4"
            >
              <Button
                variant="outline"
                className="w-full"
              >
                返回首页
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b sticky top-0 z-10 bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="btn-minimal"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>

          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="btn-minimal"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-minimal"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "删除中..." : "删除"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto animate-subtle transition-all duration-200 hover:shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="text-2xl font-medium"
                  />
                ) : (
                  <CardTitle className="text-2xl font-medium">{note.title}</CardTitle>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  创建于 {formatDate(note.createdAt)}
                  {note.updatedAt !== note.createdAt && ` · 更新于 ${formatDate(note.updatedAt)}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {note.isEncrypted && (
                  <div className="p-2 rounded-sm bg-gray-100">
                    <Lock className="h-6 w-6 text-muted-foreground ml-4" />
                  </div>
                )}

                {/* 自动保存状态指示器（仅编辑模式） */}
                {isEditing && !isSubmitting && (
                  <div className="flex items-center text-sm">
                    {saveStatus.status === "saving" && (
                      <span className="flex items-center text-muted-foreground">
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        保存中...
                      </span>
                    )}
                    {saveStatus.status === "saved" && (
                      <span className="flex items-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        已保存
                      </span>
                    )}
                    {saveStatus.status === "error" && (
                      <span className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        保存失败
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert
                variant="destructive"
                className="mb-4 animate-subtle"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isEditing ? (
              <form
                onSubmit={handleUpdate}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="content"
                    className="text-sm font-medium"
                  >
                    内容
                  </label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <EditorToolbar
                      editor={editor}
                      onImageUpload={handleImageUpload}
                    />
                    <TipTapEditor
                      content={formData.content}
                      onChange={content => setFormData({ ...formData, content })}
                      placeholder="开始输入内容..."
                      onEditorReady={setEditor}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isEncrypted"
                    checked={formData.isEncrypted}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        isEncrypted: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded-sm border-gray-300 text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="isEncrypted"
                    className="text-sm flex items-center"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    加密此笔记
                  </label>
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-minimal"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        保存中...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        title: note.title,
                        content: note.content,
                        isEncrypted: note.isEncrypted,
                      })
                    }}
                    className="flex-1 btn-minimal"
                  >
                    取消
                  </Button>
                </div>
              </form>
            ) : (
              <div className="prose max-w-none">
                <div
                  className="text-sm leading-relaxed p-4 bg-secondary/30 rounded-sm border"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="删除笔记"
        message="确定要删除这条笔记吗？此操作不可恢复。"
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
