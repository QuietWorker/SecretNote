"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import TipTapEditor from "@/components/notes/TipTapEditor"
import EditorToolbar from "@/components/notes/EditorToolbar"
import { useAutoSave } from "@/hooks/useAutoSave"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

export default function NewNotePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isEncrypted: true,
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [editor, setEditor] = useState<any>(null)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 使用自动保存 Hook
  const { saveStatus, loadDraft, clearDraft, setSubmitting } = useAutoSave(
    formData,
    async data => {
      // 自动保存时不显示错误，静默失败
      try {
        // 这里可以调用 API 或只保存到 localStorage
        // 当前实现中，useAutoSave 已经保存到 localStorage
      } catch (err) {
        console.error("自动保存失败:", err)
      }
    },
    {
      debounceMs: 2000,
      draftKey: "draft_note_new",
    }
  )

  // 页面加载时检查是否有草稿
  useEffect(() => {
    const draft = loadDraft()
    if (draft && (draft.title || draft.content)) {
      setShowDraftPrompt(true)
    }
  }, [loadDraft])

  // 恢复草稿
  const handleRestoreDraft = () => {
    const draft = loadDraft()
    if (draft) {
      setFormData({
        title: draft.title || "",
        content: draft.content || "",
        isEncrypted: draft.isEncrypted ?? true,
      })
    }
    setShowDraftPrompt(false)
  }

  // 放弃草稿
  const handleDiscardDraft = () => {
    clearDraft()
    setShowDraftPrompt(false)
  }

  // 键盘快捷键：Ctrl+S 保存
  useKeyboardShortcuts([
    {
      key: "s",
      modifiers: { ctrl: true },
      callback: e => {
        e.preventDefault()
        if (!loading && formData.title.trim() && formData.content.trim()) {
          handleSubmit(e as any)
        }
      },
      enabled: !isSubmitting,
    },
    {
      key: "Escape",
      callback: () => {
        router.push("/dashboard")
      },
      preventDefault: false,
    },
  ])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.title.trim()) {
      setError("标题不能为空")
      return
    }

    if (!formData.content.trim()) {
      setError("内容不能为空")
      return
    }

    setLoading(true)
    setIsSubmitting(true)
    setSubmitting(true) // 暂停自动保存

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "创建失败")
      } else {
        // 成功后清除草稿
        clearDraft()
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("创建失败，请稍后重试")
    } finally {
      setLoading(false)
      setIsSubmitting(false)
      setSubmitting(false) // 恢复自动保存（虽然即将跳转）
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="container mx-auto px-4 py-4">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto animate-subtle transition-all duration-200 hover:shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-medium">
              <div className="flex items-center">
                <div className="p-2 rounded-sm bg-secondary mr-3">
                  <Save className="h-5 w-5 text-muted-foreground" />
                </div>
                新建备忘录
              </div>

              {/* 自动保存状态指示器 */}
              {!isSubmitting && (
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 草稿恢复提示 */}
            {showDraftPrompt && (
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-900">检测到未保存的草稿，是否恢复？</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleRestoreDraft}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        恢复
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDiscardDraft}
                      >
                        放弃
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-subtle"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="text-sm font-medium"
                >
                  标题
                </label>
                <Input
                  id="title"
                  placeholder="输入笔记标题..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                />
              </div>

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
                  onChange={e => setFormData({ ...formData, isEncrypted: e.target.checked })}
                  className="h-4 w-4 rounded-sm border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="isEncrypted"
                  className="text-sm flex items-center"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  加密此笔记（推荐）
                </label>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-minimal"
                >
                  {loading ? (
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
                <Link
                  href="/dashboard"
                  className="flex-1"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full btn-minimal"
                  >
                    取消
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
