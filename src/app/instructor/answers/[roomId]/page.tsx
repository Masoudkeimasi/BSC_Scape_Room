import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { instructor, content } from "@/lib/server";
import { ROOM_IDS, VAULT_NAMES } from "@/lib/mission";
import { STRATEGY_MAP_IMAGE } from "@/lib/strategy-map-image";
import { perspectives, components } from "@/lib/types";
import { pageThemes, themeStyle, designCredit } from "@/lib/page-themes";
import { Brand } from "@/components/GameApp";
export const metadata = {
  title: "Instructor answer key — Persepolis Foods",
  robots: { index: false, follow: false },
};
const componentNames = {
  O: "Objective",
  M: "Measure",
  T: "Target",
  I: "Initiative",
};
export default async function Page({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!/^[1-7]$/.test(roomId)) notFound();
  const room = Number(roomId);
  if (!(await instructor())) redirect(`/instructor?answers=${room}`);
  // Instructor-only source is loaded and rendered on the server, after authorisation.
  const c = await content();
  const chains = c.chains.filter(
    (ch) => ch.perspective === perspectives[room - 2],
  );
  const calculations = c.calculations.filter((calc) =>
    chains.some((ch) => ch.id === calc.chainId),
  );
  return (
    <div
      className="instructor-shell"
      data-page="instructor-answers"
      style={themeStyle(pageThemes[`room-${room}`])}
    >
      <header>
        <Brand />
        <Link href="/instructor">← Instructor workspace</Link>
      </header>
      <main>
        <div className="page-kicker">INSTRUCTOR ONLY / STAGE {room} OF 7</div>
        <h1 className="page-title">
          {VAULT_NAMES[room - 1]} — correct answers
        </h1>
        <p className="alert">
          Confidential teaching key. Viewing these answers does not unlock
          student vaults, change scores or issue certificates.
        </p>
        <nav className="answer-key-nav" aria-label="Answer key stages">
          {ROOM_IDS.map((r) => (
            <Link
              key={r}
              aria-current={r === room ? "page" : undefined}
              href={`/instructor/answers/${r}`}
            >
              {r}. {VAULT_NAMES[r - 1]}
            </Link>
          ))}
        </nav>
        {room === 1 && (
          <section className="panel">
            <h2>The three aligned statements</h2>
            <ol className="vision-answer-list">
              {c.vision
                .filter((v) => v.correct)
                .map((v) => (
                  <li key={v.id}>
                    <strong>{v.text}</strong>
                  </li>
                ))}
            </ol>
            <p className="data-note">
              These are the three selections accepted by the current teaching
              case.
            </p>
          </section>
        )}
        {room >= 2 && room <= 5 && (
          <>
            <section className="panel">
              <h2>Three correct strategic chains</h2>
              <p className="muted">
                Students may complete these chains in any order. Components must
                remain aligned within the same chain.
              </p>
              {chains.map((ch) => (
                <article className="answer-chain" key={ch.id}>
                  <h3>Chain {ch.id}</h3>
                  <dl className="answer-chain-grid">
                    {components.map((component, index) => {
                      const o = c.options.find(
                        (o) => o.id === ch.options[index],
                      )!;
                      return (
                        <div key={component} data-component={component}>
                          <dt>{componentNames[component]}</dt>
                          <dd>
                            <span className="answer-option-id">{o.id}</span>
                            {o.text}
                          </dd>
                          <details>
                            <summary>
                              Instructor explanation and evidence
                            </summary>
                            <p>{o.explanation}</p>
                            <p>{o.evidence}</p>
                          </details>
                        </div>
                      );
                    })}
                  </dl>
                </article>
              ))}
            </section>
            {calculations.length > 0 && (
              <section className="panel">
                <h2>Calculation answers</h2>
                {calculations.map((calc) => (
                  <article className="answer-calculation" key={calc.id}>
                    <h3>{calc.title}</h3>
                    <p>{calc.formula}</p>
                    <ul>
                      {Object.entries(calc.inputs).map(([name, value]) => (
                        <li key={name}>
                          {name}: {value.toLocaleString("en-GB")}
                        </li>
                      ))}
                    </ul>
                    <p className="calculation-answer">
                      Correct result:{" "}
                      <strong>
                        {calc.expected.toLocaleString("en-GB")} {calc.unit}
                      </strong>
                    </p>
                    <p className="data-note">
                      Accepted tolerance: ±{calc.tolerance} {calc.unit}. Linked
                      chain: {calc.chainId}.
                    </p>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
        {room === 6 && (
          <section className="panel">
            <h2>Completed Strategy Map</h2>
            <p>
              The sixteen pieces reconstruct this picture, read from top left to
              bottom right. No arrows need to be drawn.
            </p>
            <img
              className="completed-strategy-map"
              src={STRATEGY_MAP_IMAGE}
              alt="Correct complete Persepolis Strategy Map showing the vision and the Financial, Customer, Internal Process, and Learning and Growth perspectives."
            />
            <div className="puzzle-actions">
              <Link
                className="button primary"
                href="/instructor/preview/strategy-map"
              >
                Test the puzzle in instructor preview
              </Link>
              <a
                className="button outline"
                href={STRATEGY_MAP_IMAGE}
                target="_blank"
                rel="noreferrer"
              >
                Open full-size map
              </a>
            </div>
          </section>
        )}
        {room === 7 && (
          <section className="panel">
            <h2>Knowledge Vault — complete question bank</h2>
            <p className="muted">
              Students receive ten randomly selected questions. The default pass
              mark is 8/10. Accepted alternative answers are listed below;
              matching ignores case and extra whitespace.
            </p>
            <ol className="theory-answer-list">
              {c.theory.map((q) => (
                <li key={q.id}>
                  <span className="eyebrow gold">
                    {q.id} · {q.type.toUpperCase()}
                  </span>
                  <h3>{q.prompt}</h3>
                  <p className="theory-correct-answer">
                    <strong>
                      Correct answer{q.answers.length > 1 ? "s" : ""}:
                    </strong>{" "}
                    {q.answers.join(" / ")}
                  </p>
                  <p>{q.explanation}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
        <p className="designer-credit footer-credit">{designCredit}</p>
      </main>
    </div>
  );
}
