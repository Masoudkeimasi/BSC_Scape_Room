"use client";
import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  LockKeyhole,
  Download,
  Upload,
  Save,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "./GameApp";
import { pageThemes, themeStyle, designCredit } from "@/lib/page-themes";
import { Button } from "./ui/button";
import { Content, Progress } from "@/lib/types";
export function Instructor() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<{
    content: Content;
    students: Progress[];
  }>();
  const [editor, setEditor] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [option, setOption] = useState("");
  const load = async () => {
    const r = await fetch("/api/instructor");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setData(d);
    setEditor(JSON.stringify(d.content, null, 2));
  };
  const request = async (body: unknown) => {
    setBusy(true);
    try {
      const r = await fetch("/api/instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage(d.message ?? "Saved.");
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const download = (value: string, name: string, type = "application/json") => {
    const url = URL.createObjectURL(new Blob([value], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const csv = () => {
    const rows = [
      [
        "anonymous_id",
        "completed_rooms",
        "score",
        "incorrect_submissions",
        "restarts",
        "calculation_errors",
        "assessment_attempts",
        "last_assessment",
      ],
      ...data!.students.map((p, i) => [
        `participant-${i + 1}`,
        p.completed.length,
        p.score,
        Object.values(p.rooms).reduce((s, r) => s + r.incorrect, 0),
        Object.values(p.rooms).reduce((s, r) => s + r.restarts, 0),
        Object.values(p.rooms).reduce((s, r) => s + r.calculationErrors, 0),
        p.attempts.length,
        p.attempts.at(-1)?.score ?? "",
      ]),
    ];
    download(
      rows
        .map((r) =>
          r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
        )
        .join("\n"),
      "persepolis-anonymised-results.csv",
      "text/csv",
    );
  };
  return (
    <div
      className="instructor-shell"
      data-page="instructor"
      style={themeStyle(pageThemes.instructor)}
    >
      <header>
        <Brand />
        <Link href="/">
          <ArrowLeft size={16} /> Return to mission
        </Link>
      </header>
      <main>
        <div className="page-kicker">ACADEMIC CONTROL CENTRE</div>
        <h1 className="page-title">Instructor workspace.</h1>
        <p className="muted">
          Content, evidence and learning outcomes. Protected by server-side
          authorisation.
        </p>
        {message && (
          <div role="status" className="alert">
            {message}
          </div>
        )}
        {!data ? (
          <section className="panel instructor-login">
            <GraduationCap size={36} />
            <h2>Authorised access only.</h2>
            <p>
              Use your instructor password, or an authenticated Supabase account
              with the instructor role. Access is disabled until configured.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await request({ type: "login", password })) {
                  try {
                    await load();
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }
              }}
            >
              <label>
                Instructor password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <Button disabled={busy}>
                <LockKeyhole size={16} /> Sign in
              </Button>
            </form>
            <Button
              variant="outline"
              onClick={() => load().catch((e) => setMessage(e.message))}
            >
              Use existing instructor session
            </Button>
          </section>
        ) : (
          <>
            <div className="alert success">
              <ShieldCheck size={18} /> Instructor session verified. Answer
              mappings are only delivered to authorised instructor requests.
            </div>
            <div className="dashboard-stats">
              <div className="panel">
                <span>PARTICIPANTS</span>
                <strong>{data.students.length}</strong>
              </div>
              <div className="panel">
                <span>OPTION BANK</span>
                <strong>{data.content.options.length}</strong>
              </div>
              <div className="panel">
                <span>THEORY QUESTIONS</span>
                <strong>{data.content.theory.length}</strong>
              </div>
              <div className="panel">
                <span>SUCCESSFUL ESCAPES</span>
                <strong>
                  {data.students.filter((p) => p.finishedAt).length}
                </strong>
              </div>
            </div>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <div className="eyebrow gold">
                    COURSE CONTENT / VALIDATED IMPORT
                  </div>
                  <h2>Your complete teaching bank.</h2>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    download(editor, "persepolis-content-template.json")
                  }
                >
                  <Download size={16} /> Export / import template
                </Button>
              </div>
              <p className="muted">
                The current complete bank is the exact import template. Edit
                options, explanations, mappings, calculations, vision,
                questions, review sections and causalLinks here. Import is
                atomic: all 128 options must pass validation before anything is
                saved. Export contains confidential answers; store securely.
              </p>
              <label className="upload-button">
                <Upload size={16} /> Import complete course JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) setEditor(await file.text());
                  }}
                />
              </label>
              <label>
                Quick option editor
                <select
                  value={option}
                  onChange={(e) => setOption(e.target.value)}
                >
                  <option value="">Choose option</option>
                  {data.content.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} — {o.text}
                    </option>
                  ))}
                </select>
              </label>
              {option && (
                <div className="two-column">
                  {["text", "explanation", "feedback"].map((field) => {
                    let c: Content;
                    try {
                      c = JSON.parse(editor);
                    } catch {
                      return null;
                    }
                    const record = c.options.find((o) => o.id === option)!;
                    return (
                      <label key={field}>
                        {field}
                        <textarea
                          value={String(record[field as keyof typeof record])}
                          onChange={(e) => {
                            const changed = structuredClone(c);
                            (
                              changed.options.find(
                                (o) => o.id === option,
                              )! as unknown as Record<string, unknown>
                            )[field] = e.target.value;
                            setEditor(JSON.stringify(changed, null, 2));
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
              <label>
                Full structured content
                <textarea
                  className="json-editor"
                  spellCheck={false}
                  value={editor}
                  onChange={(e) => setEditor(e.target.value)}
                />
              </label>
              <label className="upload-button">
                <Upload size={16} /> Upload annual review text or section JSON
                <input
                  type="file"
                  accept=".txt,.json"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const c = JSON.parse(editor);
                      const text = await f.text();
                      c.review = f.name.endsWith(".json")
                        ? JSON.parse(text)
                        : [{ title: "Imported annual review", body: text }];
                      setEditor(JSON.stringify(c, null, 2));
                      setMessage("Review staged. Validate and save to apply.");
                    } catch (e) {
                      setMessage((e as Error).message);
                    }
                  }}
                />
              </label>
              <p className="data-note">
                Review JSON is an array of &#123;title, body, table?:
                string[][]&#125;. DOCX source content has already been converted
                into accessible sections and tables.
              </p>
              <Button
                disabled={busy}
                onClick={async () => {
                  try {
                    if (
                      await request({
                        type: "import",
                        content: JSON.parse(editor),
                      })
                    )
                      await load();
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                <Save size={16} /> Validate & save complete content
              </Button>
            </section>
            <section className="panel">
              <div className="section-heading">
                <h2>Learning analytics</h2>
                <Button variant="outline" onClick={csv}>
                  <Download size={16} /> Anonymised CSV
                </Button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Rooms</th>
                      <th>Rows F/C/P/L</th>
                      <th>Score</th>
                      <th>Calc errors</th>
                      <th>Retries</th>
                      <th>Final</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((p, i) => (
                      <tr key={p.id}>
                        <td>Participant {i + 1}</td>
                        <td>{p.completed.length}/7</td>
                        <td>
                          {[2, 3, 4, 5]
                            .map((r) => p.rooms[r].rows.length)
                            .join(" / ")}
                        </td>
                        <td>{p.score}</td>
                        <td>
                          {Object.values(p.rooms).reduce(
                            (s, r) => s + r.calculationErrors,
                            0,
                          )}
                        </td>
                        <td>{p.attempts.length}</td>
                        <td>{p.attempts.at(-1)?.score ?? "—"}</td>
                        <td>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={async () => {
                              if (
                                confirm(
                                  `Reset Participant ${i + 1}? This clears their progress.`,
                                ) &&
                                (await request({ type: "reset", id: p.id }))
                              )
                                await load();
                            }}
                          >
                            Reset
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3>Room completion rates</h3>
              {[1, 2, 3, 4, 5, 6, 7].map((r) => (
                <p key={r}>
                  Room {r}:{" "}
                  {data.students.filter((p) => p.completed.includes(r)).length}/
                  {data.students.length} participants
                </p>
              ))}
              <h3>Frequently selected options in incorrect chains</h3>
              {Object.entries(
                data.students
                  .flatMap((p) =>
                    p.events
                      .filter((e) => e.kind === "incorrect")
                      .flatMap((e) => e.optionIds),
                  )
                  .reduce<Record<string, number>>(
                    (a, id) => ({ ...a, [id]: (a[id] ?? 0) + 1 }),
                    {},
                  ),
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
                .map(([id, n]) => (
                  <p key={id}>
                    {id}: {n} selections —{" "}
                    {data.content.options.find((o) => o.id === id)
                      ?.primaryCategory ??
                      "correct option in a mismatched chain"}
                  </p>
                ))}
            </section>
          </>
        )}
        <p className="data-note">
          Anonymous demo records are illustrative and tamperable. Use Supabase
          accounts for assessed cohorts. Content changes invalidate active
          sessions; perform an authorised reset after changing a course.
        </p>
        <p className="designer-credit footer-credit">{designCredit}</p>
      </main>
    </div>
  );
}
