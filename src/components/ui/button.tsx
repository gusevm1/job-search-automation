import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:scale-[1.02] active:scale-[0.98] active:transition-[transform,colors,box-shadow] active:duration-75 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 motion-reduce:transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_8px_20px_-4px_hsl(var(--primary)/0.3),0_4px_8px_-2px_hsl(var(--primary)/0.15)] dark:hover:shadow-[0_10px_25px_-5px_hsl(var(--primary)/0.4),0_4px_10px_-2px_hsl(var(--primary)/0.2)] active:shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.2)] dark:active:shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.25)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 hover:shadow-[0_8px_20px_-4px_hsl(var(--destructive)/0.3),0_4px_8px_-2px_hsl(var(--destructive)/0.15)] dark:hover:shadow-[0_10px_25px_-5px_hsl(var(--destructive)/0.4),0_4px_10px_-2px_hsl(var(--destructive)/0.2)] active:shadow-[0_2px_8px_-2px_hsl(var(--destructive)/0.2)] dark:active:shadow-[0_2px_8px_-2px_hsl(var(--destructive)/0.25)]",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3),0_2px_6px_-1px_rgba(0,0,0,0.15)] active:shadow-xs hover:border-accent-foreground/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-[0_8px_20px_-4px_hsl(var(--secondary)/0.3),0_4px_8px_-2px_hsl(var(--secondary)/0.15)] dark:hover:shadow-[0_10px_25px_-5px_hsl(var(--secondary)/0.4),0_4px_10px_-2px_hsl(var(--secondary)/0.2)] active:shadow-[0_2px_8px_-2px_hsl(var(--secondary)/0.2)] dark:active:shadow-[0_2px_8px_-2px_hsl(var(--secondary)/0.25)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 active:bg-accent/80 dark:active:bg-accent/60",
        link: "text-primary underline-offset-4 hover:underline hover:scale-100 hover:text-primary/90 active:text-primary/80",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
