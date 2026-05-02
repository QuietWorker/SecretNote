import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/encryption"
import { z } from "zod"

const createNoteSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题过长"),
  content: z.string().min(1, "内容不能为空"),
  isEncrypted: z.boolean().optional().default(true),
})

export async function GET(request: Request) {
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

    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error("获取笔记失败:", error)
    return NextResponse.json({ error: "获取笔记失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error("加密密钥未配置")
    }

    const content = validatedData.isEncrypted ? encrypt(validatedData.content, encryptionKey) : validatedData.content

    const note = await prisma.note.create({
      data: {
        title: validatedData.title,
        content,
        isEncrypted: validatedData.isEncrypted,
        userId: user.id,
      },
    })

    return NextResponse.json(
      {
        message: "创建成功",
        note,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("创建笔记失败:", error)
    return NextResponse.json({ error: "创建笔记失败" }, { status: 500 })
  }
}
