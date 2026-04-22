import { z } from "zod";

const uuidString = z.string().uuid();
const gameType = z.enum(["iq", "physiology"]);

export const actionEventSchema = z.object({
  body: z.object({
    gameId: z.string().trim().min(2).max(120),
    gameType,
    success: z.boolean(),
    level: z.number().int().min(1).max(10).optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
});

export const sessionEventSchema = z.object({
  body: z.object({
    gameId: z.string().trim().min(2).max(120),
    gameType,
    score: z.number().min(0).max(1000),
    accuracy: z.number().min(0).max(1),
    errors: z.number().int().min(0).max(10000),
    durationSeconds: z.number().int().min(1).max(7200),
    level: z.number().int().min(1).max(10),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
});

export const gameUserParamSchema = z.object({
  params: z.object({
    userId: uuidString.optional()
  })
});
