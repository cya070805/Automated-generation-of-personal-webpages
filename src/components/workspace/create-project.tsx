"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreatedProject {
  id: string;
  title: string;
  editToken: string;
  editUrl: string;
  resumeId?: string;
  pageId?: string;
}

export function CreateProject() {
  const [project, setProject] = useState<CreatedProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const editLink =
    project && typeof window !== "undefined"
      ? `${window.location.origin}${project.editUrl}`
      : project?.editUrl ?? "";

  async function onCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "我的主页" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "创建失败");
      setProject(data as CreatedProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!editLink) return;
    try {
      await navigator.clipboard.writeText(editLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("复制失败，手动选中链接复制");
    }
  }

  if (project) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-teal/25 bg-teal-soft/60 p-4">
          <p className="text-[13px] font-medium text-teal">项目已建好</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
            这条编辑链接就是它的身份，丢了找不回。先收藏再往下走。
          </p>
          <div className="mt-3 flex gap-2">
            <Input readOnly value={editLink} className="font-mono text-[12px]" />
            <Button variant="outline" onClick={onCopy} className="shrink-0">
              {copied ? <Check /> : <Copy />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
          <Meta label="project" value={project.id} />
          <Meta label="resume" value={project.resumeId ?? "—"} />
          <Meta label="page" value={project.pageId ?? "—"} />
          <Meta label="token" value={`${project.editToken.slice(0, 8)}…`} />
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] leading-relaxed text-muted">
        走一遍真实链路：POST /api/projects 建项目 → 同时建出简历容器与页面骨架 →
        返回一条带随机密钥的编辑链接。
      </p>
      <Button onClick={onCreate} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Plus />}
        建一个空项目
      </Button>
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd className="mt-1 truncate font-mono text-[11px] text-ink-soft">{value}</dd>
    </div>
  );
}
