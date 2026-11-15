"use client";

import { useEffect, useState } from "react";

/**
 * 联系 · 气泡菜单。
 *
 * 来自 React Bits 的 BubbleMenu：两个小圆泡（一个名牌、一个开关），
 * 点开之后一排大药丸从中间炸开，每颗带一点倾斜。
 * 原版用 gsap 编排入场；这里整段动画都是 CSS 的 transition + 逐颗 delay，
 * 少一个 70KB 的依赖，观感一致。
 */

type Item = { label: string; value: string; href?: string };

export function ContactBubble({
  name,
  email,
  city,
  now,
}: {
  name: string;
  email: string;
  city: string;
  now: string;
}) {
  const [open, setOpen] = useState(false);

  const items: Item[] = [
    email ? { label: "邮箱", value: email, href: `mailto:${email}` } : null,
    city ? { label: "城市", value: city } : null,
    now ? { label: "现在", value: now } : null,
  ].filter((item): item is Item => Boolean(item));

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (items.length === 0) return null;

  const initial = (name || "我").trim().slice(0, 1);

  return (
    <div className="cbub" data-open={open ? "" : undefined}>
      <div className="cbub__bar">
        <div className="cbub__logo">
          <span className="cbub__mark">{initial}</span>
          <span className="cbub__who">{name || "联系方式"}</span>
        </div>
        <button
          type="button"
          className="cbub__toggle"
          aria-expanded={open}
          aria-label={open ? "收起联系方式" : "展开联系方式"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="cbub__line" />
          <span className="cbub__line cbub__line--short" />
        </button>
      </div>

      <div className="cbub__overlay" aria-hidden={!open}>
        <ul className="cbub__pills" role="list">
          {items.map((item, i) => (
            <li key={item.label} className="cbub__cell">
              {item.href ? (
                <a
                  className="cbub__pill"
                  href={item.href}
                  tabIndex={open ? 0 : -1}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className="cbub__k">{item.label}</span>
                  <span className="cbub__v">{item.value}</span>
                </a>
              ) : (
                <span
                  className="cbub__pill"
                  tabIndex={-1}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className="cbub__k">{item.label}</span>
                  <span className="cbub__v">{item.value}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* 读屏与 PDF：不依赖展开，永远读得到 */}
      <ul className="print-list">
        {items.map((item) => (
          <li key={item.label}>
            {item.label}：{item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
