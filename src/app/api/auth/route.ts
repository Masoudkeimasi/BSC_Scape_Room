import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import { authConfigured, db, setCookie } from "@/lib/server";
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req.headers);
    const a = await req.json();
    if (a.type === "logout") {
      await setCookie("pf-auth", "");
      await setCookie("pf-instructor", "");
      return NextResponse.json({ ok: true });
    }
    if (!authConfigured())
      throw new Error(
        "Supabase is not configured. Use anonymous demonstration mode.",
      );
    const { data, error } = await db()!.auth.signInWithPassword({
      email: a.email,
      password: a.password,
    });
    if (error || !data.session)
      throw new Error("Sign-in failed. Check your account credentials.");
    await setCookie("pf-auth", data.session.access_token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
