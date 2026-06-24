import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert profile on first login
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          display_name:
            data.user.user_metadata?.full_name ??
            data.user.user_metadata?.name ??
            null,
          avatar_url:
            data.user.user_metadata?.avatar_url ??
            data.user.user_metadata?.picture ??
            null,
          role: "USER",
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`);
}
