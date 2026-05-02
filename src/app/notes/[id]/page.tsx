"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Trash2, Edit, Lock } from "lucide-react"
import Link from "next/link"
import { Note } from "@/types"
import { formatDate } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ConfirmDialog"

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
        router.refresh()
      }
    } catch (err) {
      setError("更新失败，请稍后重试")
    } finally {
      setSaving(false)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <header className="glass shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="button-hover transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
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
                  className="button-hover transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="button-hover transition-all duration-200"
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
        <Card className="max-w-3xl mx-auto glass border-0 shadow-xl animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="text-2xl font-bold transition-all duration-300 focus:ring-2 focus:ring-blue-500/50"
                  />
                ) : (
                  <CardTitle className="text-2xl text-gray-800">{note.title}</CardTitle>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  创建于 {formatDate(note.createdAt)}
                  {note.updatedAt !== note.createdAt && ` · 更新于 ${formatDate(note.updatedAt)}`}
                </p>
              </div>
              {note.isEncrypted && (
                <div className="p-2 rounded-full bg-green-100">
                  <Lock className="h-6 w-6 text-green-600 ml-4" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert
                variant="destructive"
                className="mb-4 animate-slide-in"
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
                    className="text-sm font-medium text-gray-700"
                  >
                    内容
                  </label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    rows={12}
                    className="resize-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50"
                  />
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
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isEncrypted"
                    className="text-sm flex items-center text-gray-700"
                  >
                    <Lock className="h-4 w-4 mr-1 text-green-500" />
                    加密此笔记
                  </label>
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 button-hover transition-all duration-300"
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
                    className="flex-1 button-hover transition-all duration-200 hover:bg-gray-50"
                  >
                    取消
                  </Button>
                </div>
              </form>
            ) : (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 p-4 bg-white/50 rounded-lg border border-gray-100">
                  {note.content}
                </div>
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
