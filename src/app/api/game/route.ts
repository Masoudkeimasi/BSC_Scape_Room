import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import {
  content,
  identity,
  publicState,
  readProgress,
  saveProgress,
  serial,
  version,
  setCookie,
} from "@/lib/server";
import { applyAction, initialProgress } from "@/lib/game-engine";
export const runtime = "nodejs";
export async function GET() {
  try {
    const i = await identity();
    const c = await content();
    const p = await readProgress(i, c);
    return NextResponse.json(
      {
        ...(await publicState(p, c)),
        mode: i.authenticated ? "authenticated" : "demo",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
export async function POST(req: NextRequest) {
  return serial(async () => {
    try {
      assertSameOrigin(req.headers);
      const a = await req.json();
      const i = await identity();
      const c = await content();
      let p =
        a.type === "new" && !i.authenticated
          ? initialProgress(i.id)
          : await readProgress(i, c);
      const previous = structuredClone(p);
      let message = "";
      let feedback;
      if (a.type === "new") {
        if (i.authenticated)
          throw new Error("Only instructors can reset authenticated progress.");
        p = initialProgress(
          i.id,
          String(a.name || "Anonymous strategist").slice(0, 80),
        );
        p.contentVersion = version(c);
        message = "Mission started. Vision Vault is open.";
      } else if (a.type === "resume") {
        if (i.authenticated)
          throw new Error("Authenticated progress is server-authoritative."); // Local demo is explicitly tamperable; validate shape before restoring.
        const { progressSchema } = await import("@/lib/progress-validation");
        const restored = progressSchema.parse(a.progress);
        if (restored.contentVersion !== version(c))
          throw new Error(
            "Saved demo uses a different content version. Start a new mission.",
          );
        p = { ...restored, id: i.id };
        message = "Anonymous demonstration restored from this browser.";
      } else {
        const result = applyAction(p, a, c);
        p = result.progress;
        message = result.message;
        feedback = result.feedback;
      }
      await saveProgress(i, p, previous);
      return NextResponse.json({
        ...(await publicState(p, c)),
        mode: i.authenticated ? "authenticated" : "demo",
        message,
        feedback,
      });
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 400 },
      );
    }
  });
}
