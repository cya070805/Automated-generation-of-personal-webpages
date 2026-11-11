"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Loader2, Paperclip } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useSettings } from "@/store/settings-store";
import { cn } from "@/lib/utils";

interface BlockDTO {
  id: string;
  type: string;
  position: number;
  content: {
    name?: string;
    headline?: string;
    summary?: string;
    title?: string;
    org?: string;
    period?: string;
    details?: string[];
    items?: string[];
    versions?: string[];
    sourceQuote?: string;
    chosen?: number;
  };
}

interface Question {
  field: string;
  text: string;
  index: number;
  total: number;
}

const BLOCK_LABELS: Record<string, string> = {
  profile: "简介",
  education: "教育",
  experience: "实习 / 工作",
  project: "项目",
  skill: "技能",
};

function aiHeaders(): HeadersInit {
  const state = useSettings.getState();
  return {
    "content-type": "application/json",
    "x-llm-key": state.apiKey,
    "x-llm-provider": state.providerId,
    "x-llm-base": state.baseUrl,
    "x-llm-model": state.model,
    "x-llm-mode": state.mode,
  };
}

export function StartWizard() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [token, setToken] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [blocks, setBlocks] = useState<BlockDTO[]>([]);
  const [finished, setFinished] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/resume/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "解析失败");
      setText((prev) => (prev.trim() ? `${prev}\n\n${data.text}` : data.text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    if (!text.trim() && !name.trim()) {
      setError("至少写一两句经历，或者先上传一份旧简历。");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: name.trim() ? `${name.trim()}的主页` : "我的主页",
          targetRole: role.trim() || undefined,
        }),
      });
      const project = await projectRes.json();
      if (!projectRes.ok) throw new Error(project?.error?.message ?? "创建项目失败");

      setToken(project.editToken);
      setResumeId(project.resumeId);

      const analyzeRes = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify({
          resumeId: project.resumeId,
          text,
          name: name.trim(),
          role: role.trim(),
        }),
      });
      const analyzed = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzed?.error?.message ?? "整理失败");

      setBlocks(analyzed.blocks ?? []);
      setSessionId(analyzed.sessionId ?? "");
      if (analyzed.mode === "template") {
        setNotice("模板模式：没有调用模型，直接按原文切块。");
      } else if (analyzed.warning?.message) {
        setNotice(analyzed.warning.message);
      }

      setStep(2);
      await loadQuestion(project.resumeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "出错了，重试一次");
    } finally {
      setBusy(false);
    }
  }

  async function loadQuestion(id: string) {
    const res = await fetch("/api/resume/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resumeId: id }),
    });
    const data = await res.json();
    if (data.done) {
      setQuestion(null);
      return;
    }
    setQuestion(data.question);
  }

  async function submitAnswer(skip: boolean) {
    if (!question || !sessionId) return;
    if (!skip && !answer.trim()) {
      setError("写一句就行，或者点跳过。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/resume/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          question: question.text,
          field: question.field,
          answer: skip ? "" : answer.trim(),
          skip,
        }),
      });
      setAnswer("");
      await loadQuestion(resumeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/resume/draft", {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify({ resumeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "生成失败");
      setBlocks(data.blocks ?? []);
      if (data.mode === "template") setNotice("模板模式：文案直接用原文，没调模型。");
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  async function choose(blockId: string, index: number) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? { ...block, content: { ...block.content, chosen: index } }
          : block,
      ),
    );
    await fetch(`/api/blocks/${blockId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chosen: index }),
    });
  }

  const draftBlocks = blocks.filter(
    (block) => (block.content.versions?.length ?? 0) > 0,
  );

  const editLink =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/edit/${token}`
      : "";

  async function copyLink() {
    if (!editLink) return;
    await navigator.clipboard.writeText(editLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (finished) {
    return (
      <div className="max-w-[720px]">
        <h1 className="text-[30px] leading-tight tracking-[-0.02em] text-ink">
          内容已经存好了
        </h1>
        <p className="mt-3 text-[14.5px] leading-[1.75] text-muted">
          {"这条编辑链接就是它的身份，丢了找不回。先把它存下来，下次接着改。"}
        </p>
        <div className="mt-6 flex gap-2">
          <Input readOnly value={editLink} className="font-mono text-[12px]" />
          <Button variant="secondary" onClick={copyLink} className="shrink-0">
            {copied ? <Check /> : <Copy />}
            {copied ? "已复制" : "复制"}
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/edit/${token}`}
            className={buttonVariants({ size: "lg" })}
          >
            进编辑器调版式
            <ArrowRight />
          </Link>
          <Link
            href={`/preview/${token}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary" })}
          >
            先看看主页
          </Link>
          <Link
            href="/start"
            className="inline-flex h-10 items-center rounded-lg px-3 text-[14px] text-muted hover:text-ink"
          >
            再做一个
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px]">
      <p className="text-[12.5px] text-faint">第 {step} 步，共 3 步</p>

      {step === 1 && (
        <div className="fade-up">
          <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.02em] text-ink">
            先说清楚你是谁
          </h1>
          <p className="mt-3 text-[14.5px] leading-[1.75] text-muted">
            {"写得乱七八糟也没关系，后面会被问清楚。有旧简历的话直接传，省得手打。"}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="张同学"
              />
            </div>
            <div>
              <Label htmlFor="role">目标岗位</Label>
              <Input
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="前端开发实习生"
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="text">经历</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mb-1.5 inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink"
              >
                <Paperclip className="size-3.5" />
                上传旧简历（PDF / Word）
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(file);
                  event.target.value = "";
                }}
              />
            </div>
            <Textarea
              id="text"
              rows={9}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={"比如：\n2024 年暑假在 XX 公司做前端实习，做了个内部管理系统，用 React 写的，后来组里都在用。\n学校的课程项目做过一个二手书交易小程序，我负责前端和一部分后端。"}
              className="min-h-[220px]"
            />
            <p className="mt-1.5 text-[12px] text-muted">
              {text.trim().length} 字 · 越具体越好，记不清的留给下一步问
            </p>
          </div>

          {error && <p className="mt-4 text-[13px] text-danger">{error}</p>}
          {notice && <p className="mt-4 text-[13px] text-muted">{notice}</p>}

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={start} disabled={busy} size="lg">
              {busy ? <Loader2 className="animate-spin" /> : null}
              下一步：看看缺什么
            </Button>
            <span className="text-[12px] text-faint">
              会用你配置的模型读一遍
            </span>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-up">
          <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.02em] text-ink">
            {question ? "再问几个问题" : "问完了"}
          </h1>

          {question ? (
            <>
              <p className="mt-3 text-[12.5px] text-faint">
                问题 {question.index + 1} / {question.total}
              </p>
              <p className="mt-6 text-[19px] leading-[1.6] text-ink">
                {question.text}
              </p>
              <Textarea
                rows={5}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="知道多少写多少，记不清就跳过"
                className="mt-5"
                autoFocus
              />
              {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
              <div className="mt-5 flex items-center gap-3">
                <Button onClick={() => submitAnswer(false)} disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  回答
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => submitAnswer(true)}
                  disabled={busy}
                >
                  跳过
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-[14.5px] leading-[1.75] text-muted">
                {"问题问完了，接下来把素材写成简历上能直接用的句子。每段会给两版。"}
              </p>
              {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
              <Button onClick={generate} disabled={busy} className="mt-6" size="lg">
                {busy ? <Loader2 className="animate-spin" /> : null}
                生成文案
              </Button>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="fade-up">
          <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.02em] text-ink">
            确认文案
          </h1>
          <p className="mt-3 text-[14.5px] leading-[1.75] text-muted">
            {"每段两版，选一版。标出的那句是它从你原话里摘的依据。"}
          </p>

          {notice && <p className="mt-4 text-[13px] text-muted">{notice}</p>}

          <div className="mt-8 space-y-8">
            {draftBlocks.map((block) => {
              const versions = block.content.versions ?? [];
              const chosen = block.content.chosen ?? 0;
              return (
                <div key={block.id} className="border-t border-line pt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] text-faint">
                      {BLOCK_LABELS[block.type] ?? block.type}
                    </span>
                    {block.content.title &&
                      block.content.title !==
                        (BLOCK_LABELS[block.type] ?? block.type) && (
                        <span className="text-[13.5px] text-ink">
                          {block.content.title}
                        </span>
                      )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {versions.map((version, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => choose(block.id, index)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                          chosen === index
                            ? "border-ink/25 bg-subtle"
                            : "border-line hover:border-line-strong",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                            chosen === index
                              ? "border-ink bg-ink text-white"
                              : "border-line-strong",
                          )}
                        >
                          {chosen === index && <Check className="size-2.5" />}
                        </span>
                        <span className="text-[14px] leading-[1.7] text-ink-2">
                          {version}
                        </span>
                      </button>
                    ))}
                  </div>

                  {block.content.sourceQuote && (
                    <p className="mt-2 text-[12px] text-faint">
                      依据：{block.content.sourceQuote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="mt-4 text-[13px] text-danger">{error}</p>}

          <div className="mt-8 flex items-center gap-3">
            <Button onClick={() => setFinished(true)} size="lg">
              完成
            </Button>
            <Button variant="ghost" onClick={generate} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : null}
              重新生成
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
