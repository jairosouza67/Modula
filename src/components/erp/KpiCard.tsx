import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  hintTone,
  topBar,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  hintTone?: "success" | "warning" | "danger" | "info" | "muted";
  topBar?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/60 p-3 relative overflow-hidden">
      {topBar && (
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: topBar }} />
      )}
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-medium leading-tight">{value}</div>
      {hint && (
        <div
          className={cn(
            "mt-0.5 text-[10px]",
            hintTone === "success" && "text-success",
            hintTone === "warning" && "text-warning",
            hintTone === "danger" && "text-danger",
            hintTone === "info" && "text-info",
            (!hintTone || hintTone === "muted") && "text-muted-foreground",
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
