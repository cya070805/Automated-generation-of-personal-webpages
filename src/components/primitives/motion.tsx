"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 原语（二）：需要 JS 的四件套。
 * 全部遵守 prefers-reduced-motion；关掉动效就退化成静态排版，内容一个字不少。
 */

function prefersReduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** 09 打字机 / 文字拆分 */
export function Typewriter({
  text,
  className = "",
  speed = 42,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (prefersReduced()) return;
    if (!text) return;

    let index = 0;
    setShown("");
    const timer = window.setInterval(() => {
      index += 1;
      setShown(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={className}>
      {shown}
      <span aria-hidden className="site-caret" />
    </span>
  );
}

/** 10 光标跟随 / 磁吸 */
export function Magnetic({
  children,
  strength = 8,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function onMove(event: React.MouseEvent) {
    const node = ref.current;
    if (!node || prefersReduced()) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    node.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }

  function reset() {
    const node = ref.current;
    if (node) node.style.transform = "translate(0, 0)";
  }

  return (
    <span
      ref={ref}
      className={`inline-block transition-transform duration-200 ease-out ${className}`}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </span>
  );
}

/** 11 倾斜 / 视差 */
export function Tilt({
  children,
  className = "",
  max = 4,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: React.MouseEvent) {
    const node = ref.current;
    if (!node || prefersReduced()) return;
    const rect = node.getBoundingClientRect();
    const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    node.style.transform = `perspective(900px) rotateX(${-y * max}deg) rotateY(${x * max}deg)`;
  }

  function reset() {
    const node = ref.current;
    if (node) node.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
  }

  return (
    <div
      ref={ref}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </div>
  );
}

/** 12 滚动驱动 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReduced()) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      data-shown={shown ? "1" : "0"}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(10px)",
        transition: "opacity .5s ease, transform .5s ease",
      }}
    >
      {children}
    </div>
  );
}
