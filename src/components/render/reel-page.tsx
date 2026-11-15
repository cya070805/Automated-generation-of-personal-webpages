"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { OptionWheel } from "@/components/primitives/option-wheel";

/**
 * 翻页壳（Reel）。
 *
 * 上半部分是钉死的封面，从头到尾不动；
 * 下半部分是一叠卡片，轮盘翻到哪一张，哪一张就从底下抽上来，旧的那张翻走。
 * 右边一颗轮盘，只占中间 2/3 的高度。
 *
 * 七格内容全在 DOM 里（手机上按长页排下来），翻页只改 data-state。
 * 打印和静态导出会落回长页，见 bases.ts 的 toPrintBase 与 preview 的 static 参数。
 */
export type ReelPanel = {
  key: string;
  label: string;
  content: ReactNode;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function ReelPage({
  cover,
  panels,
  name,
  year,
  textColor,
  activeColor,
  motion = "medium",
  footerNote,
}: {
  cover: ReactNode;
  panels: ReelPanel[];
  name?: string;
  year: number;
  textColor: string;
  activeColor: string;
  motion?: string;
  footerNote?: string;
}) {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelsRef = useRef(panels);
  panelsRef.current = panels;
  const index = Math.min(Math.max(active, 0), Math.max(panels.length - 1, 0));
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // 打开就是某一格：/preview/xxx#projects 这种链接可以直接发给别人。
  // 放在 effect 里读，服务端渲染时没有 hash，也不会有水合不一致。
  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.replace("#", "");
      if (!raw) return;
      const i = panelsRef.current.findIndex(
        (panel) => panel.key === raw || panel.label === raw,
      );
      if (i >= 0) setActive(i);
    };
    applyHash();
    setReady(true);
    // 手机上是长页，锚点跳转也得跟着翻
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), Math.max(panels.length - 1, 0));
    const from = indexRef.current;
    if (clamped === from) return;
    // 连续翻页时以 ref 为准，别等 re-render
    indexRef.current = clamped;
    setActive(clamped);
    setLeaving(from);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLeaving(null), 480);

    const key = panelsRef.current[clamped]?.key;
    if (key && window.location.hash !== `#${key}`) {
      // 只换地址栏，不新增历史，也不触发滚动
      window.history.replaceState(null, "", `#${key}`);
    }
  };

  if (panels.length === 0) return null;

  return (
    <div className="reel" data-still={motion === "none" ? "" : undefined}>
      <aside className="reel__rail" aria-hidden={panels.length < 2 ? true : undefined}>
        <div className="reel__wheel">
          <OptionWheel
            // 挂载完再定初始格（hash），所以只在 ready 翻面时重挂一次
            key={ready ? "reel" : "boot"}
            items={panels.map((panel) => panel.label)}
            defaultSelected={index}
            onChange={(next) => go(next)}
            textColor={textColor}
            activeColor={activeColor}
            side="left"
            fontSize={1.6}
            spacing={1.9}
            curve={0.24}
            tilt={8}
            blur={0.8}
            fade={0.13}
            minOpacity={0.22}
            smoothing={170}
            inset={42}
            label="章节"
          />
        </div>
      </aside>

      <div className="reel__stage">
        <div className="reel__cover">{cover}</div>

        <div className="reel__deck">
          <span className="reel-deck__back" aria-hidden />
          <span className="reel-deck__back reel-deck__back--far" aria-hidden />

          {panels.map((panel, i) => {
            const state =
              i === index ? "active" : i === leaving ? "leaving" : "hidden";
            return (
              <article
                key={panel.key}
                id={panel.key}
                className="reel-card"
                data-panel={panel.key}
                data-state={state}
              >
                <header className="reel__head">
                  <span className="reel__num">{pad(i + 1)}</span>
                  <span className="reel__label">{panel.label}</span>
                  <span className="reel__pos">
                    {pad(i + 1)} / {pad(panels.length)}
                  </span>
                </header>
                <div className="reel__body">{panel.content}</div>
              </article>
            );
          })}
        </div>

        <div className="reel__foot">
          <span className="reel__foot-name">{name || "个人主页"}</span>
          {footerNote && <span className="reel__foot-note">{footerNote}</span>}
          <span className="reel__foot-year">{year}</span>
        </div>
      </div>
    </div>
  );
}
