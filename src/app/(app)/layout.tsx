import { AppShell } from "@/components/app-shell";

/** 产品界面（带导航与页脚）。主页预览在 (app) 之外，整页渲染。 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
