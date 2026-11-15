"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** 访问密码：一个输入框，通过就刷新，剩下的交给服务端 */
export function PasswordGate({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/share/${slug}/auth`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "密码不对");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "密码不对");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fafaf9] px-6">
      <form onSubmit={submit} className="w-full max-w-[360px]">
        <p className="text-[12.5px] text-[#a0a1a5]">受密码保护的主页</p>
        <h1 className="mt-2 text-[22px] tracking-[-0.01em] text-[#111214]">
          {name}
        </h1>
        <p className="mt-2 text-[13px] leading-[1.7] text-[#737579]">
          {"输入访问密码继续。没有密码可以找主页的主人要。"}
        </p>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
          placeholder="访问密码"
          className="mt-5 h-10 w-full rounded-lg border border-[#d5d5d1] px-3 text-[14px] focus:border-[#1d4ed8]/60 focus:outline-none"
        />

        {error && <p className="mt-2 text-[12.5px] text-[#b42318]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#111214] text-[14px] text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          进去
        </button>
      </form>
    </main>
  );
}
