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
  content: string
  isEncrypted: boolean
  userId: string
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
