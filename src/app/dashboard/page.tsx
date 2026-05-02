"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Toast } from "@/components/ui/toast"
import { Note } from "@/types"
import { formatDate } from "@/lib/utils"
import { highlightText } from "@/lib/highlight"
import { Plus, FileText, LogOut, Lock, Trash2, ArrowUpDown, Search, CheckSquare, Square } from "lucide-react"
import { signOut } from "next-auth/react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  // 批量删除相关状态
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
  // Toast 通知状态
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  })
  const [sortBy, setSortBy] = useState("updatedAt")
  const [order, setOrder] = useState("desc")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearch, setActiveSearch] = useState("") // 实际用于搜索的关键词
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Intersection Observer ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef(false)

  // 键盘快捷键
  useKeyboardShortcuts([
    {
      key: "n",
      modifiers: { ctrl: true },
      callback: () => {
        router.push("/notes/new")
      },
    },
    {
      key: "f",
      modifiers: { ctrl: true },
      callback: () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      },
    },
    {
      key: "Escape",
      callback: () => {
        // 如果在搜索状态，清除搜索
        if (searchQuery) {
          handleClearSearch()
        }
        // 如果在选择模式，退出选择模式
        if (isSelectMode) {
          setIsSelectMode(false)
          setSelectedNotes(new Set())
        }
      },
      enabled: true,
      preventDefault: false,
    },
  ])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      // 从 localStorage 加载排序偏好
      const savedSortBy = localStorage.getItem("noteSortBy")
      const savedOrder = localStorage.getItem("noteOrder")
      if (savedSortBy) setSortBy(savedSortBy)
      if (savedOrder) setOrder(savedOrder)

      fetchNotes(1, true)
    }
  }, [status])

  // 当排序改变时，重新加载第一页
  useEffect(() => {
    if (status === "authenticated") {
      fetchNotes(1, true)
    }
  }, [sortBy, order])

  const fetchNotes = async (page: number = 1, reset: boolean = false) => {
    await fetchNotesWithSearch(page, reset, activeSearch)
  }

  const fetchNotesWithSearch = async (page: number = 1, reset: boolean = false, searchTerm: string = activeSearch) => {
    if (loadingRef.current) return
    loadingRef.current = true

    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        order,
      })

      // 添加搜索参数（使用传入的搜索词或当前的 activeSearch）
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim())
      }

      const response = await fetch(`/api/notes?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (reset) {
          setNotes(data.notes)
        } else {
          setNotes(prev => [...prev, ...data.notes])
        }
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("获取笔记失败:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingRef.current = false
    }
  }

  // 保存排序偏好到 localStorage
  const handleSortChange = (value: string) => {
    const [field, direction] = value.split("-")
    setSortBy(field)
    setOrder(direction)
    localStorage.setItem("noteSortBy", field)
    localStorage.setItem("noteOrder", direction)
  }

  // 手动触发搜索
  const handleSearch = () => {
    const searchTerm = searchQuery.trim()
    setActiveSearch(searchTerm)
    // 直接传递搜索词，而不是依赖 activeSearch 状态
    fetchNotesWithSearch(1, true, searchTerm)
  }

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery("")
    setActiveSearch("")
    // 清除搜索后重新加载第一页（不带搜索参数）
    fetchNotesWithSearch(1, true, "")
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // 按 Enter 键触发搜索
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // Intersection Observer callback for infinite scroll
  const lastNoteRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return

      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && pagination.hasMore && !loadingMore) {
          fetchNotes(pagination.page + 1)
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [loading, pagination.hasMore, pagination.page, loadingMore]
  )

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
        // 显示成功提示
        setToast({ message: "笔记删除成功", type: "success" })
      } else {
        const data = await response.json()
        setToast({ message: data.error || "删除失败", type: "error" })
      }
    } catch (err) {
      setToast({ message: "删除失败，请稍后重试", type: "error" })
    } finally {
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setNoteToDelete(null)
  }

  // 切换选择模式
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedNotes(new Set())
  }

  // 切换单个笔记的选择状态
  const toggleNoteSelection = (noteId: string) => {
    const newSelected = new Set(selectedNotes)
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId)
    } else {
      newSelected.add(noteId)
    }
    setSelectedNotes(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedNotes.size === notes.length) {
      setSelectedNotes(new Set())
    } else {
      setSelectedNotes(new Set(notes.map(note => note.id)))
    }
  }

  // 批量删除确认
  const confirmBatchDelete = async () => {
    if (selectedNotes.size === 0) return

    try {
      const response = await fetch("/api/notes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteIds: Array.from(selectedNotes),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // 从列表中移除已删除的笔记
        setNotes(notes.filter(note => !selectedNotes.has(note.id)))
        // 退出选择模式
        setIsSelectMode(false)
        setSelectedNotes(new Set())
        // 显示成功提示
        setToast({ message: data.message || `成功删除 ${data.deletedCount} 条笔记`, type: "success" })
      } else {
        setToast({ message: data.error || "批量删除失败", type: "error" })
      }
    } catch (err) {
      console.error("批量删除错误:", err)
      setToast({ message: "批量删除失败，请稍后重试", type: "error" })
    } finally {
      setBatchDeleteDialogOpen(false)
    }
  }

  const cancelBatchDelete = () => {
    setBatchDeleteDialogOpen(false)
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary mx-auto"></div>
          <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-sm bg-secondary">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-medium text-foreground">私密备忘录</h1>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden sm:inline-block">{session?.user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="btn-minimal"
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
          <div className="animate-subtle">
            <h2 className="text-2xl font-medium text-foreground">我的备忘录</h2>
            <p className="text-muted-foreground mt-1">
              {isSelectMode ? (
                <>
                  已选择 <span className="font-medium">{selectedNotes.size}</span> 条笔记
                </>
              ) : activeSearch ? (
                <>
                  搜索结果：<span className="font-medium">{pagination.total}</span> 条笔记
                </>
              ) : (
                <>
                  共 <span className="font-medium">{pagination.total}</span> 条加密笔记
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* 搜索框 - 仅在选择模式下隐藏 */}
            {!isSelectMode && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-[240px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="搜索标题..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9 btn-minimal pr-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleSearch}
                  className="btn-minimal whitespace-nowrap"
                >
                  搜索
                </Button>
              </div>
            )}

            {/* 排序选择器 - 仅在选择模式下隐藏 */}
            {!isSelectMode && (
              <Select
                value={`${sortBy}-${order}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[180px] btn-minimal">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt-desc">更新时间（最新）</SelectItem>
                  <SelectItem value="updatedAt-asc">更新时间（最早）</SelectItem>
                  <SelectItem value="createdAt-desc">创建时间（最新）</SelectItem>
                  <SelectItem value="createdAt-asc">创建时间（最早）</SelectItem>
                  <SelectItem value="title-asc">标题（A-Z）</SelectItem>
                  <SelectItem value="title-desc">标题（Z-A）</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* 批量操作按钮 */}
            {isSelectMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={toggleSelectAll}
                  className="btn-minimal whitespace-nowrap"
                >
                  {selectedNotes.size === notes.length ? "取消全选" : "全选"}
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleSelectMode}
                  className="btn-minimal whitespace-nowrap"
                >
                  取消选择
                </Button>
                <Button
                  onClick={() => setBatchDeleteDialogOpen(true)}
                  disabled={selectedNotes.size === 0}
                  className="bg-red-600 text-white hover:bg-red-700 btn-minimal whitespace-nowrap"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  批量删除
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={toggleSelectMode}
                  className="btn-minimal whitespace-nowrap"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  选择
                </Button>
                <Link
                  href="/notes/new"
                  className="animate-subtle"
                >
                  <Button className="btn-minimal">
                    <Plus className="h-4 w-4 mr-2" />
                    新建笔记
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {notes.length === 0 ? (
          <Card className="text-center py-16 animate-subtle">
            <CardContent>
              <div className="p-4 rounded-sm bg-secondary inline-block mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg mb-2 font-medium">暂无笔记</CardTitle>
              <CardDescription className="mb-6">创建您的第一条加密备忘录</CardDescription>
              <Link href="/notes/new">
                <Button className="btn-minimal">
                  <Plus className="h-4 w-4 mr-2" />
                  创建笔记
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note, index) => {
                const isLastNote = index === notes.length - 1
                const isSelected = selectedNotes.has(note.id)
                return (
                  <div
                    key={note.id}
                    ref={isLastNote ? lastNoteRef : null}
                    className="animate-subtle"
                    style={{ animationDelay: `${index * 0.03}s`, animationDuration: "0.3s" }}
                  >
                    <Card
                      className={`h-full group transition-all duration-200 hover:shadow-sm hover:border-gray-300 active:scale-[0.99] relative ${
                        isSelected ? "ring-2 ring-primary border-primary" : ""
                      }`}
                    >
                      {/* 复选框 - 仅在选择模式下显示 */}
                      {isSelectMode && (
                        <div className="absolute top-3 left-3 z-10">
                          <button
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleNoteSelection(note.id)
                            }}
                            className="p-1 rounded-sm bg-background border border-border shadow-sm hover:bg-muted transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      )}

                      <Link
                        href={`/notes/${note.id}`}
                        className={isSelectMode ? "pointer-events-none" : ""}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className={`text-base font-medium line-clamp-1 ${isSelectMode ? "pl-8" : ""}`}>
                              {highlightText(note.title, activeSearch)}
                            </CardTitle>
                            {note.isEncrypted && (
                              <div className="p-1 rounded-sm bg-secondary">
                                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                              </div>
                            )}
                          </div>
                          <CardDescription>{formatDate(note.updatedAt)}</CardDescription>
                        </CardHeader>
                      </Link>

                      {/* 删除按钮 - 仅在非选择模式下显示 */}
                      {!isSelectMode && (
                        <div className="px-6 pb-4 pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => handleDeleteNote(note.id, e)}
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 btn-minimal opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                )
              })}
            </div>

            {/* 加载更多指示器 */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
              </div>
            )}

            {/* 没有更多数据提示 */}
            {!pagination.hasMore && notes.length > 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {activeSearch ? "已显示所有搜索结果" : "已加载全部笔记"}
              </div>
            )}
          </>
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

      {/* 批量删除确认对话框 */}
      <ConfirmDialog
        isOpen={batchDeleteDialogOpen}
        title="批量删除笔记"
        message={`确定要删除选中的 ${selectedNotes.size} 条笔记吗？${
          selectedNotes.size > 10 ? "\n\n警告：即将删除大量笔记，请谨慎操作！" : ""
        }\n\n此操作不可恢复。`}
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={confirmBatchDelete}
        onCancel={cancelBatchDelete}
      />

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
