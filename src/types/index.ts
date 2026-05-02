export interface User {
  id: string
  name: string | null
  email: string
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: string
  title: string
  content?: string // 列表 API 不返回 content
  isEncrypted: boolean
  userId?: string // 列表 API 不返回 userId
  createdAt: Date
  updatedAt: Date
}

export interface CreateNoteInput {
  title: string
  content: string
  isEncrypted?: boolean
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  isEncrypted?: boolean
}
