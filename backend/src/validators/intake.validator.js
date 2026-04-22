import { z } from "zod";

const edu = z.enum([
  "below_10",
  "class_10",
  "class_11",
  "class_12",
  "college_y1",
  "bachelors_y2",
  "bachelors_y3",
  "bachelors_y4",
  "postgrad_other"
]);

export const patchIntakeSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
  body: z
    .object({
      age: z.number().int().min(8).max(80),
      gender: z.enum(["female", "male", "non_binary", "prefer_not", "self_describe"]),
      genderSelfDescribe: z.string().trim().max(80).optional(),
      educationLevel: edu,
      projectsSummary: z.string().trim().max(8000).optional().default(""),
      leadershipFollowership: z.number().int().min(1).max(5),
      individualismGroupism: z.number().int().min(1).max(5),
      classroomPreference: z.enum(["alone", "group"]),
      socialTalkingEnjoy: z.enum(["yes", "sometimes", "no"]),
      communicationEffort: z.enum(["effort", "effortless", "mixed"]),
      energyRecharge: z.enum(["alone", "people", "both"]),
      devicePreference: z.enum(["phone", "computer", "both"]),
      interestFocus: z.enum(["tools_technology", "people_world", "both"]),
      subjectOrientation: z.enum(["stem", "humanities_social", "both"]),
      motivationDriver: z.enum(["money", "recognition", "impact", "stability", "unsure"]),
      workSetting: z.enum(["inside", "outside", "mixed"]),
      workStyle: z.enum(["individual", "group", "both"]),
      publicExposure: z.enum(["low", "medium", "high"]),
      parentCareerExpectation: z.enum(["specific_career", "broad_field", "my_choice", "low_pressure", "unsure"]),
      supportSources: z.array(z.enum(["parents", "friends", "teachers", "mentors", "self"])).max(6).default([]),
      problemAreas: z
        .array(
          z.enum([
            "studies_subjects",
            "family_pressure",
            "friends_social",
            "communication",
            "decision_confusion",
            "resources_access",
            "motivation",
            "none"
          ])
        )
        .max(12)
        .default([]),
      learningApproach: z.enum(["procedural", "explanatory", "mixed"]),
      psychologyAwareness: z.enum(["yes", "partial", "no"]),
      wellbeingSelfReport: z.enum(["good", "okay", "low", "prefer_not"]),
      ambitionNotes: z.string().trim().max(2000).optional().default(""),
      skillsSelfReport: z.string().trim().max(4000).optional().default(""),
      comfort: z
        .object({
          blood_syringe: z.number().int().min(1).max(10).optional(),
          cook_food: z.number().int().min(1).max(10).optional(),
          clean_space: z.number().int().min(1).max(10).optional(),
          talk_favors: z.number().int().min(1).max(10).optional(),
          negotiate_shop: z.number().int().min(1).max(10).optional(),
          fix_tech: z.number().int().min(1).max(10).optional(),
          selfies_photos: z.number().int().min(1).max(10).optional(),
          mathematics: z.number().int().min(1).max(10).optional(),
          routine_tasks: z.number().int().min(1).max(10).optional(),
          impress_others: z.number().int().min(1).max(10).optional(),
          extreme_climate: z.number().int().min(1).max(10).optional(),
          dangerous_situations: z.number().int().min(1).max(10).optional(),
          work_discipline: z.number().int().min(1).max(10).optional(),
          impress_parents: z.number().int().min(1).max(10).optional(),
          talk_phone: z.number().int().min(1).max(10).optional()
        })
        .strict()
        .optional()
    })
    .strict()
    .refine(
      (b) =>
        b.gender !== "self_describe" ||
        (typeof b.genderSelfDescribe === "string" && b.genderSelfDescribe.trim().length > 0),
      { message: "genderSelfDescribe is required when gender is self_describe", path: ["genderSelfDescribe"] }
    )
});
