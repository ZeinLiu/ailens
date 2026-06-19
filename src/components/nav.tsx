"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-13 border-b border-[var(--border)] bg-[var(--background)]">
      <Link href="/" className="font-bold text-base tracking-tight">AILens</Link>
      <div className="flex items-center gap-7 text-sm">
        <Link href="/" className={path === "/" ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}>Index</Link>
        <Link href="/tracker" className={path === "/tracker" ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}>Tracker</Link>
        <Link href="#" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">log in</Link>
      </div>
    </nav>
  );
}
