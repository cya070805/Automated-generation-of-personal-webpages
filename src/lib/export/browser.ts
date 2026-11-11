import { chromium, type Browser } from "playwright-core";

/**
 * 导出用的无头浏览器。
 * 用系统里已经装好的 Chrome，不额外下载一份 Chromium。
 * PDF 与整站包都从同一个 /preview 路由取，所以「页面 = 导出」。
 */

let cached: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (cached && cached.isConnected()) return cached;

  try {
    cached = await chromium.launch({
      channel: "chrome",
      args: ["--no-sandbox", "--font-render-hinting=none"],
    });
  } catch {
    cached = await chromium.launch({
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      args: ["--no-sandbox", "--font-render-hinting=none"],
    });
  }

  return cached;
}

export async function renderPdf(origin: string, token: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${origin}/preview/${token}?print=1&bare=1`, {
      waitUntil: "load",
      timeout: 30000,
    });
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(400);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

/** 把渲染好的页面连同样式压成一张自包含的 HTML */
export async function renderStandaloneHtml(
  origin: string,
  token: string,
): Promise<string> {
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${origin}/preview/${token}?bare=1`, {
      waitUntil: "load",
      timeout: 30000,
    });
    await page.waitForTimeout(600);

    return await page.evaluate(() => {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;

      clone
        .querySelectorAll(
          "script, noscript, link[rel=stylesheet], link[rel=preload], link[rel=icon]",
        )
        .forEach((node) => node.remove());

      const css: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) css.push(rule.cssText);
        } catch {
          // 跨域样式表读不到，跳过
        }
      }

      const head = clone.querySelector("head");
      if (head) {
        const style = document.createElement("style");
        style.textContent = css.join("\n");
        head.appendChild(style);
      }

      return `<!doctype html>\n${clone.outerHTML}`;
    });
  } finally {
    await page.close();
  }
}
