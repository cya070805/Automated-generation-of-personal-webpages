import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: {
    default: "履道 · AI 个人主页与作品集生成",
    template: "%s · 履道",
  },
  description:
    "一次对话把经历问清楚，生成一个可编辑、可发布、也能打包带走的主页。面向应届生与实习生。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
