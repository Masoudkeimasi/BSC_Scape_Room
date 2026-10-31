import { assertSameOrigin } from "@/lib/request-security";
import { NextRequest, NextResponse } from "next/server";
import {
  allProgress,
  content,
  instructor,
  loginInstructor,
  saveContent,
  db,
  atomic,
  version,
} from "@/lib/server";
import { validateContent } from "@/lib/content-validation";
import { initialProgress } from "@/lib/game-engine";
export async function GET() {
  if (!(await instructor()))
    return NextResponse.json(
      { error: "Instructor authorisation required." },
      { status: 403 },
    );
  return NextResponse.json(
    { content: await content(), students: await allProgress() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
const failures = new Map<string, { n: number; at: number }>();
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req.headers);
    const a = await req.json();
    if (a.type === "login") {
      const key = "instructor";
      const f = failures.get(key);
      if (f && f.n >= 5 && Date.now() - f.at < 60000)
        throw new Error("Too many attempts. Retry in one minute.");
      try {
        await loginInstructor(a.password);
        failures.delete(key);
      } catch (e) {
        failures.set(key, { n: (f?.n ?? 0) + 1, at: Date.now() });
        throw e;
      }
      return NextResponse.json({ ok: true });
    }
    if (!(await instructor()))
      return NextResponse.json(
        { error: "Instructor authorisation required." },
        { status: 403 },
      );
    if (a.type === "import") {
      const c = validateContent(a.content);
      await saveContent(c);
      return NextResponse.json({
        ok: true,
        message:
          "Validated content saved. Existing sessions require authorised reset.",
      });
    }
    if (a.type === "reset") {
      const students = await allProgress();
      if (!students.some((p) => p.id === a.id))
        throw new Error("Student not found.");
      const p = initialProgress(a.id);
      p.contentVersion = version(await content());
      const database = db();
      if (database) {
        const { error } = await database
          .from("vault_progress")
          .update({ data: p })
          .eq("id", a.id);
        if (error) throw new Error("Reset failed.");
      } else await atomic(`progress-${a.id}.json`, p);
      return NextResponse.json({ ok: true });
    }
    throw new Error("Unknown instructor action.");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
