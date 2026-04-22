import { z } from "zod";

export const patchMeSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      preferences: z
        .object({
          emailDigest: z.boolean().optional(),
          compactSidebarHints: z.boolean().optional()
        })
        .optional()
    })
    .refine((body) => body.name !== undefined || body.preferences !== undefined, {
      message: "Provide name and/or preferences to update"
    })
});
