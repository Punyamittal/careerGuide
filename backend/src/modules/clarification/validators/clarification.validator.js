import { z } from "zod";

export const createFlowSessionSchema = z.object({
  body: z.object({
    intake: z
      .object({
        role_target: z.string().optional(),
        region: z.string().optional(),
        declared_sector: z.string().optional(),
        target_sector: z.string().optional(),
        single_offer_flag: z.boolean().optional(),
        accommodation: z
          .object({
            extended_time: z.boolean().optional(),
            latency_penalty_disabled: z.boolean().optional()
          })
          .optional()
      })
      .optional()
  })
});

export const flowSessionIdParams = z.object({
  params: z.object({
    flowSessionId: z.string().min(1)
  })
});

export const updateFlowPhaseSchema = z.object({
  params: z.object({
    flowSessionId: z.string().min(1)
  }),
  body: z.object({
    phase: z.string(),
    constructSnapshot: z.record(z.string(), z.unknown()).optional(),
    telemetry: z.record(z.string(), z.unknown()).optional(),
    validityFlags: z.record(z.string(), z.unknown()).optional()
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

export const clarifyResponseSchema = z.object({
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

export const clarifySimCompleteSchema = z.object({
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
