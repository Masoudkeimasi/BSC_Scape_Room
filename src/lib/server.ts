import { ROOM_IDS, KNOWLEDGE_ROOM, MISSION_VERSION } from "./mission";
import { STRATEGY_MAP_IMAGE } from "./strategy-map-image";
import "server-only";
import { cookies } from "next/headers";
import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { demo } from "../data/demo";
import supplied from "../data/supplied.json";
import quiz from "../data/supplied-quiz.json";
import { Content, Progress, Theory } from "./types";
import { validateContent } from "./content-validation";
import { initialProgress, shuffle } from "./game-engine";
// Mutable runtime records must not be traced into deployment bundles.
const dir = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const secret = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const sign = (s: string) =>
  createHmac("sha256", secret).update(s).digest("hex");
const equal = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const db = () =>
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } },
      )
    : null;
export const authConfigured = () =>
  !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SESSION_SECRET
  );
export async function atomic(name: string, value: unknown) {
  await mkdir(dir, { recursive: true });
  const dest = path.join(/*turbopackIgnore: true*/ dir, name);
  const temp = dest + "." + randomBytes(5).toString("hex");
  await writeFile(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  await rename(temp, dest);
}
async function localRead<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(
      await readFile(
        /*turbopackIgnore: true*/ path.join(
          /*turbopackIgnore: true*/ dir,
          name,
        ),
        "utf8",
      ),
    );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw e;
  }
}
export async function content() {
  const database = db();
  let saved: unknown = null;
  if (database) {
    const { data, error } = await database
      .from("vault_content")
      .select("data")
      .eq("id", "active")
      .maybeSingle();
    if (error)
      throw new Error(
        "Content database unavailable. Apply the Supabase migration.",
      );
    saved = data?.data;
  } else saved = await localRead<Content | null>("content.json", null);
  if (saved) return validateContent(saved);
  const fixture = structuredClone(demo);
  fixture.settings = {
    mistakeLimit: 3,
    passThreshold: 0.75,
    chainPoints: 20,
    cleanBonus: 50,
    calculationPoints: 10,
    assessmentPoints: 10,
  };
  fixture.label =
    "SUPPLIED FICTIONAL TEACHING CASE • supplementary baselines clearly identified";
  fixture.options = supplied.options as Content["options"];
  fixture.review = supplied.review;
  fixture.theory = [...(quiz as Theory[]), ...fixture.theory];
  fixture.vision[0].text =
    "Make everyday nourishment more accessible, enjoyable and responsible.";
  fixture.vision[1].text =
    "Become the most trusted, innovative and sustainably profitable food group in chosen markets by 2030.";
  fixture.vision[2].text =
    "Combine consumer insight, responsible sourcing, product innovation and operational excellence.";
  return validateContent(fixture);
}
export const version = (c: Content) =>
  createHash("sha256")
    .update(MISSION_VERSION + JSON.stringify(c))
    .digest("hex")
    .slice(0, 16);
