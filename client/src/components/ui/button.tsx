import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-[#e8702a] text-white hover:bg-[#d2611f] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#e8702a]/20",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border hover:scale-[1.02]",
        outline:
          "border border-white/10 bg-white/[0.08] text-white hover:bg-white/15",
        secondary:
          "border border-white/10 bg-white/[0.08] text-white hover:bg-white/15",
        ghost: "border border-transparent text-white hover:bg-white/5",
      },
      size: {
        default: "min-h-9 px-6 py-2.5",
        sm: "min-h-8 px-4 text-xs",
        lg: "min-h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
