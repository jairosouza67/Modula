import { Layers } from "lucide-react";

export function MiniResumos({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {items.map((s) => (
        <div key={s.label} className="rounded-md bg-muted/40 px-2.5 py-1.5">
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
            {s.label}
          </div>
          <div className="text-sm font-medium">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
    </div>
  );
}

export function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-muted-foreground">
      <Layers className="h-8 w-8 mx-auto mb-2 opacity-20" />
      <div className="text-[11px] italic">{message}</div>
    </div>
  );
}
