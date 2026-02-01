import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
  hiddenOnMobile?: boolean;
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  cardClassName?: string;
  onRowClick?: (item: T) => void;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "No data available",
  className,
  tableClassName,
  cardClassName,
  onRowClick,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn("text-center py-8 text-text-muted", className)}>
        {emptyMessage}
      </div>
    );
  }

  // Desktop: Table view
  const TableView = () => (
    <div className={cn("overflow-x-auto hidden md:block", tableClassName)}>
      <table className="w-full text-sm">
        <thead className="bg-content-bg border-b border-border">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left font-medium text-text-muted",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                "bg-card-bg hover:bg-content-bg/50 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(item)}-${column.key}`}
                  className={cn("px-4 py-3 text-text-primary", column.className)}
                >
                  {column.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile: Card view
  const CardView = () => (
    <div className="md:hidden space-y-3">
      {data.map((item) => {
        const visibleColumns = columns.filter((c) => !c.hiddenOnMobile);
        const primaryColumn = visibleColumns[0];
        const secondaryColumns = visibleColumns.slice(1);

        return (
          <Card
            key={keyExtractor(item)}
            className={cn(
              "overflow-hidden",
              onRowClick && "cursor-pointer active:scale-[0.99] transition-transform",
              cardClassName
            )}
            onClick={() => onRowClick?.(item)}
          >
            {primaryColumn && (
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {primaryColumn.cell(item)}
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {secondaryColumns.map((column) => (
                  <div key={column.key} className="space-y-1">
                    <p className="text-xs text-text-muted">{column.header}</p>
                    <div className="text-sm text-text-primary">
                      {column.cell(item)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className={className}>
      <TableView />
      <CardView />
    </div>
  );
}

// Simple table variant without cards for when you just need responsive behavior
export interface SimpleTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const SimpleTable = React.forwardRef<HTMLTableElement, SimpleTableProps>(
  ({ className, children, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
SimpleTable.displayName = "SimpleTable";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border transition-colors hover:bg-content-bg/50 data-[state=selected]:bg-content-bg",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-text-muted [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";
