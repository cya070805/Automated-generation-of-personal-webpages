/**
 * 复制文本。
 *
 * HTTPS 下 `navigator.clipboard` 才有值；用 http://公网IP 直接访问时它是
 * undefined，调用会抛错。所以这里退回 textarea + execCommand 的老办法，
 * 保证在纯 HTTP 部署下「复制链接」也能用。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 被权限策略拦了，往下走兜底
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, area.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