export async function setCookie(name: string, value: string) {
  (await cookies()).set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
export async function identity() {
  const jar = await cookies();
  const token = jar.get("pf-auth")?.value;
  if (token) {
    if (!authConfigured())
      throw new Error("Authenticated assessment is not configured.");
    const { data, error } = await db()!.auth.getUser(token);
    if (error || !data.user) throw new Error("Session expired. Sign in again.");
    return {
      id: data.user.id,
      authenticated: true,
      role:
        data.user.app_metadata.role === "instructor" ? "instructor" : "student",
    };
  }
  const raw = jar.get("pf-demo")?.value;
  const [id, signature] = raw?.split(".") ?? [];
  if (
    id &&
    signature &&
    /^[a-f0-9]{32}$/.test(id) &&
    equal(sign(id), signature)
  )
    return { id, authenticated: false, role: "demo" };
  const nextId = randomBytes(16).toString("hex");
  await setCookie("pf-demo", `${nextId}.${sign(nextId)}`);
  return { id: nextId, authenticated: false, role: "demo" };
}
export async function instructor() {
  const jar = await cookies();
  const raw = jar.get("pf-instructor")?.value;
  const [expires, sig] = raw?.split(".") ?? [];
  if (
    expires &&
    sig &&
    Number(expires) > Date.now() &&
    equal(sign(`instructor:${expires}`), sig)
  )
    return true;
  try {
    const i = await identity();
    return i.authenticated && i.role === "instructor";
  } catch {
    return false;
  }
}
export async function loginInstructor(password: string) {
  if (!process.env.INSTRUCTOR_PASSWORD)
    throw new Error(
      "Instructor access is disabled. Configure INSTRUCTOR_PASSWORD and a stable SESSION_SECRET.",
    );
  if (!process.env.SESSION_SECRET)
    throw new Error(
      "Configure SESSION_SECRET before enabling instructor access.",
    );
  if (!equal(sign(password), sign(process.env.INSTRUCTOR_PASSWORD)))
    throw new Error("Invalid instructor credentials.");
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  await setCookie(
    "pf-instructor",
    `${expires}.${sign(`instructor:${expires}`)}`,
  );
}
export async function readProgress(
  i: Awaited<ReturnType<typeof identity>>,
  c: Content,
) {
  let p: Progress | null = null;
  if (i.authenticated) {
    const { data, error } = await db()!
      .from("vault_progress")
      .select("data")
      .eq("id", i.id)
      .maybeSingle();
    if (error)
      throw new Error(
        "Progress database unavailable. Apply the Supabase migration.",
      );
    p = data?.data;
  } else p = await localRead<Progress | null>(`progress-${i.id}.json`, null);
  if (!p) {
    p = initialProgress(i.id);
    p.contentVersion = version(c);
  }
  if (p.contentVersion !== version(c))
    throw new Error(
      "Course content changed. Ask the instructor to reset this session, or start a new anonymous mission.",
    );
  return p;
}
export async function saveProgress(
  i: Awaited<ReturnType<typeof identity>>,
  p: Progress,
  previous?: Progress,
) {
  if (i.authenticated) {
    const { data, error } = await db()!.rpc("save_vault_progress", {
      participant_id: i.id,
      expected: previous ?? null,
      replacement: p,
    });
    if (error || data !== true)
      throw new Error(
        "Progress changed in another request. Refresh before retrying.",
      );
  } else await atomic(`progress-${i.id}.json`, p);
}
const ordered = <T extends { id: string }>(items: T[], seed: string) =>
  [...items].sort((a, b) =>
    createHash("sha256")
      .update(seed + a.id)
      .digest("hex")
      .localeCompare(
        createHash("sha256")
          .update(seed + b.id)
          .digest("hex"),
      ),
  );
export async function publicState(p: Progress, c: Content) {
  const room = ROOM_IDS.find((r) => !p.completed.includes(r)) ?? KNOWLEDGE_ROOM;
  const assessment = p.assessment
    ? c.theory
        .filter((q) => p.assessment!.ids.includes(q.id))
        .map((q) => ({
          id: q.id,
          type: q.type,
          prompt: q.prompt,
          choices: p.assessment!.choices[q.id],
        }))
    : [];
  const strategyMapImage = room >= 6 ? STRATEGY_MAP_IMAGE : null;
  return {
    progress: p,
    content: {
      strategyMapImage,
      label: c.label,
      approved: c.approved,
      settings: c.settings,
      review: c.review,
      vision: ordered(
        c.vision.map(({ id, text }) => ({ id, text })),
        p.id + ":" + p.rooms[1].restarts,
      ),
      options: ordered(
        c.options
          .filter(
            (o) => ["F", "C", "P", "L"].indexOf(o.perspective) + 2 <= room,
          )
          .map(({ id, perspective, component, text, calculationId }) => ({
            id,
            perspective,
            component,
            text,
            calculationId,
          })),
        p.id +
          ":" +
          Object.values(p.rooms)
            .map((r) => r.restarts)
            .join(":"),
      ),
      calculations: c.calculations.map(({ expected, tolerance, ...x }) => x),
      objectives:
        room >= 5
          ? c.chains.map((ch) => ({
              id: ch.id,
              text: c.options.find((o) => o.id === ch.options[0])!.text,
            }))
          : [],
      assessment,
    },
    authAvailable: authConfigured(),
  };
}
// Serialize local transitions; the Supabase RPC also enforces optimistic concurrency across instances.
let queue: Promise<unknown> = Promise.resolve();
export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn, fn);
  queue = result.catch(() => {});
  return result;
}
export async function saveContent(c: Content) {
  const database = db();
  if (database) {
    const { error } = await database
      .from("vault_content")
      .upsert({ id: "active", data: c });
    if (error) throw new Error("Content save failed.");
  } else await atomic("content.json", c);
}
export async function allProgress() {
  const database = db();
  if (database) {
    const { data, error } = await database
      .from("vault_progress")
      .select("id,data");
    if (error) throw new Error("Analytics unavailable.");
    return (data ?? []).map((x) => x.data as Progress);
  }
  const { readdir } = await import("node:fs/promises");
  await mkdir(dir, { recursive: true });
  const names = (await readdir(/*turbopackIgnore: true*/ dir)).filter((n) =>
    /^progress-[a-f0-9]+\.json$/.test(n),
  );
  return Promise.all(
    names.map((n) => localRead<Progress>(n, null as unknown as Progress)),
  );
}
