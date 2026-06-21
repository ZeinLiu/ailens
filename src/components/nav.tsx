"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Nav() {
  const path = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  async function signIn() {
    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 h-13 border-b border-[var(--border)] bg-[var(--background)]">
      <Link href="/" className="font-bold text-base tracking-tight">AILens</Link>
      <div className="flex items-center gap-7 text-sm">
        <Link href="/" className={path === "/" ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}>Index</Link>
        <Link href="/tracker" className={path === "/tracker" ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}>Tracker</Link>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-[var(--muted-foreground)] text-xs font-mono truncate max-w-[140px]">{user.email}</span>
            <button onClick={signOut} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">sign out</button>
          </div>
        ) : (
          <button onClick={signIn} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">log in</button>
        )}
      </div>
    </nav>
  );
}
