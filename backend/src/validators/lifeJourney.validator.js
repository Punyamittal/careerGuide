import { z } from "zod";

const signalSchema = z.object({
  signal: z.string(),
  weight: z.number().min(0).max(1),
  mbsConstructs: z.array(z.string()).optional()
});

export const createLifeJourneyEventSchema = z.object({
  body: z.object({
    lifeStage: z.string().min(1),
    eventType: z.string().min(1),
    domain: z.string().min(1),
    subcategory: z.string().min(1),
    eventLabel: z.string().min(2).max(500),
    customEvent: z.boolean().optional(),
    impacts: z.array(z.string()).min(1),
    intensity: z.number().int().min(1).max(5),
    emotions: z.array(z.string()).min(1),
    reflectionLens: z.string().min(1),
    signalMap: z.array(signalSchema).optional(),
    notes: z.string().max(2000).optional()
  })
});

export const lifeJourneyEventIdSchema = z.object({
  params: z.object({
    eventId: z.string().uuid()
  })
});
