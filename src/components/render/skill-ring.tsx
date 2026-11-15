/**
 * 技能：横向排开的索引行。
 * 不做旋转——一转就占不满宽度，还容易让人误碰。
 * 每项一个编号 + 名字，之间用细线分隔，铺满整行。
 */
export function SkillRing({ skills }: { skills: string[] }) {
  const list = skills.slice(0, 12);
  if (list.length === 0) return null;

  return (
    <div className="skillgrid">
      {list.map((skill, index) => (
        <div className="skillgrid__cell" key={skill}>
          <span className="skillgrid__num">{String(index + 1).padStart(2, "0")}</span>
          <span className="skillgrid__name">{skill}</span>
        </div>
      ))}
    </div>
  );
}
