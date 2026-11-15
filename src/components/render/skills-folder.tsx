"use client";

import { useState } from "react";

/**
 * 技能 · 文件夹。
 *
 * 一只安静的小文件夹蹲在左下角，点开把技能标签铺到这一节里。
 * 标签是固定位置——不漂移、不互相推挤，读起来是清单，不是玩具。
 */
export function SkillsFolder({ skills }: { skills: string[] }) {
  const [open, setOpen] = useState(false);
  const list = skills.slice(0, 14);

  if (list.length === 0) return null;

  return (
    <div className="sfolder" data-open={open ? "" : undefined}>
      <div className="sfolder__stage">
        <div className="sfolder__tags">
          {list.map((label, i) => (
            <span
              className="sfolder__tag"
              key={label}
              style={{ "--i": i } as React.CSSProperties}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="sfolder__body">
          <span className="sfolder__back" aria-hidden />
          <span className="sfolder__front" aria-hidden>
            <span className="sfolder__label">技能</span>
            <span className="sfolder__sub">{list.length} 项</span>
          </span>
          <button
            type="button"
            className="sfolder__hit"
            aria-expanded={open}
            aria-label={`技能，${list.length} 项，点开查看`}
            onClick={() => setOpen((v) => !v)}
          />
        </div>
      </div>

      {/* 读屏与 PDF 用：不依赖展开 */}
      <ul className="print-list">
        {list.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
    </div>
  );
}
