import {
  ROOM_IDS,
  ROOM_COUNT,
  KNOWLEDGE_ROOM,
  STRATEGY_MAP_ROOM,
  isPuzzleOrder,
  isPuzzleSolved,
} from "./mission";
import {
  Action,
  Content,
  Progress,
  RoomState,
  components,
  perspectives,
} from "./types";
export function shuffle<T>(a: T[]): T[] {
  const copy = [...a];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export const newRoom = (): RoomState => ({
  rows: [],
  mistakes: 0,
  restarts: 0,
  incorrect: 0,
  calculations: {},
  calculationErrors: 0,
  mapDone: false,
});
export const initialProgress = (
  id: string,
  name = "Anonymous strategist",
): Progress => ({
  id,
  name,
  completed: [],
  rooms: Object.fromEntries(ROOM_IDS.map((r) => [r, newRoom()])),
  score: 0,
  attempts: [],
  events: [],
});
export const unlocked = (p: Progress, r: number) =>
  Number.isInteger(r) &&
  r >= 1 &&
  r <= ROOM_COUNT &&
  (r === 1 || p.completed.includes(r - 1));
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
export function applyAction(previous: Progress, action: Action, c: Content) {
  const settings = c.settings ?? {
    mistakeLimit: 3,
    passThreshold: 0.75,
    chainPoints: 20,
    cleanBonus: 50,
    calculationPoints: 10,
    assessmentPoints: 10,
  };
  const p = structuredClone(previous);
  const room = action.room ?? 1;
  let message = "";
  let feedback: unknown = undefined;
  if (!unlocked(p, room))
    throw new Error("Room locked. Complete the previous room first.");
  const s = p.rooms[room];
  if (p.completed.includes(room))
    throw new Error("Completed rooms are read-only.");
  const finish = () => {
    p.completed.push(room);
    message =
      room === KNOWLEDGE_ROOM
        ? "YOU ARE FREE!"
        : "ROOM COMPLETED! THE NEXT ROOM IS NOW UNLOCKED.";
  };
  const record = (kind: string, optionIds: string[] = []) =>
    p.events.push({ room, optionIds, kind, date: new Date().toISOString() });
  const mistake = () => {
    s.mistakes++;
    s.incorrect++;
    record("incorrect", action.ids);
    message =
      s.mistakes === 1
        ? "Check strategic alignment: does every component support the same outcome?"
        : "Check the objective–measure, measure–target and target–initiative relationships, including baseline direction.";
    if (s.mistakes >= settings.mistakeLimit) {
      const reset = newRoom();
      reset.restarts = s.restarts + 1;
      reset.incorrect = s.incorrect;
      reset.calculationErrors = s.calculationErrors;
      p.score = Math.max(
        0,
        p.score -
          s.rows.length * settings.chainPoints -
          Object.keys(s.calculations).length * settings.calculationPoints,
      );
      p.rooms[room] = reset;
      message =
        room === 1
          ? "VISION VAULT FAILED — selections cleared. Restart this room."
          : "PERSPECTIVE FAILED — RESTART REQUIRED. Current room reset; earlier rooms preserved.";
      record("restart");
    }
  };
  if (action.type === "vision") {
    if (
      room !== 1 ||
      action.ids?.length !== 3 ||
      new Set(action.ids).size !== 3
    )
      throw new Error("Choose exactly three statements.");
    if (
      action.ids.every((id) => c.vision.some((v) => v.id === id && v.correct))
    ) {
      s.vision = action.ids;
      finish();
      record("completed");
    } else mistake();
  } else if (action.type === "calculate") {
    const calc = c.calculations.find(
      (x) =>
        x.id === action.calculationId &&
        perspectives[room - 2] === x.chainId[0],
    );
    if (!calc || !Number.isFinite(action.value))
      throw new Error("Invalid calculation input.");
    if (Math.abs(action.value! - calc.expected) <= calc.tolerance) {
      if (!(calc.id in s.calculations)) p.score += settings.calculationPoints;
      s.calculations[calc.id] = action.value!;
      message =
        "Baseline confirmed. Use it to judge the target’s direction and magnitude.";
      record("calculation-correct");
    } else {
      s.calculationErrors++;
      message =
        "Incorrect numerical baseline. Recheck the formula, denominator and units. Chain mistakes are unchanged.";
      record("calculation-error");
    }
  } else if (action.type === "chain") {
    if (room < 2 || room > 5 || s.rows.length >= 3)
      throw new Error("No active strategy row.");
    const ids = action.ids ?? [];
    const used = s.rows.flat();
    if (
      ids.length !== 4 ||
      new Set(ids).size !== 4 ||
      ids.some((id) => used.includes(id))
    )
      throw new Error("Fill four distinct, unused component slots.");
    const opts = ids.map((id) => c.options.find((o) => o.id === id));
    if (
      opts.some(
        (o, i) =>
          !o ||
          o.component !== components[i] ||
          o.perspective !== perspectives[room - 2],
      )
    )
      throw new Error("Incorrect component type or perspective.");
    const prereq = opts.find((o) => o?.calculationId)?.calculationId;
    if (prereq && !(prereq in s.calculations))
      throw new Error(
        "Complete the linked baseline calculation before validating this chain.",
      );
    const chain = c.chains.find((ch) =>
      ch.options.every((id, i) => id === ids[i]),
    );
    if (chain) {
      s.rows.push(ids);
      p.score += settings.chainPoints;
      record("chain-correct", ids);
      message = "Strategic chain confirmed. Row locked; the next row is ready.";
      if (s.rows.length === 3) {
        if (s.mistakes === 0) p.score += settings.cleanBonus;
        finish();
      }
    } else {
      mistake();
      const bad = opts.find((o) => !o?.correct);
      if (p.rooms[room].mistakes) {
        message +=
          " " +
          (bad?.primaryCategory === "D25"
            ? "Wrong direction of improvement: compare the target with the baseline."
            : bad?.primaryCategory === "D6"
              ? "Wrong Balanced Scorecard perspective."
              : bad?.primaryCategory === "D10"
                ? "Unsupported or unrealistic target."
                : bad?.primaryCategory === "D26"
                  ? "D26: a valid perspective-level option belongs to a different strategic chain."
                  : opts[0]?.chainId !== opts[1]?.chainId
                    ? "Wrong objective–measure relationship."
                    : opts[1]?.chainId !== opts[2]?.chainId
                      ? "Wrong measure–target relationship."
                      : "Wrong target–initiative relationship.");
      }
    }
  } else if (action.type === "puzzle-start") {
    if (room !== STRATEGY_MAP_ROOM)
      throw new Error("The picture puzzle is in the Strategy Map Vault.");
    if (!s.puzzle) {
      let order = shuffle(Array.from({ length: 16 }, (_, i) => i));
      if (isPuzzleSolved(order)) [order[0], order[1]] = [order[1], order[0]];
      s.puzzle = order;
    }
    message =
      "Arrange the sixteen pieces to reconstruct the complete Strategy Map. Drag, or select two pieces to swap them.";
  } else if (action.type === "puzzle-submit") {
    if (room !== STRATEGY_MAP_ROOM || !s.puzzle)
      throw new Error("Start the Strategy Map puzzle first.");
    if (!isPuzzleOrder(action.order))
      throw new Error(
        "The puzzle must contain all sixteen distinct pieces exactly once.",
      );
    s.puzzle = [...action.order];
    if (isPuzzleSolved(action.order)) {
      s.mapDone = true;
      finish();
      record("puzzle-completed");
    } else {
      s.incorrect++;
      record("puzzle-incorrect");
      message =
        "The picture is not complete yet. Look at the borders, text and arrows, then rearrange the pieces. Earlier vaults remain secured.";
    }
  } else if (action.type === "assessment-start") {
    if (room !== KNOWLEDGE_ROOM)
      throw new Error("Assessment is in the Knowledge Vault (Room 7).");
    if (!p.assessment) {
      const qs = shuffle(c.theory).slice(0, 10);
      p.assessment = {
        ids: qs.map((q) => q.id),
        choices: Object.fromEntries(qs.map((q) => [q.id, shuffle(q.choices)])),
      };
    }
    message = "Ten questions selected. Each question is worth one mark.";
  } else if (action.type === "assessment-submit") {
    if (room !== KNOWLEDGE_ROOM || !p.assessment)
      throw new Error("Start an assessment first.");
    const qs = p.assessment.ids.map((id) => c.theory.find((q) => q.id === id)!);
    if (qs.some((q) => !action.answers?.[q.id]?.trim()))
      throw new Error("Answer all ten questions.");
    const results = qs.map((q) => ({
      id: q.id,
      correct: q.answers.some((a) => norm(a) === norm(action.answers![q.id])),
      explanation: q.explanation,
    }));
    const score = results.filter((r) => r.correct).length;
    p.attempts.push({
      score,
      date: new Date().toISOString(),
      questions: p.assessment.ids,
    });
    delete p.assessment;
    feedback = results;
    record("assessment");
    if (score >= Math.ceil(10 * settings.passThreshold)) {
      p.score += score * settings.assessmentPoints;
      p.finishedAt = new Date().toISOString();
      p.certificateId = `PF-${p.id.slice(0, 8)}-${p.attempts.length}`;
      finish();
    } else
      message = `THE VAULT REMAINS LOCKED — ${score}/10 (${score * 10}%). You need at least ${settings.passThreshold * 100}% (${Math.ceil(10 * settings.passThreshold)}/10). Review the concepts and retry the Knowledge Vault.`;
  } else throw new Error("Unknown action.");
  return { progress: p, message, feedback };
}
