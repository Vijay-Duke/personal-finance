import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InsightQuoteProps {
  label?: string;
  quote: string;
  className?: string;
}

const InsightQuote = React.forwardRef<HTMLDivElement, InsightQuoteProps>(
  ({ label = "MINDFUL NOTE", quote, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mx-auto max-w-[540px] py-8 text-center", className)}
      >
        <span className="section-label">{label}</span>
        <p className="insight-quote mt-4">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    );
  }
);
InsightQuote.displayName = "InsightQuote";

export { InsightQuote };
