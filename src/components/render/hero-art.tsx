import type { CSSProperties } from "react";

/**
 * 首屏图形。
 *
 * 用户没传照片，页面也不能空一块灰方块——那是「图没加载出来」的样子。
 * 所以每套基底用自己的一套程序化图形：印章、窗口、图版、光球、格子。
 * 全是纯 SVG / CSS，导出包里不依赖任何外部图片。
 */

/** 纸面：藏书章。双环 + 姓名首字 + 年份，微微转一下，像盖上去的 */
export function ArtStamp({
  name,
  caption = "PORTFOLIO",
  className = "",
}: {
  name: string;
  caption?: string;
  className?: string;
}) {
  const mark = (name || "·").trim().slice(0, 1) || "·";
  const year = new Date().getFullYear();

  return (
    <div className={`site-stamp ${className}`} aria-hidden>
      <svg viewBox="0 0 120 120" className="size-full">
        <circle cx="60" cy="60" r="57.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="1.5 3.5"
          opacity="0.75"
        />
        <line x1="30" y1="42" x2="90" y2="42" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        <text
          x="60"
          y="37"
          textAnchor="middle"
          fontSize="8"
          letterSpacing="2.4"
          fill="currentColor"
          opacity="0.85"
        >
          {caption}
        </text>
        <text
          x="60"
          y="76"
          textAnchor="middle"
          fontSize="34"
          fontWeight="600"
          fill="currentColor"
          letterSpacing="-1"
        >
          {mark}
        </text>
        <line x1="34" y1="86" x2="86" y2="86" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        <text x="60" y="99" textAnchor="middle" fontSize="9" letterSpacing="1.6" fill="currentColor">
          {year}
        </text>
      </svg>
    </div>
  );
}

/** 深色舞台：一颗浮着的光球。三层叠出来，不用 canvas */
export function ArtOrb({ className = "" }: { className?: string }) {
  return (
    <div className={`site-orb ${className}`} aria-hidden>
      <span className="site-orb__halo" />
      <span className="site-orb__core" />
      <span className="site-orb__ring" />
    </div>
  );
}

/** 画廊：图版底。没有真图时用一层渐变 + 被裁掉的大字，像一张海报的局部 */
export function ArtPlateGhost({
  text,
  style,
  className = "",
}: {
  text: string;
  style?: CSSProperties;
  className?: string;
}) {
  const glyph = (text || "·").trim().slice(0, 1) || "·";
  return (
    <div className={`site-plate-ghost ${className}`} style={style} aria-hidden>
      <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" className="size-full">
        <defs>
          <linearGradient id="plate-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="55%" stopColor="currentColor" stopOpacity="0.03" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.10" />
          </linearGradient>
          <pattern id="plate-dots" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="1.6" cy="1.6" r="1.6" fill="currentColor" fillOpacity="0.22" />
          </pattern>
        </defs>
        <rect width="1200" height="520" fill="url(#plate-g)" />
        <rect width="1200" height="520" fill="url(#plate-dots)" opacity="0.4" />
        <text
          x="1180"
          y="470"
          textAnchor="end"
          fontSize="560"
          fontWeight="600"
          letterSpacing="-30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.17"
        >
          {glyph}
        </text>
      </svg>
    </div>
  );
}

/** 格子：卡片角上的一个小图，条形 + 圆点，说明「这里能放图」 */
export function ArtTiles({ className = "" }: { className?: string }) {
  return (
    <div className={`site-tiles ${className}`} aria-hidden>
      {Array.from({ length: 12 }).map((_, index) => (
        <i key={index} style={{ animationDelay: `${(index % 6) * 0.18}s` }} />
      ))}
    </div>
  );
}
