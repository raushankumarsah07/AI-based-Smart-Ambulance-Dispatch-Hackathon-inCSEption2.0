import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
  color?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "#06b6d4",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-4 rounded-xl border border-card-border bg-card p-5",
        "card-hover overflow-hidden"
      )}
    >
      {/* Left accent strip */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: color }}
      />

      {/* Icon */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {trend && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend === "up" ? "text-success" : "text-danger"
              )}
            >
              {trend === "up" ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-xs text-muted">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
