import Link from "next/link";
import { SiteNav } from "./site-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="container-page w-full flex-1 py-12 md:py-16">{children}</main>
      <footer className="mt-8 border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-ink">履道</span>
            <span className="text-faint">面试官看得懂的个人主页</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link className="hover:text-ink" href="/start">
              开始制作
            </Link>
            <Link className="hover:text-ink" href="/settings">
              模型设置
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
