import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/encryption"
import { z } from "zod"

const updateNoteSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题过长").optional(),
  content: z.string().min(1, "内容不能为空").optional(),
  isEncrypted: z.boolean().optional(),
})

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    const note = await prisma.note.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!note) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 })
    }

    let content = note.content
    if (note.isEncrypted) {
      const encryptionKey = process.env.ENCRYPTION_KEY
      if (!encryptionKey) {
        throw new Error("加密密钥未配置")
      }
      content = decrypt(note.content, encryptionKey)
    }

    return NextResponse.json({
      ...note,
      content,
    })
  } catch (error) {
    console.error("获取笔记失败:", error)
    return NextResponse.json({ error: "获取笔记失败" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    const existingNote = await prisma.note.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingNote) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateNoteSchema.parse(body)

    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error("加密密钥未配置")
    }

    const updateData: any = {}

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title
    }

    if (validatedData.content !== undefined) {
      const shouldEncrypt = validatedData.isEncrypted ?? existingNote.isEncrypted
      updateData.content = shouldEncrypt ? encrypt(validatedData.content, encryptionKey) : validatedData.content
      updateData.isEncrypted = shouldEncrypt
    }

    if (validatedData.isEncrypted !== undefined && !validatedData.content) {
      updateData.isEncrypted = validatedData.isEncrypted
    }

    const note = await prisma.note.update({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: updateData,
    })

    // 解密内容后返回
    let content = note.content
    if (note.isEncrypted) {
      content = decrypt(note.content, encryptionKey)
    }

    return NextResponse.json({
      message: "更新成功",
      note: {
        ...note,
        content,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("更新笔记失败:", error)
    return NextResponse.json({ error: "更新笔记失败" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    await prisma.note.delete({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    return NextResponse.json({
      message: "删除成功",
    })
  } catch (error) {
    console.error("删除笔记失败:", error)
    return NextResponse.json({ error: "删除笔记失败" }, { status: 500 })
  }
}
