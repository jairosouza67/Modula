import { cn } from "@/lib/utils";
import type { StatusVariant } from "@/lib/mock/data";

const map: Record<StatusVariant, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        map[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
