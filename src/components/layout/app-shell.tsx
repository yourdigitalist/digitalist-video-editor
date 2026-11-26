"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, FolderKanban, LayoutDashboard, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/brands", label: "Brands", icon: FolderKanban },
  { href: "/videos", label: "Videos", icon: Clapperboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,117,81,0.16),transparent_65%)] blur-2xl" />
        <div className="absolute right-0 top-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(139,124,246,0.14),transparent_65%)] blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <header className="relative z-20 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_80%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-[#1a1410] shadow-[0_0_24px_rgba(255,117,81,0.35)]">
                <Clapperboard className="h-4.5 w-4.5" />
              </span>
              <div className="leading-tight">
                <div className="font-[family-name:var(--font-display)] text-lg tracking-tight">
                  Digitalist
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  Video Editor
                </div>
              </div>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-[var(--panel-2)] text-[var(--text)]"
                        : "text-[var(--muted)] hover:text-[var(--text)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Button asChild>
            <Link href="/videos/new">
              <Plus className="h-4 w-4" />
              Create new video
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
