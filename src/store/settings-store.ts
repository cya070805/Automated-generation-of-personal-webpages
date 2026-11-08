"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_PROVIDER, getProvider, type ProviderId } from "@/lib/llm/providers";

export type ModelMode = "llm" | "template";

type SettingsState = {
  providerId: ProviderId;
  baseUrl: string;
  model: string;
  apiKey: string;
  mode: ModelMode;
  consent: boolean;
  hydrated: boolean;

  setProvider: (id: ProviderId) => void;
  setBaseUrl: (url: string) => void;
  setModel: (model: string) => void;
  setApiKey: (key: string) => void;
  setMode: (mode: ModelMode) => void;
  setConsent: (consent: boolean) => void;
  reset: () => void;
  markHydrated: () => void;
};

const preset = getProvider(DEFAULT_PROVIDER);

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      providerId: DEFAULT_PROVIDER,
      baseUrl: preset.baseUrl,
      model: preset.models[0],
      apiKey: "",
      mode: "llm",
      consent: false,
      hydrated: false,

      setProvider: (id) => {
        const next = getProvider(id);
        set({ providerId: id, baseUrl: next.baseUrl, model: next.models[0] });
      },
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setModel: (model) => set({ model }),
      setApiKey: (apiKey) => set({ apiKey }),
      setMode: (mode) => set({ mode }),
      setConsent: (consent) => set({ consent }),
      reset: () =>
        set({
          providerId: DEFAULT_PROVIDER,
          baseUrl: preset.baseUrl,
          model: preset.models[0],
          apiKey: "",
          mode: "llm",
          consent: false,
        }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "lvdao.settings.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        providerId: state.providerId,
        baseUrl: state.baseUrl,
        model: state.model,
        apiKey: state.apiKey,
        mode: state.mode,
        consent: state.consent,
      }),
    },
  ),
);

/** 只在浏览器端可用：取当前配置的 key，不订阅渲染。 */
export function readSettings() {
  return useSettings.getState();
}
