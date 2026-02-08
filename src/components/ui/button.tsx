import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[var(--radius-lg)] text-[0.9375rem] font-medium",
    "transition-colors duration-[250ms]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "active:scale-[0.98]",
    "min-h-[44px]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary-500 text-white shadow-sm hover:bg-primary-600 active:bg-primary-700",
        destructive:
          "bg-danger text-white shadow-sm hover:opacity-90 active:opacity-80",
        outline:
          "border border-border bg-transparent text-text-primary hover:bg-bg-surface hover:border-border-strong",
        secondary:
          "bg-bg-surface text-text-primary hover:bg-border-subtle",
        ghost:
          "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
        link:
          "text-primary-500 underline-offset-4 hover:underline hover:text-primary-600 min-h-0",
        success:
          "bg-success text-white shadow-sm hover:opacity-90 active:opacity-80",
        warning:
          "bg-warning text-text-inverse shadow-sm hover:opacity-90 active:opacity-80",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 text-[0.8125rem] min-h-[36px]",
        lg: "h-[52px] px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-11 w-11 p-0",
        "icon-sm": "h-9 w-9 p-0 min-h-[36px]",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, loadingText, asChild, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'size'> & {
    label: string;
    size?: 'default' | 'sm' | 'lg';
  }
>(({ label, size = 'default', className, ...props }, ref) => {
  const sizeMap = {
    default: 'icon' as const,
    sm: 'icon-sm' as const,
    lg: 'icon-lg' as const,
  };

  return (
    <Button
      ref={ref}
      size={sizeMap[size]}
      className={className}
      aria-label={label}
      title={label}
      {...props}
    />
  );
});
IconButton.displayName = "IconButton";

export { Button, IconButton, buttonVariants };
