import { z } from "zod";

export const socCodeParamSchema = z.object({
  params: z.object({
    socCode: z.string().min(3).max(20)
  })
});

export const occupationSearchQuerySchema = z.object({
  query: z.object({
    q: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    offset: z.coerce.number().int().min(0).optional()
  })
});

export const benchmarkQuerySchema = z.object({
  params: z.object({
    socCode: z.string().min(3).max(20)
  }),
  query: z.object({
    attemptId: z.string().uuid().optional()
  })
});

export const skillGapBodySchema = z.object({
  body: z.object({
    attemptId: z.string().uuid().optional(),
    socCode: z.string().min(3).max(20)
  })
});

export const roadmapBodySchema = z.object({
  body: z.object({
    attemptId: z.string().uuid().optional(),
    socCode: z.string().min(3).max(20)
  })
});
