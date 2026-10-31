import { ROOM_IDS, ROOM_COUNT, isPuzzleOrder } from "./mission";
import { z } from "zod";
export const progressSchema = z
  .object({
    id: z.string(),
    name: z.string().max(80),
    completed: z.array(z.number().int().min(1).max(ROOM_COUNT)),
    rooms: z.record(
      z.string(),
      z.object({
        rows: z.array(z.array(z.string()).length(4)).max(3),
        mistakes: z.number().int().min(0).max(9),
        restarts: z.number().nonnegative(),
        incorrect: z.number().nonnegative(),
        calculations: z.record(z.string(), z.number()),
        calculationErrors: z.number().nonnegative(),
        mapDone: z.boolean(),
        puzzle: z
          .array(z.number().int())
          .refine(isPuzzleOrder, "Invalid puzzle permutation")
          .optional(),
        map: z
          .object({
            placements: z.record(z.string(), z.string()),
            links: z.array(z.string()),
            explanation: z.string(),
          })
          .optional(),
        vision: z.array(z.string()).optional(),
      }),
    ),
    score: z.number().nonnegative(),
    attempts: z.array(
      z.object({
        score: z.number().int().min(0).max(10),
        date: z.string(),
        questions: z.array(z.string()),
      }),
    ),
    assessment: z
      .object({
        ids: z.array(z.string()).length(10),
        choices: z.record(z.string(), z.array(z.string())),
      })
      .optional(),
    finishedAt: z.string().optional(),
    certificateId: z.string().optional(),
    contentVersion: z.string().optional(),
    events: z.array(
      z.object({
        room: z.number(),
        optionIds: z.array(z.string()),
        kind: z.string(),
        date: z.string(),
      }),
    ),
  })
  .refine(
    (p) =>
      ROOM_IDS.every((r) => p.rooms[r]) &&
      p.completed.every((r, i) => r === i + 1),
    "Invalid room progression",
  );
