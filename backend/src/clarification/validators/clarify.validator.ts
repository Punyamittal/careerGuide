import { z } from "zod";

export const flowSessionIdParamsSchema = z.object({
  params: z.object({
    flowSessionId: z.string().min(1, "flowSessionId is required")
  })
});

export const clarifyNextQuerySchema = z.object({
  params: z.object({
    flowSessionId: z.string().min(1)
  }),
  query: z.object({
    journeyId: z.string().optional(),
    batchSize: z.coerce.number().int().min(1).max(5).optional()
  })
});

export const clarifyResponseBodySchema = z.object({
  params: z.object({
    flowSessionId: z.string().min(1)
  }),
  body: z.object({
    clarificationSessionId: z.string().min(1),
    journeyId: z.string().min(1),
    itemId: z.string().min(1),
    selectedOption: z.union([z.number(), z.string()]),
    responseTimeMs: z.number().int().nonnegative().optional(),
    answerChangeCount: z.number().int().nonnegative().optional(),
    clientSeq: z.number().int().optional()
  })
});

export const clarifySimCompleteBodySchema = z.object({
  params: z.object({
    flowSessionId: z.string().min(1)
  }),
  body: z.object({
    clarificationSessionId: z.string().min(1),
    journeyId: z.string().min(1),
    simId: z.string().min(1),
    telemetry: z.record(z.string(), z.unknown()),
    compositeScore: z.number().min(0).max(1).optional(),
    dimensionScores: z.record(z.string(), z.number()).optional(),
    success: z.boolean().optional(),
    durationMs: z.number().int().nonnegative().optional()
  })
});

export type FlowSessionIdParams = z.infer<typeof flowSessionIdParamsSchema>["params"];
export type ClarifyNextQuery = z.infer<typeof clarifyNextQuerySchema>["query"];
export type ClarifyResponseBody = z.infer<typeof clarifyResponseBodySchema>["body"];
export type ClarifySimCompleteBody = z.infer<typeof clarifySimCompleteBodySchema>["body"];
