import { cn } from "@/lib/utils";

export function ErpCard({
  title,
  action,
  children,
  className,
  id,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={cn("rounded-xl border border-border/60 p-4 min-w-0", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <div className="text-xs font-medium">{title}</div>}
          {action}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
