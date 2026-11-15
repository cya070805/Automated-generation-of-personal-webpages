"use client";

import { useState } from "react";

/**
 * 技能 · 标签球。
 *
 * 左上角一颗写着 skill 的球，点开下面铺出一片标签，
 * 从左到右、从上到下排——顺序就是简历里的顺序。
 */
export function SkillsBubble({ skills }: { skills: string[] }) {
  const [open, setOpen] = useState(false);
  const list = skills.slice(0, 24);

  if (list.length === 0) return null;

  return (
    <div className="sbub" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="sbub__ball"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>skill</span>
        <span className="sbub__sign" aria-hidden>
          +
        </span>
      </button>

      <div className="sbub__tags">
        {list.map((label, i) => (
          <span
            className="sbub__tag"
            key={label}
            style={{ "--i": i } as React.CSSProperties}
          >
            {label}
          </span>
        ))}
      </div>

      <ul className="print-list">
        {list.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </div>
  );
}
