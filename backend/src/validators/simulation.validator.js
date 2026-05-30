import { z } from "zod";

const toneSchema = z.enum(["confident", "balanced", "cautious"]);

export const simulationSessionSchema = z.object({
  body: z.object({
    roleSlug: z.string().trim().min(2).max(160),
    roleTitle: z.string().trim().min(2).max(200),
    tone: toneSchema,
    completionScore: z.number().min(0).max(100).optional(),
    choices: z.record(z.string(), z.string()).optional(),
    scenesCompleted: z.number().int().min(0).max(200),
    totalScenes: z.number().int().min(1).max(200),
    durationSeconds: z.number().int().min(0).max(7200).optional()
  }).superRefine((body, ctx) => {
    if (body.scenesCompleted > body.totalScenes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scenesCompleted"],
        message: "scenesCompleted cannot be greater than totalScenes"
      });
    }
  })
});
