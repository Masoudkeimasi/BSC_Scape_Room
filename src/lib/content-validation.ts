import { z } from "zod";
import { Content, components, perspectives } from "./types";
const optionSchema = z.object({
  id: z.string().min(1),
  perspective: z.enum(perspectives),
  component: z.enum(components),
  text: z.string().min(1),
  correct: z.boolean(),
  chainId: z.string().nullable(),
  primaryCategory: z
    .string()
    .regex(/^D([1-9]|1[0-9]|2[0-6])$/)
    .nullable(),
  secondaryCategories: z.array(z.string().regex(/^D([1-9]|1[0-9]|2[0-6])$/)),
  explanation: z.string().min(1),
  feedback: z.string().min(1),
  evidence: z.string().min(1),
  calculationId: z.string().optional(),
});
export const contentSchema = z.object({
  settings: z
    .object({
      mistakeLimit: z.number().int().min(1).max(10),
      passThreshold: z.number().min(0.1).max(1),
      chainPoints: z.number().nonnegative(),
      cleanBonus: z.number().nonnegative(),
      calculationPoints: z.number().nonnegative(),
      assessmentPoints: z.number().nonnegative(),
    })
    .optional(),
  label: z.string().min(1),
  approved: z.boolean(),
  options: z.array(optionSchema),
  chains: z.array(
    z.object({
      id: z.string(),
      perspective: z.enum(perspectives),
      options: z.array(z.string()).length(4),
    }),
  ),
  calculations: z.array(
    z.object({
      id: z.string(),
      chainId: z.string(),
      title: z.string(),
      formula: z.string(),
      inputs: z.record(z.string(), z.number().finite()),
      expected: z.number().finite(),
      tolerance: z.number().nonnegative().max(1),
      unit: z.string(),
      kind: z.enum(["difference"]).optional(),
    }),
  ),
  vision: z
    .array(z.object({ id: z.string(), text: z.string(), correct: z.boolean() }))
    .length(9),
  theory: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["mcq", "boolean", "blank"]),
        prompt: z.string().min(1),
        choices: z.array(z.string()),
        answers: z.array(z.string().min(1)).min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(30),
  causalLinks: z.array(z.string()),
  review: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        table: z.array(z.array(z.string())).optional(),
      }),
    )
    .min(1),
});
export function validateContent(raw: unknown): Content {
  const c = contentSchema.parse(raw);
  const errors: string[] = [];
  if (c.options.length !== 128) errors.push("Expected exactly 128 options");
  if (new Set(c.options.map((o) => o.id)).size !== c.options.length)
    errors.push("Duplicate option IDs");
  if (c.chains.length !== 12 || new Set(c.chains.map((x) => x.id)).size !== 12)
    errors.push("Expected 12 unique chains");
  for (const p of perspectives)
    for (const t of components) {
      const a = c.options.filter(
        (o) => o.perspective === p && o.component === t,
      );
      if (a.length !== 8 || a.filter((o) => o.correct).length !== 3)
        errors.push(`${p}/${t}: require 8 options, 3 correct, 5 distractors`);
    }
  for (const o of c.options) {
    if (o.correct) {
      const chain = c.chains.find((x) => x.id === o.chainId);
      if (
        !chain ||
        chain.perspective !== o.perspective ||
        !chain.options.includes(o.id)
      )
        errors.push(`${o.id}: invalid chain mapping`);
    } else if (!o.primaryCategory || o.chainId)
      errors.push(`${o.id}: distractor category/mapping invalid`);
    if (
      o.calculationId &&
      !c.calculations.some(
        (x) => x.id === o.calculationId && x.chainId === o.chainId,
      )
    )
      errors.push(`${o.id}: missing/misaligned calculation`);
  }
  for (const chain of c.chains) {
    const opts = chain.options.map((id) => c.options.find((o) => o.id === id));
    if (
      components.some(
        (t) =>
          opts.filter(
            (o) =>
              o?.correct &&
              o.component === t &&
              o.perspective === chain.perspective &&
              o.chainId === chain.id,
          ).length !== 1,
      )
    )
      errors.push(`${chain.id}: invalid O–M–T–I chain`);
  }
  if (
    c.vision.filter((x) => x.correct).length !== 3 ||
    new Set(c.vision.map((x) => x.id)).size !== 9
  )
    errors.push("Vision requires 3 correct, 6 distractors and unique IDs");
  if (new Set(c.theory.map((q) => q.id)).size !== c.theory.length)
    errors.push("Duplicate theory IDs");
  for (const q of c.theory)
    if (
      q.type !== "blank" &&
      (!q.answers.every((a) => q.choices.includes(a)) ||
        new Set(q.choices).size !== q.choices.length)
    )
      errors.push(`${q.id}: invalid choices`);
  if (new Set(c.calculations.map((x) => x.id)).size !== c.calculations.length)
    errors.push("Duplicate calculation IDs");
  for (const calc of c.calculations) {
    if (
      !c.chains.some((x) => x.id === calc.chainId) ||
      Object.keys(calc.inputs).length < 2
    )
      errors.push(`${calc.id}: invalid inputs/chain`); // Formulas are displayed, never evaluated as code.
    const v = Object.values(calc.inputs);
    const expected =
      calc.kind === "difference"
        ? v[0] - v[1]
        : calc.id.startsWith("F-")
          ? (v[0] / ((v[1] + v[2]) / 2)) * 100
          : calc.id.startsWith("P-")
            ? v[0] * (1 - v[1])
            : (v[0] / v[1]) * 100;
    if (
      !Number.isFinite(expected) ||
      Math.abs(expected - calc.expected) > calc.tolerance
    )
      errors.push(
        `${calc.id}: expected result does not match the defined calculation convention`,
      );
  }
  for (const link of c.causalLinks) {
    const [a, b] = link.split(">");
    const pa = c.chains.find((x) => x.id === a)?.perspective;
    const pb = c.chains.find((x) => x.id === b)?.perspective;
    if (!pa || !pb || perspectives.indexOf(pa) - perspectives.indexOf(pb) !== 1)
      errors.push(`${link}: link must connect adjacent perspective tiers`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return c;
}
