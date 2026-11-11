import type { BaseTokens } from "@/lib/templates/types";

/**
 * 身份图形。
 *
 * 用户还没传照片，页面也不能空着——所以按姓名算一个确定的图形：
 * 同一个名字永远长同一样，换一套基底跟着换色，导出的 HTML 里是纯 SVG，不依赖外部图片。
 * 以后接了真实头像，这里换成 img 就行，位置和比例都不用动。
 */

function hash(value: string): number {
  let h = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    h ^= value.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type Variant = "portrait" | "wide";

export function IdentityMark({
  base,
  seed,
  variant = "portrait",
  className = "",
  caption,
}: {
  base: BaseTokens;
  seed: string;
  variant?: Variant;
  className?: string;
  caption?: string;
}) {
  const h = hash(seed || "anonymous");
  const ink = base.color.ink;
  const accent = base.color.accent;
  const bg = base.color.surface;

  const mark = seed.trim().slice(0, 1) || "·";
  const pattern = h % 3;
  const angle = h % 90;
  const offset = h % 40;

  const w = variant === "wide" ? 720 : 320;
  const hgt = variant === "wide" ? 320 : 400;
  const uid = `idm-${(h % 100000).toString(36)}`;

  return (
    <figure className={`relative ${className}`}>
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: variant === "wide" ? "21 / 9" : "4 / 5",
          border: "1px solid var(--b-line)",
          borderRadius: "var(--b-radius)",
          background: bg,
        }}
      >
        <svg
          viewBox={`0 0 ${w} ${hgt}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 size-full"
          aria-hidden
        >
          <defs>
            <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.20" />
              <stop offset="52%" stopColor={accent} stopOpacity="0.05" />
              <stop offset="100%" stopColor={ink} stopOpacity="0.10" />
            </linearGradient>
            <pattern
              id={`${uid}-p`}
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
              patternTransform={`rotate(${angle})`}
            >
              <circle cx="1.4" cy="1.4" r="1.4" fill={ink} fillOpacity="0.13" />
            </pattern>
          </defs>

          <rect width={w} height={hgt} fill={`url(#${uid}-g)`} />

          {pattern === 0 &&
            [0, 1, 2, 3].map((ring) => (
              <circle
                key={ring}
                cx={w * 0.72}
                cy={hgt * 0.3}
                r={70 + ring * 58 + offset}
                fill="none"
                stroke={accent}
                strokeOpacity={0.26 - ring * 0.05}
                strokeWidth="1"
              />
            ))}

          {pattern === 1 &&
            [0, 1, 2, 3, 4, 5].map((line) => (
              <line
                key={line}
                x1={-hgt + line * 96 + offset}
                y1="0"
                x2={line * 96 + offset}
                y2={hgt}
                stroke={accent}
                strokeOpacity="0.2"
                strokeWidth="1"
              />
            ))}

          {pattern === 2 && (
            <>
              <circle
                cx={w * 0.3}
                cy={hgt * 0.68}
                r={Math.min(w, hgt) * 0.34}
                fill="none"
                stroke={accent}
                strokeOpacity="0.28"
                strokeWidth="1"
              />
              <circle
                cx={w * 0.3}
                cy={hgt * 0.68}
                r={Math.min(w, hgt) * 0.2}
                fill={accent}
                fillOpacity="0.1"
              />
            </>
          )}

          <rect width={w} height={hgt} fill={`url(#${uid}-p)`} />

          <text
            x={w - 14}
            y={hgt - 26}
            textAnchor="end"
            fontFamily={base.font.display}
            fontSize={variant === "wide" ? 190 : 210}
            fontWeight={base.font.displayWeight}
            fill={ink}
            fillOpacity="0.055"
            letterSpacing="-0.06em"
          >
            {mark}
          </text>
        </svg>
      </div>

      {caption && (
        <figcaption
          className="site-mono mt-2 flex items-baseline justify-between"
          style={{
            fontSize: "var(--b-size-meta)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--b-muted)",
          }}
        >
          <span>{caption}</span>
          <span aria-hidden>◇</span>
        </figcaption>
      )}
    </figure>
  );
}
