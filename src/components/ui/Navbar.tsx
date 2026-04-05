"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dispatch", label: "Dispatch" },
  { href: "/analytics", label: "Analytics" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-card-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent transition-shadow group-hover:shadow-[0_0_12px_var(--accent-glow)]">
            <Activity className="h-5 w-5" />
          </div>
          <span className="gradient-text text-xl font-bold tracking-tight">
            SmartAmbSys
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
