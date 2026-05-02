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

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "updatedAt"
    const order = searchParams.get("order") || "desc"
    const searchQuery = searchParams.get("search") || ""

    // 验证参数
    const validSortFields = ["createdAt", "updatedAt", "title"]
    const validOrders = ["asc", "desc"]

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ error: "无效的排序字段" }, { status: 400 })
    }

    if (!validOrders.includes(order)) {
      return NextResponse.json({ error: "无效的排序方向" }, { status: 400 })
    }

    // 计算分页
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      userId: user.id,
    }

    // 如果有搜索关键词，添加标题搜索条件
    if (searchQuery.trim()) {
      where.title = {
        contains: searchQuery.trim(),
        // 注意：SQLite 不支持 mode 参数，默认已是不区分大小写（ASCII）
        // 如果需要完整的不区分大小写支持，建议迁移到 PostgreSQL
      }
    }

    // 查询总数
    const total = await prisma.note.count({
      where,
    })

    // 查询笔记列表（只返回必要字段）
    const notes = await prisma.note.findMany({
      where,
      select: {
        id: true,
        title: true,
        isEncrypted: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        [sortBy]: order,
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + notes.length < total,
      },
    })
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

// 批量删除笔记
export async function DELETE(request: Request) {
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
    const { noteIds } = body

    // 验证请求体
    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json({ error: "请提供要删除的笔记 ID 列表" }, { status: 400 })
    }

    // 限制单次批量删除数量（最多 50 条）
    if (noteIds.length > 50) {
      return NextResponse.json({ error: "单次最多只能删除 50 条笔记" }, { status: 400 })
    }

    // 验证所有笔记都属于当前用户
    const notes = await prisma.note.findMany({
      where: {
        id: { in: noteIds },
        userId: user.id,
      },
      select: {
        id: true,
      },
    })

    // 检查是否有不属于当前用户的笔记
    if (notes.length !== noteIds.length) {
      return NextResponse.json({ error: "部分笔记不存在或无权删除" }, { status: 403 })
    }

    // 批量删除
    const result = await prisma.note.deleteMany({
      where: {
        id: { in: noteIds },
        userId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `成功删除 ${result.count} 条笔记`,
    })
  } catch (error) {
    console.error("批量删除笔记失败:", error)
    return NextResponse.json({ error: "批量删除失败" }, { status: 500 })
  }
}
