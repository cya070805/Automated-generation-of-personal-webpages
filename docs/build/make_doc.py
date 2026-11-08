# -*- coding: utf-8 -*-
"""生成《AI 个人主页与作品集生成平台 · 方案大纲》DOCX。"""
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

HEAD = "微软雅黑"
BODY = "微软雅黑"
MONO = "Consolas"

NAVY = RGBColor(0x16, 0x32, 0x4F)
ACCENT = RGBColor(0x2E, 0x6E, 0x6B)
WARM = RGBColor(0xB0, 0x6A, 0x3C)
INK = RGBColor(0x1F, 0x23, 0x28)
MUTED = RGBColor(0x5B, 0x65, 0x70)
LIGHT = RGBColor(0x8A, 0x94, 0x9E)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

H_NAVY = "16324F"
H_ACCENT = "2E6E6B"
H_WARM = "B06A3C"
H_RULE = "D9DEE3"
H_BG = "F4F6F7"
H_HDR = "EDF1F4"
H_WARNBG = "FBF3EC"
H_CODEBG = "F7F8F9"

USABLE = 16.4  # cm
TOTAL = 0


# ---------- 基础工具 ----------
def set_font(run, name=BODY, size=9.5, bold=None, color=None, italic=None):
    run.font.name = name
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    rFonts.set(qn("w:ascii"), name)
    rFonts.set(qn("w:hAnsi"), name)
    rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic
    if color is not None:
        run.font.color.rgb = color


def rich(p, text, size=9.5, color=INK, name=BODY, bold_base=False):
    """支持 **加粗** 的内联解析。"""
    parts = text.split("**")
    for i, seg in enumerate(parts):
        if not seg:
            continue
        r = p.add_run(seg)
        set_font(r, name, size, bold=(i % 2 == 1) or bold_base, color=color)


def para(text, size=9.5, color=INK, before=0, after=4, line=1.4, align=None, indent=0):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    if indent:
        pf.left_indent = Cm(indent)
    if align is not None:
        pf.alignment = align
    rich(p, text, size, color)
    return p


def bullet(text, size=9.5, color=INK, after=2.5, indent=0.55, mark="·"):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(indent)
    pf.first_line_indent = Cm(-indent)
    pf.space_after = Pt(after)
    pf.line_spacing = 1.38
    r = p.add_run(mark + " ")
    set_font(r, BODY, size, True, ACCENT)
    rich(p, text, size, color)
    return p


def add_pbdr(p, color=H_RULE, sz=6, space=6, edge="bottom"):
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    el = OxmlElement("w:" + edge)
    el.set(qn("w:val"), "single")
    el.set(qn("w:sz"), str(sz))
    el.set(qn("w:space"), str(space))
    el.set(qn("w:color"), color)
    pbdr.append(el)
    spacing = pPr.find(qn("w:spacing"))
    if spacing is not None:
        spacing.addprevious(pbdr)
    else:
        pPr.append(pbdr)


def shade_para(p, hexcolor):
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hexcolor)
    pPr.append(shd)


def h1(num, text):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(20)
    pf.space_after = Pt(9)
    pf.line_spacing = 1.15
    pf.keep_with_next = True
    r = p.add_run(num)
    set_font(r, HEAD, 10.5, True, ACCENT)
    r2 = p.add_run("  " + text)
    set_font(r2, HEAD, 14.5, True, NAVY)
    add_pbdr(p, H_RULE, 6, 7)
    return p


def h2(text, before=13, after=4):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = 1.2
    pf.keep_with_next = True
    r = p.add_run(text)
    set_font(r, HEAD, 10.8, True, NAVY)
    return p


def h3(text, tail=None, before=8, after=3):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = 1.2
    pf.keep_with_next = True
    r = p.add_run(text)
    set_font(r, HEAD, 9.8, True, NAVY)
    if tail:
        r2 = p.add_run("　" + tail)
        set_font(r2, BODY, 8.3, False, WARM)
    return p


