import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
  {
    variants: {
      tone: {
        neutral: "border-line-strong bg-paper-deep text-muted",
        teal: "border-teal/25 bg-teal-soft text-teal",
        warm: "border-warm/25 bg-warm-soft text-warm",
        navy: "border-navy/20 bg-navy/5 text-navy",
        danger: "border-danger/25 bg-danger/5 text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
