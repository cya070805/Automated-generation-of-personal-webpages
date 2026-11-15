"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteSection } from "@/lib/site-data";

/**
 * 项目 · 横向带。
 *
 * 原来的「横向滚动 →」是一句永远为真的谎：卡片只有 42% 宽，
 * 两个项目就排满一行，根本没有可滚的距离。
 * 现在卡片按 64% 排，一定超出容器；提示和右边缘渐隐只在真的能滚、
 * 且还没滚到头的时候出现，滚到底就消失。桌面端补上拖动。
 */
export function ScrollBand({ items }: { items: SiteSection[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; left: number } | null>(null);
  const [scrollable, setScrollable] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const over = el.scrollWidth - el.clientWidth > 4;
    setScrollable(over);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(!over || el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure]);

  function onPointerDown(event: React.PointerEvent) {
    const el = trackRef.current;
    if (!el || !scrollable || event.pointerType === "touch") return;
    drag.current = { id: event.pointerId, x: event.clientX, left: el.scrollLeft };
    el.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const el = trackRef.current;
    const state = drag.current;
    if (!el || !state || state.id !== event.pointerId) return;
    el.scrollLeft = state.left - (event.clientX - state.x);
  }

  function endDrag(event: React.PointerEvent) {
    const el = trackRef.current;
    if (el?.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    drag.current = null;
  }

  const classNames = ["band__track"];
  if (items.length === 1) classNames.push("band__track--solo");
  if (scrollable) classNames.push("band__track--scroll");

  return (
    <div className="band">
      <div
        ref={trackRef}
        className={classNames.join(" ")}
        tabIndex={scrollable ? 0 : -1}
        role="group"
        aria-label="项目，可横向滚动查看"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {items.map((item, index) => (
          <article className="band__card" key={`${item.title}-${index}`}>
            <div className="band__head">
              <span className="band__num">{String(index + 1).padStart(2, "0")}</span>
              <span className="band__period">{item.period}</span>
            </div>
            <p className="band__title">{item.title}</p>
            {item.org && <p className="band__org">{item.org}</p>}
            {item.lines.length > 0 && (
              <ul className="band__lines">
                {item.lines.slice(0, 3).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {scrollable && !atStart && <span className="band__fade band__fade--left" aria-hidden />}

      {scrollable && !atEnd && (
        <>
          <span className="band__fade" aria-hidden />
          <p className="band__hint">左右拖动 →</p>
        </>
      )}
    </div>
  );
}
