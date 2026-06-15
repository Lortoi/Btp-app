import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-[#080d1a]",
  {
    variants: {
      variant: {
        default:
          "border-white/[0.08] bg-white/[0.08] text-white",
        secondary: "border-transparent bg-white/5 text-white/50",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-white/10 text-white/50",
        encours: "border-transparent bg-[#e8702a]/15 text-[#e8702a]",
        dispo: "border-transparent bg-green-500/15 text-green-400",
        planifie: "border-transparent bg-blue-500/15 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
