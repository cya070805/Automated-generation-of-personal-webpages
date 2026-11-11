# -*- coding: utf-8 -*-
"""生成《产品能力地图与技术方案》精简版 DOCX。"""
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
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

H_RULE = "D9DEE3"
H_ACCENT = "2E6E6B"
H_WARM = "B06A3C"
H_BG = "F4F6F7"
H_HDR = "EDF1F4"
H_WARNBG = "FBF3EC"
H_CODEBG = "F7F8F9"

USABLE = 16.4
TOTAL = 0


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
    for i, seg in enumerate(text.split("**")):
        if not seg:
            continue
        r = p.add_run(seg)
        set_font(r, name, size, bold=(i % 2 == 1) or bold_base, color=color)


def para(text, size=9.5, color=INK, before=0, after=3, line=1.42, keep=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    pf.keep_with_next = keep
    rich(p, text, size, color)
    return p


def bullet(text, size=9.5, color=INK, after=1.9, indent=0.55, mark="·"):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(indent)
    pf.first_line_indent = Cm(-indent)
    pf.space_after = Pt(after)
    pf.line_spacing = 1.35
    r = p.add_run(mark + " ")
    set_font(r, BODY, size, True, ACCENT)
    rich(p, text, size, color)
    return p


def add_pbdr(p, color=H_RULE, sz=6, space=6):
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    el = OxmlElement("w:bottom")
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


def h1(num, text):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(15)
    pf.space_after = Pt(7)
    pf.line_spacing = 1.15
    pf.keep_with_next = True
    r = p.add_run(num)
    set_font(r, HEAD, 10.5, True, ACCENT)
    r2 = p.add_run("  " + text)
    set_font(r2, HEAD, 14.5, True, NAVY)
    add_pbdr(p, H_RULE, 6, 7)
    return p


def h2(text, before=9, after=3):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = 1.2
    pf.keep_with_next = True
    r = p.add_run(text)
    set_font(r, HEAD, 10.6, True, NAVY)
    return p


def _cell_bg(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)


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
    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        for gc, w in zip(grid.findall(qn("w:gridCol")), widths):
            gc.set(qn("w:w"), str(int(w * 567)))
    for row in table.rows:
        trPr = row._tr.get_or_add_trPr()
        if trPr.find(qn("w:cantSplit")) is None:
            trPr.append(OxmlElement("w:cantSplit"))


def T(headers, rows, widths, caption=None, note=None):
    global TOTAL
    if caption:
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.space_before = Pt(8)
        pf.space_after = Pt(3)
        pf.keep_with_next = True
        TOTAL += 1
        r = p.add_run("表 %d" % TOTAL)
        set_font(r, HEAD, 8.3, True, ACCENT)
        r2 = p.add_run("　" + caption)
        set_font(r2, HEAD, 8.3, True, MUTED)

    table = doc.add_table(rows=0, cols=len(widths))
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
            p.paragraph_format.line_spacing = 1.32
            if val in ("P0", "P1"):
                r = p.add_run(val)
                set_font(r, HEAD, 8.2, True, ACCENT if val == "P0" else MUTED)
            else:
                rich(p, val, 8.3, INK)
                if i == 0:
                    for r in p.runs:
                        r.font.bold = True
                        r.font.color.rgb = NAVY
                        r.font.size = Pt(8.4)

    _table_setup(table, widths)
    if len(table.rows) <= 6:
        for row in table.rows[:-1]:
            for cell in row.cells:
                for p in cell.paragraphs:
                    p.paragraph_format.keep_with_next = True

    if note:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(5)
        r = p.add_run(note)
        set_font(r, BODY, 7.8, False, LIGHT, italic=True)
    return table


def callout(label, text, kind="accent"):
    bg = H_WARNBG if kind == "warn" else H_BG
    bar = H_WARM if kind == "warn" else H_ACCENT
    t = doc.add_table(rows=1, cols=1)
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
    set_font(sp.add_run(""), BODY, 4)


def code_line(text):
    t = doc.add_table(rows=1, cols=1)
    cell = t.cell(0, 0)
    cell.width = Cm(USABLE)
    _cell_bg(cell, H_CODEBG)
    _cell_border(cell, "C9D1D8", 12, "left")
    _cell_margins(cell, 90, 90, 140, 110)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(text)
    set_font(r, MONO, 8.0, False, RGBColor(0x2A, 0x33, 0x3D))
    _table_setup(t, [USABLE])
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(2)
    sp.paragraph_format.line_spacing = 1.0
    set_font(sp.add_run(""), BODY, 4)


def code_block(lines):
    t = doc.add_table(rows=1, cols=1)
    cell = t.cell(0, 0)
    cell.width = Cm(USABLE)
    _cell_bg(cell, H_CODEBG)
    _cell_border(cell, "C9D1D8", 12, "left")
    _cell_margins(cell, 90, 90, 140, 110)
    first = True
    for ln in lines:
        p = cell.paragraphs[0] if first else cell.add_paragraph()
        first = False
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(ln if ln else " ")
        set_font(r, MONO, 7.8, False, RGBColor(0x2A, 0x33, 0x3D))
    _table_setup(t, [USABLE])
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(2)
    sp.paragraph_format.line_spacing = 1.0
    set_font(sp.add_run(""), BODY, 4)
doc = Document()
sec = doc.sections[0]
sec.page_width = Cm(21.0)
sec.page_height = Cm(29.7)
sec.top_margin = Cm(1.95)
sec.bottom_margin = Cm(1.95)
sec.left_margin = Cm(2.3)
sec.right_margin = Cm(2.3)
sec.footer_distance = Cm(1.1)
sec.different_first_page_header_footer = False

normal = doc.styles["Normal"]
normal.font.name = BODY
normal.font.size = Pt(9.5)
normal.font.color.rgb = INK
normal.element.rPr.rFonts.set(qn("w:eastAsia"), BODY)
normal.paragraph_format.line_spacing = 1.45
normal.paragraph_format.space_after = Pt(4)

doc.core_properties.title = "产品能力地图与技术方案"
doc.core_properties.subject = "AI 个人主页与作品集生成平台"
doc.core_properties.author = "项目组"

footer_p = sec.footer.paragraphs[0]
footer_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r = footer_p.add_run("AI 个人主页与作品集生成平台 · 产品能力与技术方案    ")
set_font(r, BODY, 7.6, False, LIGHT)
run = footer_p.add_run()
set_font(run, BODY, 7.6, False, MUTED)
f1 = OxmlElement("w:fldChar"); f1.set(qn("w:fldCharType"), "begin")
it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = " PAGE "
f2 = OxmlElement("w:fldChar"); f2.set(qn("w:fldCharType"), "separate")
tn = OxmlElement("w:t"); tn.text = "1"
f3 = OxmlElement("w:fldChar"); f3.set(qn("w:fldCharType"), "end")
for el in (f1, it, f2, tn, f3):
    run._r.append(el)

# ---------- 报头 ----------
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(6)
p.paragraph_format.space_after = Pt(2)
r = p.add_run("产品文档　/　v2.0　·　2026.11")
set_font(r, HEAD, 8.2, True, ACCENT)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(2)
p.paragraph_format.line_spacing = 1.1
r = p.add_run("产品能力地图与技术方案")
set_font(r, HEAD, 24, True, NAVY)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(2)
r = p.add_run("AI 个人主页与作品集生成平台　·　面向应届生与实习生")
set_font(r, HEAD, 10, False, MUTED)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(3)
r = p.add_run("产品形态：网页应用，浏览器打开即用　·　模型能力由用户自带 API Key 接入　·　产物可平台托管，也可打包自托管")
set_font(r, BODY, 8.7, False, LIGHT)

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(2)
p.paragraph_format.space_after = Pt(2)
p.paragraph_format.right_indent = Cm(13.6)
add_pbdr(p, H_ACCENT, 14, 2)

# ---------- 01 ----------
h1("01", "产品能力地图")

para(
    "一句话：不用会建站、不用会排版，也不用自己想清楚经历怎么写——**一次对话把经历问清楚**，生成一个可编辑、可发布、也能打包带走的主页。",
    after=5,
)

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(2)
p.paragraph_format.space_after = Pt(4)
r = p.add_run("问卷或旧简历　→　AI 追问　→　文案确认　→　基底与配方　→　画布微调　→　平台发布 ／ 导出部署包")
set_font(r, HEAD, 9.4, True, NAVY)

T(
    ["模块", "用户可见的能力", "优先级"],
    [
        ["M0 模型接入", "在设置里填自己的 API Key（DeepSeek / 通义 / 智谱 / Kimi / OpenAI）；点一下就能测通；没填也能走模板模式", "P0"],
        ["M1 信息采集", "分步问卷（可跳、可回改）；上传 PDF / Word 旧简历自动解析填充，逐字段可改", "P0"],
        ["M2 对话式追问", "按 STAR 找缺口，一次只问一个问题；可跳过；对模糊描述追问数字与角色", "P0"],
        ["M3 文案生成", "简介、教育、实习、项目、技能、作品介绍；每段给两版；标出「哪句来自你的原话」", "P0"],
        ["M4 主页生成", "九个模块自由组合：简介、头像、联系方式、教育、实习、项目、作品卡片、技能标签、简历下载", "P0"],
        ["M5 基底与配方", "六套基底定气质；每个槽位 3–5 种「讲法」可换；AI 按内容推荐并给理由", "P0"],
        ["M6 可视化编辑", "双模式：快速模式换配方（原子块）+ 自由模式拆元素；字号 / 颜色 / 图层可调", "P0"],
        ["M7 平台发布", "发布到平台子域名，得到分享链接；可选访问密码、不收录索引；简历 PDF 下载", "P0"],
        ["M8 导出与自托管", "导出静态包或动态站部署包（Docker 一键起），用户自备服务器与域名", "P0"],
        ["M9 AI 持续辅助", "按岗位 JD 定制、中英互译、润色、补全作品描述", "P1"],
    ],
    [3.3, 10.3, 2.8],
    caption="十个模块，九个 P0",
    note="本期不含账号与登录（见 1.4）；服务器、域名、证书一律由用户自理，平台只交付可部署的产物。",
)

h2("1.2　模型接入：用户自带 Key")
bullet("**为什么自带**：推理费用由用户自己承担，平台不代付、不转售额度；用户可以直接用已有的账号或公司额度。")
bullet("**怎么配**：从预设里选一家（DeepSeek / 通义千问 / 智谱 / Kimi / OpenAI），或填自定义 baseURL + 模型名，点「测试连接」验证后保存。")
bullet("**存在哪**：只存浏览器本地，不上传、不入库；调用经同源转发，Key 只在请求头过一遍，不写日志、不落盘。")
bullet("**没有 Key 也能用**：自动切到「模板模式」，不调模型，用问卷 + 结构化填空走完流程，照样生成主页与 PDF。")
para(
    "提示：简历内容会发送给用户自己选择的模型厂商，首次配置时明确告知。",
    size=8.6,
    color=MUTED,
    after=3,
)

h2("1.3　两种交付形态")
para(
    "同一份内容，两种拿走方式：想省事就留在平台上拿链接，想完全掌控就打包带走自己上线。",
    after=3,
    keep=True,
)

T(
    ["对比项", "A　平台托管", "B　自托管部署包"],
    [
        ["用户拿到", "一条分享链接", "一个可部署的站点包（zip 或镜像）"],
        ["跑在哪", "平台服务器", "用户自己的服务器或虚拟主机"],
        ["域名与证书", "平台子域名", "用户自己的域名与证书"],
        ["改内容", "回平台编辑器改，即时生效", "包内后台改，或重新导出覆盖"],
        ["额外能力", "—", "动态站：Node 运行时，可接表单、访问统计、自定义接口"],
        ["适合谁", "投简历、发给 HR / 内推人", "长期个人站、要完全掌控、内网展示"],
        ["运维责任", "平台", "用户（平台只提供部署说明与一键脚本）"],
    ],
    [2.6, 6.4, 7.4],
    caption="A / B 两种产出",
    note="平台不提供服务器、不代管域名、不签发证书——这一条写进产品说明，避免用户预期错位。",
)

h2("1.4　不做账号之后，怎么保证「能回来改」")
bullet("**打开即用，无注册。** 编辑中的数据存在浏览器本地（IndexedDB），刷新不丢。")
bullet("**一条编辑链接就是身份。** 首次生成后给一条含随机密钥的链接，提示用户自己收藏。")
bullet("**支持导出 / 导入项目文件**（.zip），换设备、换浏览器都能接着改。")
bullet("**不想公开就不发布**，只导出；平台托管的分享页仍可加访问密码。")
callout(
    "代价说清楚",
    "编辑链接丢了就找不回——这是省掉账号体系的必然成本，必须在生成成功的第一屏提示用户保存。",
    kind="warn",
)

# ---------- 02 基底与原语 ----------
h1("02", "基底、原语与配方")

para(
    "模板解决不了「像我」，组件市场解决不了「统一」。中间那一层是：**基底给气质，原语给质感，配方给讲法**。",
    after=5,
    keep=True,
)

T(
    ["层", "是什么", "决定什么", "数量"],
    [
        ["基底 Base", "一套设计令牌 + 一种排版节奏", "整页气质：字体对、色板、圆角、密度、动效语气", "6 套"],
        ["原语 Primitive", "一个动效或材质能力，没有业务含义", "局部质感：滚动、倾斜、颗粒、光效", "12 个"],
        ["配方 Recipe", "一个槽位的讲法：用哪些原语、怎么摆、收什么内容", "这一屏的结构与节奏", "30–40 个"],
    ],
    [2.8, 6.8, 5.2, 1.6],
    caption="三层结构：谁决定什么",
)

h2("2.2　十二个原语")
para(
    "所有「炫酷组件」拆到底，都是这十二件事的组合。**要拆到原语，而不是拆到某个库的某个卡片**——这是工作量与版权的分水岭。",
    after=3,
)
T(
    ["原语", "能组合出什么"],
    [
        ["渐变 / 网格底", "hero 背景、分区底色"],
        ["噪点 / 颗粒", "胶片感、纸质感"],
        ["遮罩 / 裁切", "异形图、文字镂空"],
        ["描边 / 贴纸", "手绘、卡通"],
        ["玻璃 / 模糊", "卡片、导航条"],
        ["滚动驱动", "长页叙事、时间线、进度提示"],
        ["光标跟随 / 磁吸", "按钮、卡片的交互反馈"],
        ["倾斜 / 视差", "作品卡、头像"],
        ["打字机 / 文字拆分", "标题动画"],
        ["粒子 / 流体", "背景、加载态"],
        ["边框光效 / 扫描线", "科技感卡片"],
        ["微型图表", "技能条、数字胶囊"],
    ],
    [4.0, 12.4],
    caption="十二个原语",
    note="12 份代码 × 参数 × 基底 = 表面上几百种效果，实际只有 12 份要维护。",
)

h2("2.3　六套基底")
para(
    "基底不是模板：它只给令牌和排版节奏，不给固定版式。同一套基底换不同配方，页面结构可以完全不同。",
    after=3,
    keep=True,
)
T(
    ["基底", "状态", "适合谁", "视觉特征"],
    [
        ["Paper 极简", "已上线", "通用，投什么岗都不出错", "白纸黑字、字号阶梯、细线分层"],
        ["Terminal 终端", "已上线", "计算机、算法、后端", "等宽字体、暗底、扫描线"],
        ["Editorial 杂志", "备选", "文字多、人文社科", "大标题、窄栏宽、引文块"],
        ["Gallery 画廊", "备选", "有图、设计、摄影", "大图、少字、横向滚动"],
        ["Studio 等距 3D", "备选", "有作品、想张扬一点", "等距插画、轻动效"],
        ["Bento 网格", "新增", "模块多、产品与工程岗", "大小不一的格子、中等圆角"],
    ],
    [3.0, 2.2, 5.2, 6.0],
    caption="六套基底与它们的适用面",
    note="前两套已在代码里跑通（src/lib/templates）；后四套按同一套令牌接口补齐即可。",
)

h2("2.4　配方是数据，不是代码")
para(
    "一条配方 = 槽位 + 原语组合 + 布局参数 + 内容契约。写成 JSON，所以模型能生成、人能验收、换基底能自动变样。",
    after=3,
)
code_block(
    [
        "{",
        '  "id": "project.gallery-horizontal",',
        '  "name": "横向画廊",',
        '  "slot": "projects",',
        '  "requires": { "images": ">=2" },',
        '  "compatible": ["gallery", "editorial"],',
        '  "motionCost": "medium",',
        '  "primitives": ["tilt", "scroll-horizontal", "mask"],',
        '  "slots": { "title": "text", "items": "media[]" }',
        "}",
    ]
)
T(
    ["来源", "做法", "什么时候用"],
    [
        ["人工种子", "设计师先做 8–10 个，作为标准答案定调", "第一天就要有"],
        ["反向拆解", "拆开源组件的**行为规格**，用自有原语重写", "前期主力"],
        ["AI 生成候选", "给原语清单 + 槽位约束 + 真实内容，模型出 JSON，人工验收后入库", "中期规模化"],
        ["用户另存", "自由模式搭好后存为「我的配方」", "后期，需审核"],
    ],
    [3.2, 9.4, 3.8],
    caption="配方从哪来",
)

h2("2.5　用户实际在做什么")
bullet("**AI 直接给三个成品**：文案确认后，按内容结构推 3 个「基底 + 配方」组合，用他自己的内容渲染成可滚动的整页，他只需要点一个。")
bullet("**左栏是槽位，不是组件库**：Hero / 关于 / 经历 / 项目 / 技能 / 联系，每一屏一个「换一种讲法」。")
bullet("**右栏四个滑杆**：动效强度、密度、圆角、字体气质，外加一个强调色——改的是令牌，所有组件同步变。")
bullet("**画布直接改**：文字点开就改；同一屏内元素可拖；配方是原子块，拆不开。")
bullet("**发布或导出**：平台链接 / 自托管包，与第 1.3 节一致。")
T(
    ["力度", "用户做什么", "改变什么", "占比"],
    [
        ["1", "换基底（整页气质）", "全局令牌", "约 60%"],
        ["2", "换某一屏的配方", "结构", "约 25%"],
        ["3", "拉滑杆", "细节（动效 / 密度 / 圆角 / 色）", "约 10%"],
        ["4", "直接拖元素、改文案", "像素", "约 5%"],
    ],
    [1.4, 6.6, 6.6, 1.8],
    caption="四档微调，任何一档都不丢内容、不破版",
)

h2("2.6　怎么找，不喜欢怎么办")
para("入口按 90 / 9 / 1 分布——**默认永远是最优解，主动找只是备份**。", after=3)
T(
    ["入口", "占比", "交互"],
    [
        ["默认（AI 已经选好）", "~90%", "打开就是一个配好的页面，不需要「找」"],
        ["点「换一种讲法」", "~9%", "只给这一屏 3–5 个候选，全部用他的内容渲染，秒出"],
        ["全部讲法面板", "~1%", "按功能 / 动效筛，默认折叠在二级菜单，不做首页市场"],
    ],
    [4.6, 1.6, 10.2],
    caption="三个入口",
)
T(
    ["", "抽卡", "翻页"],
    [
        ["确定性", "每次都不一样", "给定一组，顺序固定"],
        ["可回退", "回不去", "能往回翻"],
        ["可比较", "只能凭记忆", "并排看 2–3 个"],
        ["心理", "「再抽一次说不定更好」", "「看完这 5 个挑一个」"],
    ],
    [2.6, 6.9, 6.9],
    caption="换，不是重新抽",
    note="「都不喜欢」= 换一批方向（预先算好、缓存住），不是现场重新生成同一个。",
)

h2("2.7　治理：不做会烂掉")
T(
    ["机制", "做法"],
    [
        ["版本", "配方带 id@2；已发布的页面锁版本，升级不破坏老页面"],
        ["兼容", "compatible 声明；不兼容的基底里根本不出现——240 次验收压到约 80 次"],
        ["前置", "requires.images >= 2；不满足就灰掉并说明「需要 2 张以上图片」，而不是选完看到空白"],
        ["降级", "1 张图时画廊退化成单图卡；0 段经历时时间线退化成「待补充」"],
        ["退役", "埋点看哪个配方被换掉最多，下线或重做"],
        ["压测", "每个配方必须过：超长标题 / 0 图 / 9 图 / 空段落 / 英文长单词"],
    ],
    [2.2, 14.2],
    caption="配方治理六条",
)

h2("2.8　来源与许可")
para(
    "反向拆解解决的是**代码许可**，不解决**视觉版权**。所以只拆「行为」，不复刻「招牌视觉」。",
    after=3,
)
T(
    ["来源", "许可", "怎么用"],
    [
        ["shadcn/ui", "MIT", "直接用，保留版权声明（NOTICE）"],
        ["React Bits", "MIT + Commons Clause", "少量用或重写到原语层；不要把「内置 N 个组件」当卖点"],
        ["23rd", "开源 shadcn registry", "逐个确认组件自带 license 后使用"],
        ["Koboyo 图标", "免费商用，但禁止让用户挑选 / 下载", "只做模板预置装饰，不做图标选择器"],
        ["inspora.design", "非代码，是灵感站", "只做审美参考，不进入产品资产"],
    ],
    [3.4, 4.4, 8.6],
    caption="五个来源的处置",
)
para(
    "**Clean room 五条**：先写行为规格、不写长相；隔一天再实现；换实现路径与视觉参数；不复制代码、不逐行翻译；内部留一份「来源与差异」记录。",
    size=8.8,
    before=4,
    after=3,
)

h2("2.9　这套东西的上限")
para(
    "**能达到**：同一份内容 5 种讲法；6 套基底是「不同家族」而不是「不同皮肤」；1–2 个原语带来的局部惊喜。",
    after=2,
)
para(
    "**到不了**：真正的一人一设计；完全自由布局（与原子块矛盾）；复杂 3D 与长页叙事（还导不出 PDF）；品牌级定制视觉。",
    after=3,
)
callout(
    "公式",
    "个性化上限 ≈ 内容具体度 × 基底区分度 × 配方数量 × 参数自由度。其中**内容权重最高**——两个内容一样的人，怎么排都像。所以 AI 追问才是护城河，这套系统只是放大器。",
)

# ---------- 03 ----------
h1("03", "技术方案")

h2("3.1　分层", before=6)
T(
    ["层", "放什么"],
    [
        ["接入层", "页面路由（编辑态 / 只读态 / 分享页 / 包内后台）+ API"],
        ["领域层", "project（项目与编辑密钥）、resume（内容）、page（呈现）、theme（风格）、export（导出）"],
        ["能力层", "ai（解析 / 抽取 / 追问 / 生成 / 核查）、llm（模型网关）、recipes（配方库与选型）、render（渲染）、pack（打包）"],
        ["数据层", "Prisma + SQLite（本地）/ Postgres；文件走本地磁盘；API Key 只在前端，不入库"],
        ["约束", "render 不读数据库；模板只消费设计令牌；编辑态、托管页、导出包共用同一套渲染组件"],
    ],
    [2.4, 14.0],
    caption="五层与一条硬约束",
)

h2("3.2　选型")
T(
    ["层", "选型", "理由"],
    [
        ["应用框架", "Next.js 15（App Router）+ TypeScript", "一个进程同时扛页面与 API；standalone 构建可直接产出部署包"],
        ["样式", "Tailwind CSS + CSS 变量", "设计令牌落地为变量，换风格 = 换一组变量"],
        ["组件", "shadcn/ui", "源码可控、可改样式，不引入黑盒"],
        ["画布交互", "dnd-kit + 自研拖拽手柄", "排序与碰撞交给库，自由定位自己写更可控"],
        ["状态", "Zustand + 命令模式", "撤销 / 重做走命令栈，不用状态快照"],
        ["数据", "SQLite（本地）/ Postgres + Prisma", "本地零依赖；schema 即文档"],
        ["AI 接入", "OpenAI 兼容协议 + 同源转发（/api/llm）", "一套代码适配五家模型；Key 只在前端与请求头，不入库"],
        ["导出", "Playwright（PDF）+ Next standalone / export（站点包）", "PDF 与页面同源渲染，天然一致"],
        ["部署", "Docker Compose", "一条命令起全套，换机器也能跑"],
    ],
    [2.8, 5.6, 8.0],
    caption="技术选型",
)

h2("3.3　数据模型")
T(
    ["表", "关键字段", "作用"],
    [
        ["projects", "id, title, edit_token, created_at", "匿名项目，编辑链接的钥匙"],
        ["resumes", "id, project_id, status, target_role", "一份简历的容器"],
        ["resume_blocks", "id, resume_id, type, content, source_quote, confidence", "内容块，带溯源与置信度"],
        ["chat_sessions", "id, resume_id, stage, gap_list", "一次追问会话"],
        ["messages", "id, session_id, role, content, asked_field", "对话记录"],
        ["pages", "id, resume_id, base_id, recipe_map, theme, layout", "呈现层：记基底与各槽位的配方引用"],
        ["page_versions", "id, page_id, snapshot", "版本与回滚"],
        ["assets", "id, project_id, kind, path", "头像与作品图"],
        ["shares", "id, page_id, slug, password_hash, noindex", "平台托管的分享页"],
        ["exports", "id, page_id, mode, version, path", "静态包 / 动态包记录"],
    ],
    [3.2, 8.0, 5.2],
    caption="十张表（仅列关键字段）",
    note="没有 users 表：身份就是 projects.edit_token；没有 keys 表：Key 只在浏览器本地；配方是仓库里的 JSON（带版本），不入库。",
)

h2("3.4　AI 管线")
para(
    "**解析**（文件 → 文本 + 版面块）　→　**抽取**（JSON Schema 约束，失败重试）　→　**缺口分析**（缺数字 / 角色 / 结果 / 时间）　→　**追问**（一次一问，记住说过的）　→　**成文与核查**（逐句标注来源）　→　**选型**（内容 → 基底 + 配方，3 个带理由的候选）。",
    after=4,
)

h2("3.5　编辑器与渲染")
bullet("数据模型 **Page → Section → Element**，绝对定位＋8pt 网格＋12 列参考线。")
bullet("**双模式**：快速模式下配方是原子块（可换、可移，拆不开）；自由模式拆成元素可任意拖，但放弃配方升级能力。")
bullet("元素只存引用（blockId / assetId），**不存文字副本**——这是「改一处、处处同步」的基础。")
bullet("编辑态、托管页、导出包**共用同一套组件**，所以「编辑所见 = 发布所得 = 导出所得」。")
bullet("响应式用「桌面定稿 + 断点缩放规则」，不做三端分别设计。")
para(
    "**迁移**：现在的两套模板是「整页组件」，下一步降级成基底的默认配方组合——模板接口（SiteData）不变，换的是数据源。",
    size=8.8,
    color=MUTED,
    after=3,
)

h2("3.6　模型接入层怎么实现")
bullet("**预设**：五家 OpenAI 兼容服务，各自带 baseURL 与推荐模型；也允许自定义地址与模型名。")
bullet("**转发**：所有请求走同源 /api/llm 转发——避开浏览器 CORS，也让 Key 不暴露给第三方脚本；转发层无状态，不记录请求体。")
bullet("**错误映射**：401 / 403 → 「Key 无效或额度不足」；429 → 退避重试一次；超时 60s → 建议换模型；连续失败两次 → 提示切模板模式。")
bullet("**部署包里**：同样有 Key 设置页；也可用环境变量 LLM_API_KEY 预置，适合内网或团队共用一台机器。")
bullet("**不做**：代充、转售额度、服务端托管用户的 Key。")

h2("3.7　两种产出怎么落地")
para(
    "**A　平台托管。** 发布时写一条 shares 记录，路由 /p/[slug] 服务端渲染，改内容即时生效；访问密码与 noindex 是可选开关，不影响正常分享。",
    after=4,
)

para("**B　自托管部署包。**", before=5, after=2)
bullet("**静态包**：next export 的产物，丢到任意静态托管或 Nginx 即可（纯展示，不含 AI 调用）。")
bullet("**动态包**：Next standalone 构建 + Node 18 + 内容数据（SQLite / JSON），附 Dockerfile 与 compose，docker compose up -d 一条命令起。")
bullet("包内附部署说明（Nginx 反代示例、证书自行申请），平台不代办。")
code_line("site/   server.js   public/   content/   Dockerfile   docker-compose.yml   README.md")
bullet("版本与升级：包内带 manifest（版本号、schema 版本），支持「重新导出 → 覆盖部署」。")

para(
    "**一致性**：PDF 用无头浏览器打印同一路由，不做二次排版；站点包与平台页来自同一份 layout JSON 与同一套组件。验收标准：导出 PDF 与页面截图的像素差异 < 3%。",
    before=5,
    after=4,
)

h2("3.8　实施顺序")
bullet("**一期**：骨架 + 数据模型 + 模型接入（Key 设置页与 /api/llm 转发）。")
bullet("**二期**：基底与原语——六套基底（先补齐 Editorial / Gallery）+ 十二个原语 + 渲染层。")
bullet("**三期**：内容闭环（解析 → 追问 → 文案）+ 配方库首批 20 个（每槽位 3–5 个）。")
bullet("**四期**：编辑器双模式 + 两种导出（托管发布 / 部署包）。")

callout(
    "本期不做",
    "账号与登录（用编辑链接 + 本地草稿替代）·　Key 代充与额度转售　·　配方市场与用户投稿　·　服务器售卖与域名代管　·　支付与订阅。",
    kind="warn",
)

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(10)
p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("— 文档结束 —")
set_font(r, BODY, 8.0, False, LIGHT)

# 去掉文末的空段（否则会多出一整页）
while doc.paragraphs and not doc.paragraphs[-1].text.strip():
    el = doc.paragraphs[-1]._element
    el.getparent().remove(el)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "产品能力地图与技术方案.docx")
doc.save(out)
print("saved:", out)
