import type { Metadata } from "next";
import { StartWizard } from "@/components/start/start-wizard";

export const metadata: Metadata = {
  title: "开始制作",
};

export default function StartPage() {
  return <StartWizard />;
}
