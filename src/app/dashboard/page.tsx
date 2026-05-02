"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Note } from "@/types"
import { formatDate } from "@/lib/utils"
import { Plus, FileText, LogOut, Lock, Trash2 } from "lucide-react"
import { signOut } from "next-auth/react"
import { ConfirmDialog } from "@/components/ConfirmDialog"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotes()
    }
  }, [status])

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes")
      const data = await response.json()

      if (response.ok) {
        setNotes(data.notes)
      }
    } catch (error) {
      console.error("获取笔记失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setNoteToDelete(noteId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!noteToDelete) return

    try {
      const response = await fetch(`/api/notes/${noteToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // 从列表中移除已删除的笔记
        setNotes(notes.filter(note => note.id !== noteToDelete))
      } else {
        const data = await response.json()
        alert(data.error || "删除失败")
      }
    } catch (err) {
      alert("删除失败，请稍后重试")
    } finally {
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setNoteToDelete(null)
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="glass shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              私密备忘录
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:inline-block">{session?.user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="button-hover transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800">我的备忘录</h2>
            <p className="text-gray-600 mt-1">
              共 <span className="font-semibold text-blue-600">{notes.length}</span> 条加密笔记
            </p>
          </div>

          <Link
            href="/notes/new"
            className="animate-fade-in"
          >
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 button-hover transition-all duration-300 shadow-md hover:shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              新建笔记
            </Button>
          </Link>
        </div>

        {notes.length === 0 ? (
          <Card className="text-center py-16 glass animate-fade-in border-0 shadow-xl">
            <CardContent>
              <div className="p-4 rounded-full bg-blue-100 inline-block mb-4">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-xl mb-2 text-gray-800">暂无笔记</CardTitle>
              <CardDescription className="mb-6 text-gray-600">创建您的第一条加密备忘录</CardDescription>
              <Link href="/notes/new">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 button-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  创建笔记
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note, index) => (
              <div
                key={note.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Card className="card-hover h-full glass border-0 shadow-md hover:shadow-xl transition-all duration-300 group">
                  <Link href={`/notes/${note.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-1 text-gray-800">{note.title}</CardTitle>
                        {note.isEncrypted && (
                          <div className="p-1 rounded-full bg-green-100">
                            <Lock className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                          </div>
                        )}
                      </div>
                      <CardDescription className="text-gray-500">{formatDate(note.updatedAt)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {note.isEncrypted ? (
                          <span className="flex items-center">
                            <Lock className="h-3 w-3 mr-1 text-green-500" />
                            已加密内容
                          </span>
                        ) : (
                          note.content
                        )}
                      </p>
                    </CardContent>
                  </Link>

                  {/* 删除按钮 */}
                  <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => handleDeleteNote(note.id, e)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 button-hover transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
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
