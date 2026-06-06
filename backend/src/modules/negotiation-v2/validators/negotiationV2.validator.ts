import { z } from "zod";
import { NEGOTIATION_BRANCHES } from "../constants/scenario.js";

export const startSessionSchema = z.object({
  body: z
    .object({
      flowSessionId: z.string().optional(),
      clarificationSessionId: z.string().optional()
    })
    .optional()
});

export const sessionIdParamsSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1)
  })
});

export const actionBodySchema = z.object({
  params: z.object({
    sessionId: z.string().min(1)
  }),
  body: z.object({
    branch: z.enum(NEGOTIATION_BRANCHES),
    tradePackage: z.enum(["drop_nice_to_have", "add_contractor_day", "phased_launch"]).optional(),
    interestSummaryText: z.string().max(500).optional(),
    clientTimestampMs: z.number().int().optional()
  })
});

export type ActionBody = z.infer<typeof actionBodySchema>["body"];
