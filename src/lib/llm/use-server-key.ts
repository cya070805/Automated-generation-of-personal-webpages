"use client";

import { useEffect, useState } from "react";

let cached: boolean | null = null;
let pending: Promise<boolean> | null = null;

function load(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  pending ??= fetch("/api/llm/config")
    .then((res) => res.json())
    .then((data) => {
      cached = Boolean(data?.hasServerKey);
      return cached;
    })
    .catch(() => false);
  return pending;
}

/** 服务端是否通过环境变量预置了 Key（部署包 / 内网共用场景） */
export function useServerKey() {
  const [has, setHas] = useState(cached ?? false);

  useEffect(() => {
    let alive = true;
    load().then((value) => {
      if (alive) setHas(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return has;
}
