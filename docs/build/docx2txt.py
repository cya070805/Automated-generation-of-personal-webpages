import zipfile, re, sys, html

path = sys.argv[1]
out = sys.argv[2]

with zipfile.ZipFile(path) as z:
    xml = z.read("word/document.xml").decode("utf-8")

# 段落切分
paras = re.findall(r"<w:p[ >].*?</w:p>", xml, re.S)
lines = []
for p in paras:
    texts = re.findall(r"<w:t[^>]*>(.*?)</w:t>", p, re.S)
    text = "".join(texts)
    text = html.unescape(text).strip()
    if not text:
        continue
    style = re.search(r'<w:pStyle w:val="([^"]+)"', p)
    prefix = ""
    if style:
        name = style.group(1)
        if "Heading1" in name:
            prefix = "# "
        elif "Heading2" in name:
            prefix = "## "
        elif "Heading3" in name:
            prefix = "### "
    lines.append(prefix + text)

with open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines))

print("paragraphs:", len(lines))
