import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { encrypt } from "../src/lib/encryption"

const prisma = new PrismaClient()

// 随机标题前缀
const titlePrefixes = ["工作", "学习", "生活", "项目", "会议", "计划", "想法", "笔记", "待办", "总结"]

// 随机标题后缀
const titleSuffixes = ["记录", "要点", "清单", "安排", "回顾", "分析", "方案", "报告", "心得", "经验"]

// 随机内容模板
const contentTemplates = [
  "今天完成了重要的工作任务，需要总结一下经验和教训。明天要继续推进项目的进度，确保按时完成目标。",
  "学习了新的技术知识，包括 React Hooks、TypeScript 高级类型和 Next.js App Router。需要实践应用这些知识。",
  "购买了生活用品：牛奶、面包、水果、蔬菜。下周需要补充日用品，包括洗衣液、牙膏等。",
  "项目进展顺利，已完成需求分析和系统设计。下一步开始编码实现，预计两周内完成核心功能。",
  "参加了团队会议，讨论了产品路线图和技术架构。决定采用微服务架构，提高系统的可扩展性。",
  "制定了本周的学习计划：周一学习算法，周二练习数据结构，周三阅读技术文章，周四写博客，周五复习总结。",
  "有了一个新产品创意：基于 AI 的智能笔记应用。可以进行市场调研，评估可行性。",
  "整理了开发环境的配置文档，包括 Node.js、Docker、Git 等工具的安装和使用说明。",
  "需要完成的任务列表：1.修复登录bug 2.优化数据库查询 3.添加单元测试 4.更新API文档 5.部署到生产环境。",
  "本月工作总结：完成了3个重要项目，解决了15个技术问题，写了8篇技术博客。下月目标是提升代码质量。",
]

// 生成随机字符串
function randomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成随机日期（在过去30天内）
function randomDate(): Date {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  // 随机小时和分钟
  date.setHours(Math.floor(Math.random() * 24))
  date.setMinutes(Math.floor(Math.random() * 60))
  return date
}

async function main() {
  console.log("🚀 开始生成测试数据...\n")

  try {
    // 获取加密密钥
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY 环境变量未配置，请在 .env 文件中设置")
    }

    // 1. 创建测试用户
    console.log("📝 创建测试用户...")
    const testEmail = `test_${randomString(8)}@example.com`
    const testPassword = await bcrypt.hash("test123456", 10)

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: testPassword,
        name: "测试用户",
      },
    })

    console.log(`✅ 用户创建成功: ${user.email}\n`)

    // 2. 生成随机笔记
    const noteCount = 50 // 生成50条笔记
    console.log(`📝 生成 ${noteCount} 条随机笔记...\n`)

    const notes = []
    let encryptedCount = 0
    let plainCount = 0

    for (let i = 0; i < noteCount; i++) {
      const prefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)]
      const suffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)]
      const title = `${prefix}${suffix}_${i + 1}`
      const content = contentTemplates[Math.floor(Math.random() * contentTemplates.length)]
      const isEncrypted = Math.random() > 0.3 // 70% 的笔记加密
      const createdAt = randomDate()
      const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // 在创建后7天内更新

      // 如果标记为加密，则真正加密内容
      const storedContent = isEncrypted ? encrypt(content, encryptionKey) : content

      if (isEncrypted) {
        encryptedCount++
      } else {
        plainCount++
      }

      const note = await prisma.note.create({
        data: {
          title,
          content: storedContent,
          isEncrypted,
          userId: user.id,
          createdAt,
          updatedAt,
        },
      })

      notes.push(note)

      if ((i + 1) % 10 === 0) {
        console.log(`  已生成 ${i + 1}/${noteCount} 条笔记...`)
      }
    }

    console.log(`\n✅ 成功生成 ${notes.length} 条笔记\n`)

    // 3. 统计信息
    console.log("📊 数据统计:")
    console.log(`  - 用户数: 1`)
    console.log(`  - 笔记总数: ${notes.length}`)
    console.log(`  - 加密笔记: ${encryptedCount}`)
    console.log(`  - 未加密笔记: ${plainCount}`)
    console.log(`  - 测试邮箱: ${testEmail}`)
    console.log(`  - 测试密码: test123456\n`)

    console.log("✨ 测试数据生成完成！可以使用以上邮箱和密码登录测试。\n")
  } catch (error) {
    console.error("❌ 生成测试数据失败:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log("🎉 脚本执行完成")
    process.exit(0)
  })
  .catch(error => {
    console.error("💥 脚本执行失败:", error)
    process.exit(1)
  })
