import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-xl",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        primary:
          "bg-primary text-primary-foreground rounded-xl px-5 py-2.5 font-display font-semibold text-sm hover:bg-primary/85 transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]",
        "ghost-border":
          "bg-transparent border border-border text-foreground/80 rounded-xl px-5 py-2.5 font-display font-medium text-sm hover:bg-surface-1 hover:border-border/80 transition-all duration-200",
        glass:
          "glass text-foreground rounded-xl px-5 py-2.5 font-display font-medium text-sm hover:bg-white/5 transition-all duration-200",
        accent:
          "bg-accent text-accent-foreground rounded-xl px-5 py-2.5 font-display font-semibold text-sm hover:bg-accent/85 transition-all duration-200",
        danger:
          "bg-danger/10 text-danger border border-danger/20 rounded-xl px-5 py-2.5 font-display font-medium text-sm hover:bg-danger/20 transition-all duration-200",
        success:
          "bg-success/10 text-success border border-success/20 rounded-xl px-5 py-2.5 font-display font-medium text-sm hover:bg-success/20 transition-all duration-200",
        "mod-primary":
          "bg-[hsl(172_70%_42%)] text-white rounded-xl px-5 py-2.5 font-display font-semibold text-sm hover:bg-[hsl(172_70%_38%)] transition-all duration-200 shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_30px_rgba(20,184,166,0.4)]",
        "mod-ghost":
          "bg-transparent border border-[hsl(172_70%_42%/0.3)] text-[hsl(172_70%_55%)] rounded-xl px-5 py-2.5 font-display font-medium text-sm hover:bg-[hsl(172_70%_42%/0.1)] transition-all duration-200",
        "mod-soft":
          "bg-[hsl(172_60%_15%)] text-[hsl(172_70%_55%)] rounded-xl px-4 py-2 font-body font-medium text-xs hover:bg-[hsl(172_60%_18%)] transition-colors duration-150",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