# ---------- 表格 ----------
def _cell_border(cell, color, sz=18, edge="left"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = tcPr.find(qn("w:tcBorders"))
    if tcBorders is None:
        tcBorders = OxmlElement("w:tcBorders")
        tcPr.append(tcBorders)
    el = OxmlElement("w:" + edge)
    el.set(qn("w:val"), "single")
    el.set(qn("w:sz"), str(sz))
    el.set(qn("w:space"), "0")
    el.set(qn("w:color"), color)
    tcBorders.append(el)


def _cell_bg(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)


def _cell_margins(cell, t=55, b=55, l=95, r=95):
    tcPr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for tag, v in (("top", t), ("bottom", b), ("left", l), ("right", r)):
        el = OxmlElement("w:" + tag)
        el.set(qn("w:w"), str(v))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tcPr.append(mar)


def _table_setup(table, widths):
    table.autofit = False
    tbl = table._tbl
    tblPr = tbl.tblPr
    for tag in ("w:tblW", "w:tblBorders", "w:tblLayout"):
        for old in tblPr.findall(qn(tag)):
            tblPr.remove(old)
    tblW = OxmlElement("w:tblW")
    tblW.set(qn("w:w"), str(int(sum(widths) * 567)))
    tblW.set(qn("w:type"), "dxa")
    tblPr.append(tblW)
    borders = OxmlElement("w:tblBorders")
    for edge, val, sz, color in (
        ("top", "nil", 0, H_RULE),
        ("left", "nil", 0, H_RULE),
        ("bottom", "nil", 0, H_RULE),
        ("right", "nil", 0, H_RULE),
        ("insideH", "single", 4, H_RULE),
        ("insideV", "nil", 0, H_RULE),
    ):
        el = OxmlElement("w:" + edge)
        el.set(qn("w:val"), val)
        el.set(qn("w:sz"), str(sz))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        borders.append(el)
    tblPr.append(borders)
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tblPr.append(layout)
    # 关键：LibreOffice / Word 按 tblGrid 决定列宽
    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        cols = grid.findall(qn("w:gridCol"))
        for gc, w in zip(cols, widths):
            gc.set(qn("w:w"), str(int(w * 567)))
    for row in table.rows:
        trPr = row._tr.get_or_add_trPr()
        if trPr.find(qn("w:cantSplit")) is None:
            trPr.append(OxmlElement("w:cantSplit"))


def T(title, headers, rows, widths, note=None, caption=None):
    """标题 + 表。rows 中 'P0'/'P1'/'P2' 会特殊着色。"""
    global TOTAL
    if caption:
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.space_before = Pt(9)
        pf.space_after = Pt(3)
        pf.keep_with_next = True
        TOTAL += 1
        r = p.add_run("表 %d" % TOTAL)
        set_font(r, HEAD, 8.3, True, ACCENT)
        r2 = p.add_run("　" + caption)
        set_font(r2, HEAD, 8.3, True, MUTED)

    ncol = len(widths)
    table = doc.add_table(rows=0, cols=ncol)

    if headers:
        hr = table.add_row()
        for i, htxt in enumerate(headers):
            cell = hr.cells[i]
            cell.width = Cm(widths[i])
            _cell_bg(cell, H_HDR)
            _cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(htxt)
            set_font(r, HEAD, 8.2, True, NAVY)
        trPr = hr._tr.get_or_add_trPr()
        trPr.append(OxmlElement("w:tblHeader"))

    for row in rows:
        tr = table.add_row()
        for i, val in enumerate(row):
            cell = tr.cells[i]
            cell.width = Cm(widths[i])
            _cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.3
            if val in ("P0", "P1", "P2"):
                r = p.add_run(val)
                if val == "P0":
                    set_font(r, HEAD, 8.2, True, ACCENT)
                elif val == "P1":
                    set_font(r, HEAD, 8.2, True, MUTED)
                else:
                    set_font(r, HEAD, 8.2, False, LIGHT)
            else:
                rich(p, val, 8.3, INK)
                if i == 0:
                    for r in p.runs:
                        r.font.bold = True
                        r.font.color.rgb = NAVY
                        r.font.size = Pt(8.4)

    _table_setup(table, widths)

    # 短表尽量整表不跨页；长表允许跨页（表头会重复），避免留下半页空白
    if len(table.rows) <= 6:
        for row in table.rows[:-1]:
            for cell in row.cells:
                for p in cell.paragraphs:
                    p.paragraph_format.keep_with_next = True

    if note:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(note)
        set_font(r, BODY, 7.8, False, LIGHT, italic=True)
    return table


def callout(label, text, kind="accent"):
    bg = H_WARNBG if kind == "warn" else H_BG
    bar = H_WARM if kind == "warn" else H_ACCENT
    t = doc.add_table(rows=1, cols=1)
    t.autofit = False
    cell = t.cell(0, 0)
    cell.width = Cm(USABLE)
    _cell_bg(cell, bg)
    _cell_border(cell, bar, 18, "left")
    _cell_margins(cell, 95, 95, 150, 120)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.45
    r = p.add_run(label + "　")
    set_font(r, HEAD, 8.4, True, WARM if kind == "warn" else ACCENT)
    rich(p, text, 9.0, INK)
    _table_setup(t, [USABLE])
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(2)
    sp.paragraph_format.line_spacing = 1.0
    r = sp.add_run("")
    set_font(r, BODY, 4)


def code_block(lines):
    t = doc.add_table(rows=1, cols=1)
    t.autofit = False
    cell = t.cell(0, 0)
    cell.width = Cm(USABLE)
    _cell_bg(cell, H_CODEBG)
    _cell_border(cell, "C9D1D8", 12, "left")
    _cell_margins(cell, 100, 100, 150, 120)
    first = True
    for ln in lines:
        p = cell.paragraphs[0] if first else cell.add_paragraph()
        first = False
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.line_spacing = 1.12
        r = p.add_run(ln if ln else " ")
        set_font(r, MONO, 7.6, False, RGBColor(0x2A, 0x33, 0x3D))
    _table_setup(t, [USABLE])
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(2)
    sp.paragraph_format.line_spacing = 1.0
    r = sp.add_run("")
    set_font(r, BODY, 4)


def page_break():
    doc.add_page_break()


# ---------- 文档初始化 ----------
doc = Document()
sec = doc.sections[0]
sec.page_width = Cm(21.0)
sec.page_height = Cm(29.7)
sec.top_margin = Cm(2.2)
sec.bottom_margin = Cm(2.2)
sec.left_margin = Cm(2.3)
sec.right_margin = Cm(2.3)
sec.header_distance = Cm(1.0)
sec.footer_distance = Cm(1.2)
sec.different_first_page_header_footer = True

normal = doc.styles["Normal"]
normal.font.name = BODY
normal.font.size = Pt(9.5)
normal.font.color.rgb = INK
normal.element.rPr.rFonts.set(qn("w:eastAsia"), BODY)
normal.paragraph_format.line_spacing = 1.4
normal.paragraph_format.space_after = Pt(4)

props = doc.core_properties
props.title = "AI 个人主页与作品集生成平台 · 方案大纲"
props.subject = "可行性分析与实施大纲"
props.author = "项目组"
props.comments = "比赛项目内部方案稿 v1.0"

# 页脚：页码
footer_p = sec.footer.paragraphs[0]
footer_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r = footer_p.add_run("AI 个人主页与作品集生成平台 · 方案大纲")
set_font(r, BODY, 7.6, False, LIGHT)
r = footer_p.add_run("    ")
set_font(r, BODY, 7.6, False, LIGHT)
run = footer_p.add_run()
set_font(run, BODY, 7.6, False, MUTED)
fld1 = OxmlElement("w:fldChar")
fld1.set(qn("w:fldCharType"), "begin")
instr = OxmlElement("w:instrText")
instr.set(qn("xml:space"), "preserve")
instr.text = " PAGE "
fld2 = OxmlElement("w:fldChar")
fld2.set(qn("w:fldCharType"), "separate")
tmp = OxmlElement("w:t")
tmp.text = "1"
fld3 = OxmlElement("w:fldChar")
fld3.set(qn("w:fldCharType"), "end")
run._r.append(fld1)
run._r.append(instr)
run._r.append(fld2)
run._r.append(tmp)
run._r.append(fld3)

# ---------- 封面 ----------
for _ in range(2):
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(0)
    set_font(sp.add_run(""), BODY, 10)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(26)
r = p.add_run("PRODUCT PROPOSAL　/　2026.11")
set_font(r, HEAD, 8.2, True, ACCENT)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(0)
p.paragraph_format.line_spacing = 1.0
r = p.add_run("AI 个人主页与")
set_font(r, HEAD, 31, True, NAVY)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(10)
p.paragraph_format.line_spacing = 1.0
r = p.add_run("作品集生成平台")
set_font(r, HEAD, 31, True, NAVY)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(6)
r = p.add_run("面向应届生与实习生的对话式简历、主页与作品集生成工具")
set_font(r, HEAD, 11.5, False, MUTED)

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(6)
p.paragraph_format.space_after = Pt(0)
p.paragraph_format.right_indent = Cm(12.0)
add_pbdr(p, H_ACCENT, 18, 1)

for _ in range(2):
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(0)
    set_font(sp.add_run(""), BODY, 10)

# 封面信息表
info = [
    ("项目代号", "职迹 JobTrace（暂定，可替换）"),
    ("文档类型", "可行性分析与实施大纲"),
    ("适用场景", "比赛项目 · 立项评审 · 开发任务分解"),
    ("产品形态", "完整产品；本地 / 内网演示，不依赖公网与资质"),
    ("版本", "v1.0　·　2026 年 11 月"),
]
t = doc.add_table(rows=0, cols=2)
for k, v in info:
    row = t.add_row()
    c0, c1 = row.cells[0], row.cells[1]
    c0.width = Cm(3.4)
    c1.width = Cm(11.2)
    _cell_margins(c0, 40, 40, 0, 60)
    _cell_margins(c1, 40, 40, 60, 0)
    p0 = c0.paragraphs[0]
    p0.paragraph_format.space_after = Pt(0)
    set_font(p0.add_run(k), BODY, 8.6, False, LIGHT)
    p1 = c1.paragraphs[0]
    p1.paragraph_format.space_after = Pt(0)
    set_font(p1.add_run(v), BODY, 8.6, False, INK)
_table_setup(t, [3.4, 11.2])
# 去掉封面表的行间线
tblPr = t._tbl.tblPr
for b in tblPr.findall(qn("w:tblBorders")):
    for el in b:
        el.set(qn("w:val"), "nil")

# 封面底部
for _ in range(3):
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(0)
    set_font(sp.add_run(""), BODY, 10)

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(30)
r = p.add_run("本文档为内部方案讨论稿，用于统一产品范围与技术判断，不构成对外承诺。")
set_font(r, BODY, 7.8, False, LIGHT, italic=True)

page_break()

# ---------- 一、一页纸概览 ----------
h1("01", "一页纸概览")

callout(
    "一句话",
    "把「应届生不会建站、不会排版、也说不清自己做过什么」这三道坎，压缩成**一次对话**和**一次确认**。",
)

para("**目标用户**", before=8, after=3)
bullet("大三、大四或研一研二，正在投第一份像样简历；实习经历 0–2 段。")
bullet("有课程设计、竞赛、社团项目，但不会把它写成「业务价值」。")
bullet("想有一个能发出去的链接，但打开 Wix / Framer 十分钟就放弃。")

para("**核心链路**", before=9, after=3)
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(2)
p.paragraph_format.space_after = Pt(6)
p.paragraph_format.left_indent = Cm(0.2)
r = p.add_run("问卷或旧简历　→　AI 追问　→　文案确认　→　模板与风格　→　画布编辑　→　发布链接 ＋ 简历 PDF")
set_font(r, HEAD, 9.6, True, NAVY)

para("**与现有产品的三处不同**", before=6, after=3)
bullet("**先帮你想清楚写什么，再谈怎么排。** 多数简历工具默认你已经知道要写什么，从排版开始。")
bullet("**一份内容，两种产出。** 主页与 PDF 简历同源，改一处、两处同步，不会出现两版对不上。")
bullet("**风格由一句话生成设计令牌。** 不是「二十套模板换皮」，而是配色、字体、圆角、密度成套生成且可校验。")

para("**比赛的落地形态**", before=9, after=3)
bullet("完整产品形态，但**本地一键启动、全程可离线演示**；不依赖备案、不依赖微信资质、不依赖外网。")
bullet("评委可在 5 分钟内走完：上传简历 → 生成主页 → 拖一下 → 拿到可打开的链接。")

callout(
    "三条红线",
    "① 内容可溯源——每条生成的经历都能指回用户原话，AI 不造数字；② 演示不依赖外网——断网也能演；③ 导出保真——画布上什么样，导出的 PDF 就什么样。",
    kind="warn",
)

# ---------- 二、问题与机会 ----------
h1("02", "问题与机会")

h2("2.1　三道坎，其实只有一道是「工具问题」")
bullet("**不会建站**：域名、部署、响应式——已有一堆零代码工具，门槛在降低，不是核心矛盾。")
bullet("**不会排版**：模板能解决 80%，剩下 20% 是「内容长短不一导致破版」，属于工程问题。")
bullet(
    "**想不清写什么**：这是真问题。用户手里只有「参与了 XX 项目」这种句子，缺的是把它变成「我负责哪块、遇到什么问题、结果如何」的能力。现有工具全部假设用户已经完成了这一步。"
)
para(
    "所以本产品的重心不在「编辑器」，而在「**对话式挖掘**」——编辑器是交付手段，挖掘才是价值来源。",
    before=4,
    color=MUTED,
)

h2("2.2　现有方案各自缺了哪一环")
T(
    None,
    ["方案类别", "它能解决什么", "缺的那一环"],
    [
        ["招聘平台在线简历", "填写快、格式统一、可直接投递", "没有个人主页与作品集；样式不可控；离职即失效"],
        ["简历排版工具", "中文排版专业、导出 PDF 稳定", "只产出 PDF；不追问内容；无主页；模板同质化"],
        ["建站工具", "自由度高、模板多、可绑域名", "学习成本高；模板面向商业站点，不面向应届生叙事"],
        ["静态托管", "免费、可绑域名、可版本管理", "要会写代码、会配构建；对非技术用户等于不可用"],
        ["链接聚合页", "一分钟建好、手机友好", "太轻，承载不了项目细节与作品集"],
        ["AI 简历优化", "措辞润色、JD 匹配", "只改文字不管呈现；容易过度包装，缺乏事实约束"],
    ],
    [4.0, 5.6, 6.8],
    caption="六类现有方案与它们的缺口",
)

h2("2.3　空白地带")
callout(
    "机会",
    "把「**内容挖掘 + 视觉呈现 + 发布托管**」三段合成一条链路，并且默认用户「没东西可写」——这是现有产品都没占住的位置。",
    kind="accent",
)

h2("2.4　为什么是现在")
bullet("大模型的结构化抽取已经足够稳，能把一段乱七八糟的自述稳定落成字段。")
bullet("生图与设计令牌生成让「一句话换风格」第一次变得可控，而不是抽卡。")
bullet("静态站托管成本趋近于零，主页这种低频访问的产品不再需要为流量付费。")

# ---------- 三、产品能做什么 ----------
h1("03", "产品能做什么")

para(
    "九个模块，其中六个是 P0（没有它产品不成立），三个是 P1（有它体验完整）。下表是功能边界的**唯一口径**，后续开发按此对齐。",
    after=2,
)

T(
    None,
    ["模块", "用户可见的能力", "优先级", "首版"],
    [
        ["M1 信息采集", "分步问卷（可跳、可回改）；上传 PDF/Word 旧简历，自动解析填充，逐字段可修改", "P0", "是"],
        ["M2 对话式追问", "按 STAR 找缺口，一次只问一个问题；可跳过；对模糊描述追问数字、角色与结果", "P0", "是"],
        ["M3 文案生成", "简介、教育、实习、项目、技能、作品介绍；每段给两个版本；标出「哪句来自你的原话」", "P0", "是"],
        ["M4 主页生成", "九个模块自由组合：简介、头像、联系方式、教育、实习、项目、作品卡片、技能标签、简历下载", "P0", "是"],
        ["M5 风格系统", "五套高完成度模板；文字描述生成设计令牌（配色、字体、圆角、密度）并即时预览", "P0", "是"],
        ["M6 可视化编辑", "三层能力：改文字 → 调字号/颜色/高亮 → 画布拖拽、缩放、图层顺序", "P0", "是"],
        ["M7 发布与分享", "分享链接、访问密码、不收录索引、导出 HTML / PDF；本地可直接预览", "P0", "是"],
        ["M8 账号与多份简历", "邮箱登录；多份简历与主页；草稿与已发布版本；历史记录", "P1", "简版"],
        ["M9 AI 持续辅助", "按岗位 JD 定制、中英互译、润色、推荐模板、补全作品描述", "P1", "先做 2 项"],
    ],
    [3.5, 8.7, 1.5, 2.7],
    caption="功能地图与优先级",
    note="「首版」一列指本次比赛交付范围；标注「简版」表示只做最小可用形态，不追求完整。",
)

h2("3.1　每个模块的「做到什么程度」")
bullet("**M1**：问卷不超过 4 步；旧简历支持 PDF 与 DOCX，扫描件走 OCR 但允许失败并回退到问卷。")
bullet("**M2**：单轮只问一个问题，最多 12 轮；用户可以随时跳过一个话题，缺口在最后统一提示。")
bullet("**M3**：每条文案带 source_quote（来源原话）；没有来源的句子标为「待确认」，不允许直接定稿。")
bullet("**M4**：模板与内容解耦，换模板不重填内容；极端长度（一句话 / 八百字）都不破版。")
bullet("**M5**：模板只消费设计令牌，不写死颜色；令牌输出必须通过对比度校验。")
bullet("**M6**：编辑态与只读态共用同一套渲染组件，保证「编辑所见 = 发布所得 = 导出所得」。")
bullet("**M7**：分享页独立路由、无需登录可访问；密码与 noindex 为可选开关。")

# ---------- 四、核心链路 ----------
h1("04", "核心链路")

para("用户从进入到拿走成果，一共七步。每一步都要能失败、能回退、能跳过。", after=2)

T(
    None,
    ["阶段", "输入", "输出", "失败兜底"],
    [
        ["1 采集", "问卷答案或旧简历文件", "结构化基础档案（教育、经历、技能）", "解析失败 → 回退问卷；字段冲突 → 让用户选"],
        ["2 体检", "基础档案", "缺口清单（缺数字、缺角色、缺结果）", "缺口过多 → 只挑影响最大的 3 个追问"],
        ["3 追问", "缺口清单", "补充事实（原话入库）", "用户跳过 → 标记「未展开」，不阻塞"],
        ["4 成文", "事实 + 岗位方向", "分段落文案，每段带来源标记", "生成失败 → 重试一次，再失败给模板句"],
        ["5 确认", "分段落文案", "定稿内容（用户点过确认）", "用户全改 → 保留原稿可回滚"],
        ["6 呈现", "定稿内容 + 风格令牌", "主页草稿（可编辑画布）", "令牌异常 → 回落默认主题"],
        ["7 发布", "主页草稿", "分享链接 + PDF / HTML", "导出失败 → 降级为截图式 PDF"],
    ],
    [2.4, 3.2, 4.2, 6.6],
    caption="七步链路与失败兜底",
)

h2("4.1　三个必须坚持的设计决策")
bullet(
    "**内容与呈现分离。** 简历内容（Resume）与页面布局（Page）是两张表；布局只引用内容块 ID，不复制文字。这样换模板、做多版本、导出 PDF 都不会出现内容漂移。"
)
bullet(
    "**追问不阻塞。** 用户任何一步都能跳过，缺口留空并在最后统一提示。强制追问是这类产品最常见的流失点。"
)
bullet(
    "**AI 产出永远是「提案」。** 模型输出不直接写库，必须经过用户确认；确认动作本身也是数据，用于后续改进追问策略。"
)

h2("4.2　状态机")
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(2)
p.paragraph_format.left_indent = Cm(0.2)
p.paragraph_format.line_spacing = 1.5
r = p.add_run(
    "草稿 → 采集中 → 追问中 → 待确认 → 已生成 → 编辑中 → 已发布"
)
set_font(r, HEAD, 9.2, True, NAVY)
r2 = p.add_run("　（任意状态可回退到「编辑中」；「已发布」保留历史快照）")
set_font(r2, BODY, 8.4, False, MUTED)

# ---------- 五、可行性 ----------
h1("05", "可行性分析")

h2("5.1　技术可行性：逐项判断")
T(
    None,
    ["能力项", "成熟方案", "难度", "判断"],
    [
        ["旧简历解析", "pdfplumber / python-docx / PaddleOCR", "中", "可做；文本层优先，扫描件作为可选增强"],
        ["多轮追问", "LLM + JSON Schema 约束输出", "中", "可做；难点在话术与节奏，不在模型"],
        ["文案生成", "LLM", "低", "可做；质量取决于上下文组织"],
        ["模板渲染", "React + CSS 变量", "低", "可做；设计质量是主要投入"],
        ["自由画布编辑", "dnd-kit + 自研拖拽/缩放/图层", "高", "可做；工作量最大，必须限定交互集"],
        ["风格生成", "LLM 结构化输出 + 对比度校验", "中", "可做；必须收敛输出空间"],
        ["导出 PDF / HTML", "无头浏览器打印 / 自包含 HTML", "中", "可做；与画布同源渲染即可保真"],
        ["发布与托管", "Next.js 路由 / Docker", "低", "可做；本地演示无需公网"],
    ],
    [3.8, 5.2, 1.8, 5.6],
    caption="八项关键能力的技术可行性",
)

h2("5.2　工程可行性")
bullet("单体 Next.js 足以承载前端、API 与渲染；四个内部模块（ai / editor / render / export）边界清晰。")
bullet("预估代码量 1.2–1.8 万行（含模板与样式），属「一个中等项目」量级，不是平台级工程。")
bullet("依赖项全部为成熟开源库，无自研基础设施，智能体可以按契约逐块实现。")

h2("5.3　演示可行性")
bullet("一条命令启动，30 秒内出首页；种子数据可重复执行，演示不依赖现场输入。")
bullet("断网可完整走通：模型调用走本地缓存回放，保证评委面前不翻车。")
bullet("不涉及备案、支付、微信资质——这是「本地 / 内网演示」这一决策换来的最大自由度。")

h2("5.4　成本可行性")
bullet("一次完整生成约 25k–40k 输入 token、6k–10k 输出 token，按当前价格约 **0.2–0.8 元/人**。")
bullet("生图按 1–3 张计，约 0.1–0.5 元；仅在用户主动换风格时触发。")
bullet("比赛阶段总成本可忽略；真正的成本约束出现在公开运营阶段，不在本次范围。")

h2("5.5　合规可行性")
bullet("本地 / 内网演示不涉及 ICP 备案与内容审核责任。")
bullet("微信登录需要企业或个体户资质，首版**降级为邮箱登录 + 演示账号**，接口预留。")
bullet("简历属个人信息：本地存储、明示用途、支持一键清空；演示数据必须脱敏。")

callout(
    "结论",
    "**技术可行，没有单点难题。** 真正的风险集中在两处：自由画布编辑器的工程量，以及 AI 生成内容的真实性。前者靠限定范围控制，后者靠溯源机制控制。",
)

# ---------- 六、难点与对策 ----------
h1("06", "难点与对策")

para("按「会拖垮项目」的优先级排序，前两个必须一次做对，后四个可以边做边调。", after=4)

h3("D1　旧简历解析", "难度：中 → 高")
bullet("**为什么难**：中文简历版式极其混乱——双栏、表格、文本框、页眉页脚混排；PDF 提取常出现串行与错序。", indent=0.0)
bullet("**怎么做**：先抽文本层并按坐标重建阅读顺序；再分块交给模型做结构化抽取（JSON Schema 强约束）；置信度低的字段标黄，强制用户过一遍。", indent=0.0)
bullet("**验收**：20 份真实简历样本，关键字段抽取准确率 ≥ 85%，且**不允许静默错填**——宁可标黄让用户改。", indent=0.0)

h3("D2　追问质量与「AI 编数据」", "难度：中｜风险：极高")
bullet("**为什么难**：模型天然倾向于把「参与了」润色成「主导了，提升 30%」。简历造假是这类产品唯一会直接毁口碑的事。", indent=0.0)
bullet("**怎么做**：把**事实**与**措辞**分开——事实只来自用户原话，措辞可以 AI 写；每条 bullet 保留 source_quote；数字必须由用户明确确认，模型不得生成；成文后跑一遍「事实核查」，标出没有来源的句子。", indent=0.0)
bullet("**验收**：随机抽 30 条生成文案，100% 可回溯到原话；凭空数字 0 条。", indent=0.0)

h3("D3　自由画布编辑器", "难度：高｜工程量：最大")
bullet("**为什么难**：拖拽、缩放、吸附、对齐、图层、撤销、响应式、多端一致——每一项单独都不难，叠在一起就是半个设计工具。", indent=0.0)
bullet(
    "**怎么做**：数据模型 Page → Section → Element，全部绝对定位 + 8pt 网格吸附 + 12 列参考线；编辑态与只读态共用同一套渲染组件；交互用 dnd-kit 处理碰撞与排序，缩放与手柄自研；撤销/重做走命令栈，不用状态快照。",
    indent=0.0,
)
bullet("**响应式策略**：桌面定稿 + 断点缩放规则（按比例缩、允许重排），不做三端分别设计。", indent=0.0)
bullet("**降级路径**：若工期不足，锁定「拖动位置 + 改宽高 + 调图层顺序」，砍掉旋转、多选、成组——这三个占工作量一半，价值最低。", indent=0.0)
bullet("**验收**：拖动 60fps；撤销 50 步；刷新后位置不丢；导出与画布位置误差 < 2px。", indent=0.0)

h3("D4　一句话生成视觉风格", "难度：中 → 高（可控性）")
bullet("**为什么难**：生图模型产出的是「一张图」，而页面需要的是「一组规则」；直接把图贴上去会变成不可维护的贴纸。", indent=0.0)
bullet("**怎么做**：约束模型只输出固定 schema——6 个颜色、1 组字体搭配、圆角、间距刻度、密度；服务端做 WCAG 对比度校验并自动修正；生图只用于情绪板参考与背景纹理，不进入关键路径。", indent=0.0)
bullet("**验收**：100 次生成中 ≥ 90% 通过对比度校验；用户 3 次以内能选到满意风格。", indent=0.0)

h3("D5　模板的审美下限", "难度：中")
bullet("**为什么难**：模板丑，产品就死了；但「好看」不能靠堆数量。", indent=0.0)
bullet("**怎么做**：只做 5 套高完成度模板，不做 20 套平庸模板；用真实应届生内容（短句、空段落、超长项目名）做填充压力测试。", indent=0.0)

h3("D6　导出保真", "难度：中")
bullet("**为什么难**：画布 → PDF / HTML 涉及分页、字体嵌入、图片裁切，任何一处不一致都会被一眼看穿。", indent=0.0)
bullet("**怎么做**：PDF 用无头浏览器直接打印同一路由；HTML 导出为自包含单文件（CSS 内联、图片转 base64、字体子集化）。", indent=0.0)
bullet("**验收**：导出 PDF 与页面截图的像素差异 < 3%。", indent=0.0)

# ---------- 七、技术方案 ----------
h1("07", "技术方案大纲")

h2("7.1　选型")
T(
    None,
    ["层", "选型", "理由"],
    [
        ["应用框架", "Next.js 15（App Router）+ TypeScript", "一个进程同时扛页面与 API；结构规整，智能体容易理解"],
        ["样式", "Tailwind CSS + CSS 变量", "设计令牌落地为变量，换风格 = 换一组变量"],
        ["组件", "shadcn/ui", "源码可控、可改样式，不引入黑盒"],
        ["画布交互", "dnd-kit + 自研拖拽手柄", "排序与碰撞交给库，自由定位自己写更可控"],
        ["状态", "Zustand + 命令模式", "撤销/重做必须走命令栈，轻量够用"],
        ["数据", "SQLite（本地）/ Postgres（可选）+ Prisma", "本地零依赖；schema 即文档"],
        ["AI 接入", "OpenAI 兼容协议（模型可换）", "换模型只改 baseURL 与 model 名"],
        ["生图", "可换 provider（即梦 / FLUX / SD）", "只用于情绪板与纹理，不进入关键路径"],
        ["导出", "Playwright", "与浏览器渲染天然一致"],
        ["部署", "Docker Compose", "一条命令起全套，换机器也能跑"],
    ],
    [3.0, 5.4, 8.0],
    caption="技术选型与理由",
)

h2("7.2　分层")
bullet("**接入层**：页面路由（编辑态 / 只读态 / 分享页）、API 路由。")
bullet("**领域层**：resume（内容）、page（呈现）、theme（风格）、share（发布）。")
bullet("**能力层**：ai（解析 / 抽取 / 追问 / 生成 / 核查）、render（渲染）、export（导出）。")
bullet("**数据层**：Prisma + SQLite；文件走本地磁盘与静态路由。")
bullet("**约束**：能力层不得反向依赖接入层；模板不得直接读数据库。")

h2("7.3　数据模型")
T(
    None,
    ["表", "关键字段", "作用"],
    [
        ["users", "id, email, password_hash", "账号"],
        ["resumes", "id, user_id, title, status, target_role", "一份简历的容器"],
        ["resume_blocks", "id, resume_id, type, content(JSON), source_quote, confidence", "内容块，带溯源与置信度"],
        ["chat_sessions", "id, resume_id, stage, gap_list(JSON)", "一次追问会话"],
        ["messages", "id, session_id, role, content, asked_field", "对话记录，用于复盘追问策略"],
        ["pages", "id, resume_id, theme(JSON), layout(JSON)", "呈现层，与内容分离"],
        ["page_versions", "id, page_id, snapshot(JSON)", "版本与回滚"],
        ["assets", "id, user_id, kind, path, meta", "头像与作品图"],
        ["shares", "id, page_id, slug, password_hash, noindex", "分享与隐私控制"],
    ],
    [3.2, 7.4, 5.8],
    caption="核心数据表（仅列关键字段）",
)

h2("7.4　AI 管线：五段，每段可单独测试")
for i, txt in enumerate(
    [
        "**解析**：文件 → 纯文本 + 版面块（保留坐标，用于还原顺序）。",
        "**抽取**：文本块 → 结构化档案（JSON Schema 约束，失败自动重试一次）。",
        "**缺口分析**：档案 → 缺口清单（缺数字、缺角色、缺结果、缺时间）。",
        "**追问**：缺口 → 一次一个问题（带上下文，记住用户已说过的）。",
        "**成文 + 核查**：事实 → 分段落文案 → 逐句标注来源 → 标出无来源句子。",
    ],
    start=1,
):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(0.7)
    pf.first_line_indent = Cm(-0.7)
    pf.space_after = Pt(3)
    pf.line_spacing = 1.38
    r = p.add_run("0%d  " % i)
    set_font(r, HEAD, 8.6, True, ACCENT)
    rich(p, txt, 9.2)

h2("7.5　编辑器数据模型（示意）")
code_block(
    [
        "{",
        '  "pageId": "p_8f2c",',
        '  "canvas": { "width": 1200, "grid": 8, "breakpoints": [1440, 768, 375] },',
        '  "theme":  { "colors": { "ink": "#16324F", "bg": "#FBFAF7" },',
        '              "fontPair": "sans-modern", "radius": 12, "density": "comfy" },',
        '  "sections": [',
        '    { "id": "s_hero", "x": 0, "y": 0, "w": 1200, "h": 420,',
        '      "elements": [',
        '        { "id": "e_name", "type": "text", "x": 80, "y": 96, "w": 520, "h": 64,',
        '          "style": { "fontSize": 48, "weight": 700, "color": "ink" },',
        '          "content": { "blockId": "b_12", "text": "林小满" } },',
        '        { "id": "e_avatar", "type": "image", "x": 860, "y": 64, "w": 240, "h": 240,',
        '          "style": { "radius": 120, "fit": "cover" },',
        '          "content": { "assetId": "a_03" } }',
        "      ] }",
        "  ]",
        "}",
    ]
)
para(
    "要点：元素只存引用（blockId / assetId），不存文字副本——这是「改一处、处处同步」的基础。",
    size=8.6,
    color=MUTED,
    after=3,
)

h2("7.6　目录结构")
code_block(
    [
        "app/                  页面路由 (编辑态 / 只读态 / 分享页)",
        "components/ui/        基础组件 (按钮、输入、弹层)",
        "components/editor/    画布、拖拽、属性面板",
        "components/templates/ 模板 (只消费设计令牌，不写死颜色)",
        "lib/ai/               解析、抽取、追问、生成、核查",
        "lib/render/           同一份 layout → 页面 / PDF / HTML",
        "lib/db/               Prisma schema 与查询",
        "scripts/              seed、导出、冒烟脚本",
        "tests/e2e/            三条黄金路径",
    ]
)

# ---------- 八、路线图 ----------
h1("08", "路线图")

para(
    "不设硬期限，但每个里程碑必须有可演示的产出——不能演示的里程碑等于没完成。",
    after=2,
)

T(
    None,
    ["阶段", "交付物", "验收标准", "一句话演示"],
    [
        ["M0 · S\n骨架", "仓库、登录、数据库、种子数据、三条冒烟测试", "一条命令 30 秒内出首页；seed 可重复执行", "「能跑起来」"],
        ["M1 · M\n内容闭环", "问卷、简历解析、追问、文案生成与确认", "上传一份真实简历，12 轮内产出可读的三段经历", "「能从无到有写出内容」"],
        ["M2 · L\n呈现闭环", "五套模板、主页渲染、结构化编辑、PDF 导出", "换模板不丢内容；导出与预览一致", "「能生成一个能发的页面」"],
        ["M3 · XL\n画布与发布", "自由拖拽 / 缩放 / 图层、撤销、分享链接、访问密码", "拖动 60fps；刷新不丢；分享页手机可开", "「能拖、能发」"],
    ],
    [2.6, 5.8, 5.4, 2.6],
    caption="四个里程碑（S/M/L/XL 为相对工作量，非工期承诺）",
)

h2("8.1　依赖关系")
para(
    "M0 是一切的前提；M1 与 M2 可并行（一个管内容、一个管呈现），但都要等 M0 的数据模型定稿；M3 必须在 M2 的渲染层稳定之后，否则画布会随模板返工。",
    color=MUTED,
)

# ---------- 九、比赛视角 ----------
h1("09", "比赛视角")

h2("9.1　评委实际在看四件事")
bullet("**完成度**：端到端能不能走通，还是一堆割裂的 Demo。")
bullet("**可信度**：AI 说的东西有没有依据，会不会一眼假。")
bullet("**创新点**：和已有的简历工具、建站工具相比，新在哪。")
bullet("**可演示性**：现场 5 分钟会不会翻车。")

h2("9.2　五分钟演示脚本")
T(
    None,
    ["时间", "画面", "台词要点"],
    [
        ["0:00–0:40", "首页 + 一张对比图（现在的做法 vs 我们的做法）", "「应届生不缺模板，缺的是把经历说清楚」"],
        ["0:40–2:00", "上传一份真实简历，解析填充", "强调字段可改、错的会标黄，不静默错填"],
        ["2:00–3:10", "进入追问，回答 3 个问题，看文案生成", "强调每句话都能指回你的原话"],
        ["3:10–3:50", "一句话描述风格，生成令牌，切换模板", "「不用二十套模板，一句话就够」"],
        ["3:50–4:40", "画布拖动、改字号、加一个作品卡片", "所见即所得，导出不变形"],
        ["4:40–5:00", "生成分享链接，手机扫码打开；下载 PDF", "收尾：「一份内容，两种产出」"],
    ],
    [1.9, 8.1, 6.4],
    caption="演示脚本（按秒排练，不留自由发挥）",
)

h2("9.3　可以直接用的三句创新点表述")
bullet("**从「排版工具」到「内容合伙人」**：先帮用户挖掘经历，再谈呈现。")
bullet("**内容与呈现分离的双产出**：一份内容同时生成主页与简历 PDF，永远同步。")
bullet("**受约束的 AI 审美**：把「一句话描述风格」翻译成可校验的设计令牌，而不是抽卡式生图。")

h2("9.4　诚实边界（评委最反感「PPT 产品」）")
bullet("**真做**：解析、追问、文案、模板、画布、导出、分享——全部可现场操作。")
bullet("**模拟**：微信登录（资质原因）、自定义域名绑定（备案原因）、服务器购买入口。")
bullet("**二期**：多语言站、团队协作、招聘方视角的数据看板。")
para(
    "把「没做的」讲清楚，比假装做完更能拿分；评委见过太多演示时点不开的链接。",
    size=8.6,
    color=MUTED,
)

h2("9.5　常见扣分点")
bullet("现场网络不稳导致模型调用超时——必须准备离线回放。")
bullet("演示数据用的是真实姓名与手机号——必须脱敏。")
bullet("画布拖动掉帧或错位——这是最容易被记住的失败。")
bullet("把「用了大模型」当创新点——评委已经听了一百遍。")
bullet("功能列表很长但每条都浅——不如六个做透。")

# ---------- 十、风险 ----------
h1("10", "风险清单")

T(
    None,
    ["风险", "概率", "影响", "缓解"],
    [
        ["自由画布工作量失控", "高", "高", "锁定最小交互集；M3 之前不接任何新模块"],
        ["AI 编造经历或数字", "中", "极高", "事实只来自原话；数字必须用户确认；成文后事实核查"],
        ["简历解析错填", "高", "中", "低置信度标黄；解析结果强制用户过一遍"],
        ["演示环境翻车", "中", "高", "本地离线、种子数据、备用录屏"],
        ["模板不好看", "中", "高", "只做五套精品；真实内容压力测试"],
        ["智能体改坏已有功能", "高", "中", "契约先行；每条任务配冒烟测试；坏了先回滚"],
        ["导出与画布不一致", "中", "中", "同源渲染；截图 diff 校验"],
        ["范围蔓延（什么都想加）", "高", "高", "以第 03 章的功能表为唯一口径，新增需求一律进二期"],
    ],
    [5.0, 1.4, 1.4, 8.6],
    caption="风险与缓解（按影响排序）",
)

# ---------- 十一、给智能体的工程约束 ----------
h1("11", "交给 AI 智能体的工程约束")

para(
    "这个项目大概率由 DSH、码道这类编码智能体来实现。智能体擅长「按契约实现」，不擅长「在无边界的情况下自己定标准」——所以下面这些约束不是形式主义，是决定项目能不能收敛的关键。",
    after=3,
)

h2("11.1　五条硬约束")
bullet("**契约先行。** 先定数据模型、JSON Schema、接口清单，再让智能体写实现；改契约要单独提交、单独评审。")
bullet("**单命令启动。** pnpm dev 必须 30 秒内可演示；pnpm seed 必须幂等；任何需要手动配置三步以上的环节都算缺陷。")
bullet("**模块边界。** ai / editor / render / export 四个目录互不 import 内部实现，只能通过类型与接口通信。")
bullet("**视觉不由智能体自由发挥。** 所有颜色、字号、圆角集中在 theme 层；模板只能消费令牌，禁止硬编码色值。")
bullet("**每个任务附验收。** 至少能跑通三条 e2e 冒烟：解析→成文、换模板、拖动→导出。")

h2("11.2　任务切分建议")
T(
    None,
    ["任务", "交给谁", "原因"],
    [
        ["数据模型与 Prisma schema", "智能体", "有明确契约，可自检"],
        ["解析与抽取管线", "智能体", "输入输出可测，失败可重试"],
        ["模板骨架与渲染", "智能体（人定稿）", "结构可生成，审美必须人把关"],
        ["画布交互", "智能体 + 人", "代码可写，手感必须人试"],
        ["追问话术与文案策略", "人", "涉及判断、语气与分寸"],
        ["演示脚本与叙事", "人", "决定比赛得分，不可外包"],
    ],
    [6.2, 2.8, 7.4],
    caption="哪些交给智能体，哪些必须自己做",
)

h2("11.3　防翻车清单")
bullet("一次只给一个可验收的目标，不要说「把编辑器做完」。")
bullet("让它先写 schema 与接口，再写实现；顺序反了必然返工。")
bullet("禁止自由新增依赖；每个新依赖必须写一句理由。")
bullet("视觉相关改动必须附截图对比，否则不接受。")
bullet("上下文过长时先让它复述当前契约，再继续。")

# ---------- 附录 ----------
h1("12", "附录")

h2("12.1　术语")
T(
    None,
    ["术语", "含义"],
    [
        ["STAR", "情境（Situation）、任务（Task）、行动（Action）、结果（Result），经历叙事的四要素"],
        ["设计令牌", "把颜色、字体、圆角、间距等视觉决策抽成变量，供模板统一消费"],
        ["画布吸附", "拖动元素时自动对齐到网格或参考线，避免像素级手调"],
        ["noindex", "告诉搜索引擎不要收录该页面，用于隐私控制"],
        ["ICP 备案", "国内公网提供网站服务的行政备案，绑定自有域名时涉及"],
        ["幻觉", "模型生成看似合理但无事实依据的内容，本项目的头号风险"],
    ],
    [3.6, 12.8],
    caption="术语表",
)

h2("12.2　交付前检查清单")
checklist = [
    "断网状态下完整走通一遍主流程",
    "上传 10 份不同格式简历，无崩溃、无静默错填",
    "生成文案中不存在凭空数字",
    "拖动 100 次后内存无异常增长",
    "刷新页面后布局不丢失",
    "导出 PDF 与页面截图一致",
    "分享链接在手机端可正常打开",
    "空数据与超长文本均不破版",
    "数据库可一键重置并恢复演示数据",
    "全部演示数据已脱敏，不含真实个人信息",
]
for idx, item in enumerate(checklist):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(0.6)
    pf.first_line_indent = Cm(-0.6)
    pf.space_after = Pt(1.5)
    pf.line_spacing = 1.28
    if idx < len(checklist) - 1:
        pf.keep_with_next = True
    r = p.add_run("□　")
    set_font(r, BODY, 9.0, False, ACCENT)
    rich(p, item, 9.2)

h2("12.3　接下来先做三件事")
bullet("**定 schema。** 数据模型与页面 JSON 结构先落纸，后面所有模块都按它对齐；改一次 schema 的代价，改十次界面的代价都比不了。")
bullet("**做一份「黄金简历」样本。** 一份真实、格式混乱、内容偏薄的应届生简历，作为解析与文案的回归测试基准。")
bullet("**先写演示脚本，再写功能。** 五分钟怎么演，决定第一版做什么；反过来做，一定演不出来。")

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(18)
p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("— 文档结束 —")
set_font(r, BODY, 8.0, False, LIGHT)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "方案大纲_AI个人主页与作品集生成平台.docx")
doc.save(out)
print("saved:", out)
