import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

/** 上传旧简历：PDF / Word / 纯文本 → 纯文本 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "需要 multipart/form-data" } },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "没有收到文件" } },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: { code: "TOO_LARGE", message: "文件超过 8MB" } },
      { status: 413 },
    );
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    let text = "";

    if (name.endsWith(".pdf")) {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    } else if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (/\.(txt|md)$/.test(name)) {
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".doc")) {
      return NextResponse.json(
        { error: { code: "UNSUPPORTED", message: "旧版 .doc 请另存为 .docx 再传" } },
        { status: 415 },
      );
    } else {
      return NextResponse.json(
        { error: { code: "UNSUPPORTED", message: "只支持 PDF / DOCX / TXT" } },
        { status: 415 },
      );
    }

    text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    if (text.length < 20) {
      return NextResponse.json(
        { error: { code: "EMPTY", message: "没读出文字，可能是扫描件或图片" } },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text: text.slice(0, 20_000),
      chars: text.length,
      filename: file.name,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "PARSE_FAILED", message: "这个文件没解析成功，换个格式试试" } },
      { status: 422 },
    );
  }
}
