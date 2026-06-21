import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

const ALLOWED = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email?.toLowerCase() ?? "";
      if (ALLOWED.length > 0 && !ALLOWED.includes(email)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/?error=unauthorized`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
