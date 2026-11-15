"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Loader2, Paperclip, Plus, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ChatComposer } from "@/components/ui/chat-composer";
import { useSettings } from "@/store/settings-store";
import { SKILL_GROUPS, SKILL_LIMIT, normalizeSkills } from "@/lib/skills";
import { copyText } from "@/lib/clipboard";
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
  why?: string;
  hint?: string;
}

interface ChatMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
  why?: string;
  skipped?: boolean;
}

/** 问答上限：跳过的也算一个，谈崩了不至于无限问下去 */
const MAX_QUESTIONS = 10;

const BLOCK_LABELS: Record<string, string> = {
  profile: "简介",
  education: "教育",
  experience: "实习 / 工作",
  project: "项目",
  skill: "技能",
};

/** 写经历时先看这几件事，比空想快 */
const EXPERIENCE_HINTS = [
  "在哪：公司 / 学校 / 项目名",
  "什么时候：起止时间或哪一学期",
  "你负责哪一块",
  "用了什么：技术、工具、方法",
  "做成了什么：数字、被谁用了",
];

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
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** 勾的技能：常用标签点出来的，和自己补的，最后合成一份 */
  const [skills, setSkills] = useState<string[]>([]);
  const [extraSkills, setExtraSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  const [token, setToken] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [asked, setAsked] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [blocks, setBlocks] = useState<BlockDTO[]>([]);
  const [finished, setFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  function toggleSkill(name: string) {
    setSkills((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name].slice(0, SKILL_LIMIT),
    );
  }

  function addSkill() {
    const value = skillDraft.trim().replace(/\s+/g, " ").slice(0, 20);
    if (!value) return;
    const known = [...SKILL_GROUPS.flatMap((group) => group.items), ...extraSkills];
    const match = known.find((item) => item.toLowerCase() === value.toLowerCase());
    if (!match) setExtraSkills((prev) => [...prev, value]);
    setSkills((prev) => normalizeSkills([...prev, match ?? value]));
    setSkillDraft("");
  }

  function dropSkill(name: string) {
    setExtraSkills((prev) => prev.filter((item) => item !== name));
    setSkills((prev) => prev.filter((item) => item !== name));
  }

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
    if (!text.trim() && !name.trim() && skills.length === 0) {
      setError("写两句经历、或者先勾几个技能，剩下的下一步接着问你。");
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
          email: email.trim(),
          skills,
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

  const pushMsg = useCallback((message: Omit<ChatMsg, "id">) => {
    setChat((prev) => [
      ...prev,
      { ...message, id: `${message.role}-${prev.length}-${Date.now()}` },
    ]);
  }, []);

  async function loadQuestion(id: string) {
    setThinking(true);
    try {
      const res = await fetch("/api/resume/ask", {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify({ resumeId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "取问题失败");

      if (data.done) {
        setQuestion(null);
        if (typeof data.asked === "number") setAsked(data.asked);
        return;
      }
      const next = data.question as Question;
      setQuestion(next);
      setAsked(next.index ?? 0);
      pushMsg({ role: "assistant", text: next.text, why: next.why });
    } finally {
      setThinking(false);
    }
  }

  /** 发出去的一条回答（或跳过）先上屏，再落库，再拿下一问 —— 像真的在聊天 */
  async function submitAnswer(text: string, skip: boolean) {
    if (!question || !sessionId || busy) return;

    pushMsg({
      role: "user",
      text: skip ? "跳过这题" : text,
      skipped: skip,
    });
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/resume/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          question: question.text,
          field: question.field,
          answer: skip ? "" : text,
          skip,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "这条没存上");
      }
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

  // 新消息进来就把对话滚到底，跟微信一样（instant 更稳，不受平滑滚动被中断影响）
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.length, thinking]);

  const editLink =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/edit/${token}`
      : "";

  async function copyLink() {
    if (!editLink) return;
    const ok = await copyText(editLink);
    if (!ok) {
      window.prompt("复制失败，请手动复制这条链接：", editLink);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (finished) {
    return (
      <div className="max-w-[720px]">
        <h1 className="text-[30px] leading-tight tracking-[-0.01em] text-ink">
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
          <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.01em] text-ink">
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
            <div className="sm:col-span-2">
              <Label htmlFor="email">
                邮箱
                <span className="font-normal text-faint">（会出现在主页上，可以留空）</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="yourname@example.com"
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
            <div className="mt-3 rounded-lg border border-line bg-subtle/50 px-3.5 py-3">
              <p className="text-[12.5px] leading-none text-ink-2">
                {"一段经历写清这五件事，后面就不用反复问你"}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {EXPERIENCE_HINTS.map((hint) => (
                  <span
                    key={hint}
                    className="rounded-full border border-line-strong bg-bg px-2.5 py-1 text-[11.5px] leading-none text-muted"
                  >
                    {hint}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-[11.5px] leading-[1.6] text-faint">
                {"不用连成句子，一行一件事也行；数字记不清就写「大概」，比空着好。"}
              </p>
            </div>

            <Textarea
              id="text"
              rows={9}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                "比如：\n2024.07—2024.10 在字节跳动电商中台做前端实习，负责商家后台的订单列表，用 React + TypeScript 重写了虚拟滚动，首屏从 4.2 秒降到 1.6 秒。\n2024 年课程项目：校园二手书小程序，我负责前端和一部分云函数，一学期撮合了 300 多单。\n学校：浙江工业大学 计算机科学与技术 本科，2022.09—2026.06。"
              }
              className="mt-3 min-h-[220px]"
            />
            <p className="mt-1.5 text-[12px] text-muted">
              {text.trim().length} 字 · 越具体越好，记不清的留给下一步问
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <Label>技能</Label>
              <span className="mb-1.5 text-[12px] text-muted">
                {skills.length > 0
                  ? `已选 ${skills.length} 个`
                  : "不用全选，勾几个拿得出手的"}
              </span>
            </div>

            <div className="rounded-lg border border-line p-3">
              <div className="space-y-2">
                {SKILL_GROUPS.map((group) => (
                  <div key={group.label} className="flex gap-2">
                    <span className="mt-[7px] w-[62px] shrink-0 text-[11.5px] leading-none text-faint">
                      {group.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => {
                        const active = skills.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleSkill(item)}
                            aria-pressed={active}
                            className={cn(
                              "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12px] leading-none transition-colors",
                              active
                                ? "border-ink bg-ink text-white"
                                : "border-line-strong text-ink-2 hover:border-ink/35 hover:text-ink",
                            )}
                          >
                            {active && <Check className="size-2.5" />}
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {extraSkills.length > 0 && (
                  <div className="flex gap-2">
                    <span className="mt-[7px] w-[62px] shrink-0 text-[11.5px] leading-none text-faint">
                      自己加的
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {extraSkills.map((item) => {
                        const active = skills.includes(item);
                        return (
                          <span
                            key={item}
                            className={cn(
                              "inline-flex h-7 items-center gap-1 rounded-full border pl-2.5 pr-1 text-[12px] leading-none transition-colors",
                              active
                                ? "border-ink bg-ink text-white"
                                : "border-line-strong text-ink-2",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => toggleSkill(item)}
                              aria-pressed={active}
                              className="leading-none"
                            >
                              {item}
                            </button>
                            <button
                              type="button"
                              onClick={() => dropSkill(item)}
                              aria-label={`删掉 ${item}`}
                              className={cn(
                                "grid size-5 place-items-center rounded-full transition-colors",
                                active ? "hover:bg-white/15" : "hover:bg-subtle",
                              )}
                            >
                              <X className="size-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  value={skillDraft}
                  onChange={(event) => setSkillDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="列表里没有就自己加，比如 Unity、Kubernetes、摄影"
                  className="h-9 text-[12.5px]"
                  maxLength={20}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addSkill}
                  disabled={!skillDraft.trim() || skills.length >= SKILL_LIMIT}
                  className="shrink-0"
                >
                  <Plus />
                  加上
                </Button>
              </div>
            </div>
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
        <div className="fade-up flex h-[calc(100dvh-310px)] min-h-[420px] flex-col">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.01em] text-ink">
                再聊几句
              </h1>
              <p className="mt-2 text-[13px] leading-[1.6] text-muted">
                {question
                  ? "答多少算多少，说不清就说「记不清了」，也可以直接跳过。"
                  : "问题问完了，接下来把素材写成简历上能直接用的句子。"}
              </p>
            </div>
            <span className="shrink-0 pb-1 text-[12px] tabular-nums text-faint">
              {question
                ? `第 ${asked + 1} 问 · 最多 ${MAX_QUESTIONS} 问`
                : `共问了 ${asked} 个`}
            </span>
          </div>

          <div
            ref={chatScrollRef}
            className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
          >
            {chat.map((message) => (
              <div
                key={message.id}
                className="chat__row"
                data-role={message.role}
              >
                <div
                  className="chat__bubble"
                  data-skip={message.skipped ? "" : undefined}
                >
                  {message.text}
                  {message.why && <p className="chat__why">{message.why}</p>}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="chat__row" data-role="assistant">
                <div className="chat__bubble" aria-label="正在想下一个问题">
                  <span className="chat__typing" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}

          {question ? (
            <ChatComposer
              placeholder={question.hint || "知道多少写多少，说不清就点跳过"}
              hint="Enter 发送 · Shift + Enter 换行"
              busy={busy || thinking}
              onSend={(text) => void submitAnswer(text, false)}
              onSkip={() => void submitAnswer("", true)}
            />
          ) : (
            <div className="mt-8 flex items-center gap-3">
              <Button onClick={generate} disabled={busy} size="lg">
                {busy ? <Loader2 className="animate-spin" /> : null}
                生成文案
              </Button>
              <span className="text-[12px] text-faint">每段给两版</span>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="fade-up">
          <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.01em] text-ink">
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
