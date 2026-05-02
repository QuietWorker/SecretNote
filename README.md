# 私密备忘录 (Secret Note)

一个基于 Next.js 的全栈私密备忘录应用，提供端到端加密功能，确保您的隐私安全。

## ✨ 功能特性

- 🔐 **用户认证系统** - 安全的注册和登录功能
- 🔒 **端到端加密** - AES-256-CBC 加密算法保护您的笔记内容
- 📝 **完整的 CRUD 操作** - 创建、查看、编辑、删除备忘录
- 🎨 **现代化 UI** - 基于 Tailwind CSS 和 shadcn/ui 的精美界面
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **快速性能** - Next.js 14 App Router 和服务端渲染

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: Prisma
- **认证**: NextAuth.js
- **加密**: crypto-js (AES-256-CBC)
- **UI 组件**: shadcn/ui

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd secret-note
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下变量：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="your-encryption-key-minimum-32-chars"
```

4. **初始化数据库**

```bash
npx prisma generate
npx prisma db push
```

5. **启动开发服务器**

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
secretNote/
├── prisma/
│   └── schema.prisma          # 数据库模型
├── src/
│   ├── app/
│   │   ├── api/               # API 路由
│   │   ├── login/             # 登录页面
│   │   ├── register/          # 注册页面
│   │   ├── dashboard/         # 仪表板
│   │   └── notes/             # 笔记页面
│   ├── components/
│   │   └── ui/                # UI 组件
│   ├── lib/                   # 工具函数
│   └── types/                 # TypeScript 类型
├── .env                       # 环境变量
└── package.json
```

## 🔒 安全特性

- **密码加密**: 使用 bcryptjs 对用户密码进行哈希处理
- **内容加密**: 使用 AES-256-CBC 算法加密笔记内容（客户端加密）
- **密钥派生**: PBKDF2 从用户密码派生加密密钥
- **会话管理**: 基于 JWT 的安全会话
- **授权验证**: 所有 API 端点都需要身份验证

## 📝 使用说明

1. **注册账号**: 访问 `/register` 创建新账号
2. **登录**: 使用邮箱和密码登录
3. **创建笔记**: 点击"新建笔记"按钮
4. **自动加密**: 笔记内容在客户端自动加密后存储
5. **管理笔记**: 查看、编辑或删除您的笔记

## 🔧 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npx prisma studio    # 打开 Prisma Studio
```

## 🌐 部署建议

### 生产环境配置

1. **更换密钥**:
   - 生成强随机 `NEXTAUTH_SECRET`

2. **数据库**:
   - 使用 PostgreSQL 替代 SQLite
   - 配置数据库连接池

3. **环境变量**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/secretnote"
   NEXTAUTH_SECRET="<strong-random-string>"
   NEXTAUTH_URL="https://yourdomain.com"
   ```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: 这是一个开发版本，生产使用前请确保：

- 更改所有默认密钥
- 启用 HTTPS
- 配置适当的 CORS 策略
- 定期备份数据库
