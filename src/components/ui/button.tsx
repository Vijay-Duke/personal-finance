import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-sm font-medium",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Press animation
    "active:scale-[0.97]",
    // Minimum touch target
    "min-h-[44px]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white shadow-md hover:bg-primary-500 hover:shadow-lg active:bg-primary-700",
        destructive:
          "bg-danger text-white shadow-md hover:opacity-90 active:opacity-80",
        outline:
          "border border-border bg-card-bg text-text-primary shadow-sm hover:bg-bg-surface hover:border-primary-600/50",
        secondary:
          "bg-bg-surface text-text-primary shadow-sm hover:bg-border",
        ghost:
          "text-text-secondary hover:bg-bg-surface hover:text-text-primary",
        link:
          "text-primary-500 underline-offset-4 hover:underline hover:text-primary-400 min-h-0",
        success:
          "bg-success text-white shadow-md hover:opacity-90 active:opacity-80",
        warning:
          "bg-warning text-text-inverse shadow-md hover:opacity-90 active:opacity-80",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3 text-xs min-h-[36px]",
        lg: "h-12 px-8 text-base",
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
  ({ className, variant, size, loading, loadingText, children, disabled, ...props }, ref) => {
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

// Icon button with proper accessibility
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
