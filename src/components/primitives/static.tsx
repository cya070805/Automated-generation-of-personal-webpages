import type { CSSProperties, ReactNode } from "react";

/**
 * 原语（一）：纯 CSS / SVG 的八件套。
 * 不需要 JS，服务端就能渲染，导出 PDF 也稳定。
 * 颜色一律走 `var(--b-*)` 令牌，换基底自动跟着变。
 */

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

type LayerProps = {
  className?: string;
  style?: CSSProperties;
  opacity?: number;
};

/** 01 噪点 / 颗粒：胶片感、纸质感 */
export function Grain({ className = "", opacity = 0.28 }: LayerProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 mix-blend-multiply ${className}`}
      style={{ backgroundImage: GRAIN_URL, opacity }}
    />
  );
}

/** 02 渐变 / 网格底：首屏背景、分区底色 */
export function GradientGrid({ className = "", opacity = 0.55 }: LayerProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        opacity,
        backgroundImage:
          "linear-gradient(var(--b-line) 1px, transparent 1px), linear-gradient(90deg, var(--b-line) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage:
          "radial-gradient(120% 80% at 50% 0%, #000 20%, transparent 78%)",
        WebkitMaskImage:
          "radial-gradient(120% 80% at 50% 0%, #000 20%, transparent 78%)",
      }}
    />
  );
}

/** 03 遮罩 / 裁切：异形图、文字镂空 */
export function MaskFrame({
  children,
  className = "",
  fade = true,
}: {
  children: ReactNode;
  className?: string;
  fade?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% 88%, 88% 100%, 0 100%)",
        background: "var(--b-surface)",
      }}
    >
      {children}
      {fade && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
          style={{
            background:
              "linear-gradient(to top, var(--b-surface), transparent)",
          }}
        />
      )}
    </div>
  );
}

/** 04 描边 / 贴纸：手绘感、标注感 */
export function Sticker({
  children,
  rotate = -2,
  className = "",
}: {
  children: ReactNode;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2 py-[3px] text-[11.5px] ${className}`}
      style={{
        borderColor: "var(--b-accent)",
        color: "var(--b-accent)",
        borderRadius: "2px",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </span>
  );
}

/** 05 玻璃 / 模糊：卡片、导航条 */
export function Glass({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: "color-mix(in srgb, var(--b-surface) 72%, transparent)",
        backdropFilter: "blur(12px)",
        border: "var(--b-border) solid var(--b-line)",
        borderRadius: "var(--b-radius)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 06 扫描线 / 边框光效：科技感 */
export function Scanline({ className = "" }: LayerProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, color-mix(in srgb, var(--b-ink) 2.2%, transparent) 0px, color-mix(in srgb, var(--b-ink) 2.2%, transparent) 1px, transparent 1px, transparent 6px)",
      }}
    />
  );
}

/** 07 微型图表：把「有几种」画成刻度，不假装精通程度 */
export function Meter({
  count,
  max,
  className = "",
}: {
  count: number;
  max: number;
  className?: string;
}) {
  const cells = Math.max(max, 1);
  return (
    <div
      aria-hidden
      className={`flex h-[6px] w-full overflow-hidden ${className}`}
      style={{ gap: "3px" }}
    >
      {Array.from({ length: cells }).map((_, index) => (
        <span
          key={index}
          className="h-full flex-1"
          style={{
            background:
              index < count ? "var(--b-accent)" : "var(--b-line)",
            borderRadius: "999px",
          }}
        />
      ))}
    </div>
  );
}

/** 08 粒子 / 流体：用 CSS 浮点代替 canvas，便宜且不卡 */
export function Particles({
  className = "",
  count = 14,
}: LayerProps & { count?: number }) {
  const dots = Array.from({ length: count }).map((_, index) => {
    const left = (index * 37) % 100;
    const top = (index * 53) % 100;
    const size = 2 + (index % 3);
    const delay = (index % 7) * 0.9;
    return (
      <span
        key={index}
        className="absolute rounded-full site-float"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: size,
          height: size,
          background: "var(--b-accent)",
          opacity: 0.5,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {dots}
    </div>
  );
}
