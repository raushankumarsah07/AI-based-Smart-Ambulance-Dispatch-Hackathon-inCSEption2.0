import { cn } from "@/lib/utils";

type BadgeVariant = "P1" | "P2" | "P3" | "P4" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  P1: "bg-red-500/15 text-red-400 border-red-500/30",
  P2: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  P3: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  P4: "bg-green-500/15 text-green-400 border-green-500/30",
  success: "bg-green-500/15 text-green-400 border-green-500/30",
  warning: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
  info: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

const sizeStyles: Record<"sm" | "md", string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
};

export default function Badge({ variant, children, size = "md" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide",
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      {children}
    </span>
  );
}
