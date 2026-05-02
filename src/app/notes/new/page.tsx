"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Lock } from "lucide-react"
import Link from "next/link"

export default function NewNotePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isEncrypted: true,
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("创建失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <header className="glass shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto glass border-0 shadow-xl animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white mr-3">
                <Save className="h-5 w-5" />
              </div>
              新建备忘录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-slide-in"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-700"
                >
                  标题
                </label>
                <Input
                  id="title"
                  placeholder="输入笔记标题..."
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                  className="transition-all duration-300 focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="content"
                  className="text-sm font-medium text-gray-700"
                >
                  内容
                </label>
                <Textarea
                  id="content"
                  placeholder="输入笔记内容..."
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
                  onChange={e => setFormData({ ...formData, isEncrypted: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="isEncrypted"
                  className="text-sm flex items-center text-gray-700"
                >
                  <Lock className="h-4 w-4 mr-1 text-green-500" />
                  加密此笔记（推荐）
                </label>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 button-hover transition-all duration-300"
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
                    className="w-full button-hover transition-all duration-200 hover:bg-gray-50"
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
