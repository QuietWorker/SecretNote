import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🗑️ 开始清理测试数据...\n")

  try {
    // 删除所有测试用户（邮箱以 test_ 开头）
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          startsWith: "test_",
        },
      },
    })

    console.log(`找到 ${testUsers.length} 个测试用户`)

    for (const user of testUsers) {
      // 删除用户的笔记
      const deletedNotes = await prisma.note.deleteMany({
        where: {
          userId: user.id,
        },
      })

      // 删除用户
      await prisma.user.delete({
        where: {
          id: user.id,
        },
      })

      console.log(`  - 删除用户 ${user.email} 及其 ${deletedNotes.count} 条笔记`)
    }

    console.log(`\n✅ 成功清理 ${testUsers.length} 个测试用户\n`)
  } catch (error) {
    console.error("❌ 清理失败:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log("🎉 清理完成")
    process.exit(0)
  })
  .catch(error => {
    console.error("💥 清理失败:", error)
    process.exit(1)
  })
