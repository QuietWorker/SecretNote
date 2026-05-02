import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { v4 as uuidv4 } from "uuid"

// 允许的图片类型
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

// 最大文件大小：5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    // 解析 FormData
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "没有提供文件" }, { status: 400 })
    }

    // 验证文件类型
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "不支持的文件类型，仅支持 JPG、PNG、GIF、WebP 格式" }, { status: 400 })
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "文件大小超过限制（最大 5MB）" }, { status: 400 })
    }

    // 生成唯一文件名
    const fileExtension = file.name.split(".").pop()
    const uniqueFilename = `${uuidv4()}.${fileExtension}`

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), "public", "uploads", "images")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, uniqueFilename)
    await writeFile(filePath, buffer)

    // 构建图片 URL
    const imageUrl = `/uploads/images/${uniqueFilename}`

    // 在数据库中创建 Image 记录
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    const image = await prisma.image.create({
      data: {
        url: imageUrl,
        userId: user.id,
        size: file.size,
        mimeType: file.type,
      },
    })

    return NextResponse.json(
      {
        success: true,
        url: imageUrl,
        image: {
          id: image.id,
          url: image.url,
          size: image.size,
          mimeType: image.mimeType,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("图片上传错误:", error)
    return NextResponse.json({ error: "图片上传失败" }, { status: 500 })
  }
}
