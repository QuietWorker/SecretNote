import type { Metadata } from "next"
import { Noto_Sans_SC } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
})

export const metadata: Metadata = {
  title: "私密备忘录",
  description: "安全加密的私人备忘录应用",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
    >
      <body className={notoSans.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
