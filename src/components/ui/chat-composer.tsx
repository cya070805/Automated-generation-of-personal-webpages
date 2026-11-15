"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 对话输入条（React Bits PromptBar 的简化版）。
 *
 * 只留两个动作：发送、跳过 —— 这个场景不需要 @ 引用、模型选择、语音。
 * 上排是输入框（长到 5 行封顶），下排左边跳过、右边发送，和微信那排按钮一个位置关系。
 */
export function ChatComposer({
  placeholder,
  hint,
  busy,
  onSend,
  onSkip,
}: {
  placeholder?: string;
  hint?: string;
  busy?: boolean;
  onSend: (text: string) => void;
  onSkip: () => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);

  // 跟着内容长高，到 5 行就内部滚动
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    const max = 22 * 5;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [draft]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus({ preventScroll: true });
  }, [busy]);

  const canSend = draft.trim().length > 0 && !busy;

  function send() {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft("");
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="cq" data-busy={busy ? "" : undefined}>
      <div
        className="cq__field"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.focus();
        }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          placeholder={placeholder ?? "知道多少写多少，不想答就点跳过"}
          aria-label="回答"
          className="cq__input"
          onChange={(event) => setDraft(event.target.value)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              !composing.current
            ) {
              event.preventDefault();
              send();
            }
          }}
        />

        <div className="cq__bar">
          <button
            type="button"
            className="cq__skip"
            onClick={onSkip}
            disabled={busy}
            title="跳过这个问题，直接问下一个"
          >
            跳过
          </button>

          <span className="cq__hint">{busy ? "正在想下一个问题…" : hint}</span>

          <button
            type="button"
            className={cn("cq__send")}
            data-armed={canSend ? "" : undefined}
            disabled={!canSend}
            aria-label="发送"
            onClick={send}
          >
            {busy ? (
              <Loader2 className="size-[15px] animate-spin" />
            ) : (
              <ArrowUp className="size-[15px]" strokeWidth={2.4} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
