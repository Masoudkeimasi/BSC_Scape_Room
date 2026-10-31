import { describe, it, expect } from "vitest";
import { demo } from "../src/data/demo";
import supplied from "../src/data/supplied.json";
import quiz from "../src/data/supplied-quiz.json";
import { validateContent } from "../src/lib/content-validation";
import { applyAction, initialProgress, unlocked } from "../src/lib/game-engine";
import { Action, Content, Progress } from "../src/lib/types";
const c = validateContent({
  ...demo,
  ...supplied,
  theory: [...quiz, ...demo.theory],
});
const vision = (p: Progress) =>
  applyAction(
    p,
    {
      type: "vision",
      room: 1,
      ids: c.vision.filter((v) => v.correct).map((v) => v.id),
    },
    c,
  ).progress;
const act = (p: Progress, a: Action) => applyAction(p, a, c).progress;
const chain = (p: Progress, id: string) => {
  const ch = c.chains.find((ch) => ch.id === id)!;
  const room = ["F", "C", "P", "L"].indexOf(ch.perspective) + 2;
  let next = p;
  for (const calc of c.calculations.filter((x) => x.chainId === id))
    next = act(next, {
      type: "calculate",
      room,
      calculationId: calc.id,
      value: calc.expected,
    });
  return act(next, { type: "chain", room, ids: ch.options });
};
const until = (room: number) => {
  let p = vision(initialProgress("test"));
  for (const r of [2, 3, 4, 5]) {
    if (r >= room) break;
    for (const ch of c.chains.filter(
      (ch) => ["F", "C", "P", "L"][r - 2] === ch.perspective,
    ))
      p = chain(p, ch.id);
  }
  return p;
};
const ready6 = () => {
  let p = until(6);
  return act(p, {
    type: "map",
    room: 5,
    placements: Object.fromEntries(
      c.chains.map((ch) => [ch.id, ch.perspective]),
    ),
    links: c.causalLinks,
    explanation:
      "Digital capability may support reliable processes which improve customer outcomes; evidence must test this causal hypothesis.",
  });
};
const assess = (score: number) => {
  let p = act(ready6(), { type: "assessment-start", room: 6 });
  const qs = p.assessment!.ids;
  const answers = Object.fromEntries(
    qs.map((id, i) => [
      id,
      i < score ? c.theory.find((q) => q.id === id)!.answers[0] : "incorrect",
    ]),
  );
  return act(p, { type: "assessment-submit", room: 6, answers });
};
describe("sequential mission and protected transitions", () => {
  it("only room 1 opens initially", () => {
    const p = initialProgress("a");
    expect([1, 2, 3, 4, 5, 6].filter((r) => unlocked(p, r))).toEqual([1]);
  });
  it("vision unlocks room 2 only", () => {
    const p = vision(initialProgress("a"));
    expect(unlocked(p, 2)).toBe(true);
    expect(unlocked(p, 3)).toBe(false);
  });
  it("rejects direct locked room actions", () =>
    expect(() =>
      act(initialProgress("a"), { type: "assessment-start", room: 6 }),
    ).toThrow("locked"));
  it("requires exactly three vision choices and resets only on three failed submissions", () => {
    let p = initialProgress("a");
    expect(() => act(p, { type: "vision", ids: ["v1"] })).toThrow();
    for (let i = 0; i < 3; i++)
      p = act(p, { type: "vision", ids: ["v4", "v5", "v6"] });
    expect(p.rooms[1].restarts).toBe(1);
    expect(p.rooms[1].mistakes).toBe(0);
  });
  it("completed rooms are read only", () =>
    expect(() =>
      act(vision(initialProgress("a")), {
        type: "vision",
        room: 1,
        ids: ["v1", "v2", "v3"],
      }),
    ).toThrow("read-only"));
  it("room 2 starts with zero locked rows", () =>
    expect(until(2).rooms[2].rows).toHaveLength(0));
  it("correct chains work in any order and progressively add rows", () => {
    let p = until(2);
    for (const [i, id] of ["F3", "F1", "F2"].entries()) {
      p = chain(p, id);
      expect(p.rooms[2].rows.length).toBe(i + 1);
    }
    expect(p.completed).toEqual([1, 2]);
  });
  it("locked rows retain the exact selected IDs", () => {
    const p = chain(until(2), "F2");
    expect(p.rooms[2].rows[0]).toEqual(
      c.chains.find((x) => x.id === "F2")!.options,
    );
  });
  it("used cards cannot be selected again", () => {
    const p = chain(until(2), "F2");
    expect(() =>
      act(p, {
        type: "chain",
        room: 2,
        ids: c.chains.find((x) => x.id === "F2")!.options,
      }),
    ).toThrow("unused");
  });
  it("duplicate cards cannot fill slots", () =>
    expect(() =>
      act(until(2), {
        type: "chain",
        room: 2,
        ids: ["F-O1", "F-O1", "F-T1", "F-I1"],
      }),
    ).toThrow("distinct"));
  it("invalid component movements never count as submitted mistakes", () => {
    const p = until(2);
    expect(() =>
      act(p, { type: "chain", room: 2, ids: ["F-M2", "F-O2", "F-T2", "F-I2"] }),
    ).toThrow("component");
    expect(p.rooms[2].mistakes).toBe(0);
  });
  it("incomplete submissions do not count", () => {
    const p = until(2);
    expect(() => act(p, { type: "chain", room: 2, ids: ["F-O2"] })).toThrow();
    expect(p.rooms[2].mistakes).toBe(0);
  });
  it("incorrect completed chain counts one mistake", () => {
    const p = act(until(2), {
      type: "chain",
      room: 2,
      ids: ["F-O2", "F-M3", "F-T2", "F-I2"],
    });
    expect(p.rooms[2].mistakes).toBe(1);
  });
  it("three incorrect chains clear current rows and preserve earlier rooms", () => {
    let p = chain(until(3), "C2");
    for (let i = 0; i < 3; i++)
      p = act(p, {
        type: "chain",
        room: 3,
        ids: ["C-O3", "C-M4", "C-T3", "C-I3"],
      });
    expect(p.completed).toEqual([1, 2]);
    expect(p.rooms[3].rows).toEqual([]);
    expect(p.rooms[3].calculations).toEqual({});
    expect(p.rooms[3].restarts).toBe(1);
  });
  it("D26 mismatch of otherwise correct financial options is rejected", () => {
    const p = act(until(2), {
      type: "chain",
      room: 2,
      ids: ["F-O2", "F-M3", "F-T2", "F-I2"],
    });
    expect(p.rooms[2].rows).toHaveLength(0);
  });
  it("D25 baseline result has tolerance and does not consume mistakes", () => {
    let p = until(2);
    p = act(p, {
      type: "calculate",
      room: 2,
      calculationId: "F-baseline",
      value: 6,
    });
    expect(p.rooms[2].mistakes).toBe(0);
    expect(p.rooms[2].calculationErrors).toBe(1);
    p = act(p, {
      type: "calculate",
      room: 2,
      calculationId: "F-baseline",
      value: 8.005,
    });
    expect(p.rooms[2].calculations["F-baseline"]).toBe(8.005);
  });
  it("linked calculation is required only for its target", () => {
    let p = until(2);
    expect(() =>
      act(p, { type: "chain", room: 2, ids: c.chains[0].options }),
    ).toThrow("baseline");
    p = chain(p, "F2");
    expect(p.rooms[2].rows).toHaveLength(1);
  });
  it("wrong direction targets are rejected with distinct feedback", () => {
    const r = applyAction(
      until(2),
      { type: "chain", room: 2, ids: ["F-O1", "F-M1", "F-T4", "F-I1"] },
      c,
    );
    expect(r.message).toContain("Wrong direction");
  });
  it("three perspective chains unlock the next room", () =>
    expect(unlocked(until(3), 3)).toBe(true));
  it("room 5 requires both chains and map", () => {
    const p = until(6);
    expect(p.rooms[5].rows).toHaveLength(3);
    expect(unlocked(p, 6)).toBe(false);
    expect(unlocked(ready6(), 6)).toBe(true);
  });
  it("invalid map links and short explanation are rejected", () => {
    expect(() =>
      act(until(6), {
        type: "map",
        room: 5,
        placements: {},
        links: [],
        explanation: "",
      }),
    ).toThrow("perspectives");
  });
  it("7/10 fails and preserves earlier rooms", () => {
    const p = assess(7);
    expect(p.completed).toEqual([1, 2, 3, 4, 5]);
    expect(p.finishedAt).toBeUndefined();
    expect(p.attempts[0].score).toBe(7);
  });
  it("8/10 passes and issues a certificate identifier", () => {
    const p = assess(8);
    expect(p.completed).toEqual([1, 2, 3, 4, 5, 6]);
    expect(p.certificateId).toBeTruthy();
  });
  it("normalises case and whitespace for blank answers", () => {
    let p = ready6();
    p.assessment = {
      ids: c.theory
        .filter((q) => q.type === "blank")
        .slice(0, 1)
        .map((q) => q.id)
        .concat(
          c.theory
            .filter((q) => q.type !== "blank")
            .slice(0, 9)
            .map((q) => q.id),
        ),
      choices: {},
    };
    const answers = Object.fromEntries(
      p.assessment.ids.map((id) => [
        id,
        "  " +
          c.theory.find((q) => q.id === id)!.answers[0].toUpperCase() +
          "  ",
      ]),
    );
    p = act(p, { type: "assessment-submit", room: 6, answers });
    expect(p.attempts[0].score).toBe(10);
  });
  it("failed assessment can be retried without resetting progress", () => {
    const p = act(assess(7), { type: "assessment-start", room: 6 });
    expect(p.assessment!.ids).toHaveLength(10);
    expect(p.attempts).toHaveLength(1);
    expect(p.completed).toHaveLength(5);
  });
  it("scores calculations once and rolls back failed room chain points", () => {
    let p = until(2);
    p = act(p, {
      type: "calculate",
      room: 2,
      calculationId: "F-baseline",
      value: 8,
    });
    p = act(p, {
      type: "calculate",
      room: 2,
      calculationId: "F-baseline",
      value: 8,
    });
    expect(p.score).toBe(10);
    p = chain(p, "F1");
    for (let i = 0; i < 3; i++)
      p = act(p, {
        type: "chain",
        room: 2,
        ids: ["F-O2", "F-M3", "F-T2", "F-I2"],
      });
    expect(p.score).toBe(0);
  });
});
describe("authoritative content import", () => {
  it("validates all 144 supplied options, 48 correct, 96 distractors and 12 chains", () => {
    expect(c.options).toHaveLength(144);
    expect(c.options.filter((o) => o.correct)).toHaveLength(48);
    expect(c.options.filter((o) => !o.correct)).toHaveLength(96);
    expect(c.theory.length).toBeGreaterThanOrEqual(30);
  });
  it("rejects duplicate IDs", () => {
    const raw = structuredClone(c);
    raw.options[1].id = raw.options[0].id;
    expect(() => validateContent(raw)).toThrow("Duplicate");
  });
  it("rejects incomplete or smaller sample banks", () =>
    expect(() =>
      validateContent({ ...c, options: c.options.slice(0, 100) }),
    ).toThrow("144"));
  it("rejects missing instructor explanations", () => {
    const raw = structuredClone(c);
    raw.options[8].explanation = "";
    expect(() => validateContent(raw)).toThrow();
  });
  it("rejects broken correct-chain membership", () => {
    const raw = structuredClone(c);
    raw.options[0].chainId = "F9";
    expect(() => validateContent(raw)).toThrow("mapping");
  });
  it("rejects incorrect expected calculation results", () => {
    const raw = structuredClone(c);
    raw.calculations[0].expected = 99;
    expect(() => validateContent(raw)).toThrow("expected result");
  });
  it("contains evidence for all targets", () =>
    expect(
      c.options.filter((o) => o.component === "T").every((o) => !!o.evidence),
    ).toBe(true));
});
