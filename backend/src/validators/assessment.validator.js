import { z } from "zod";
import { QUESTION_CATEGORY_VALUES } from "../constants/assessment.js";

const assessmentKeyEnum = z.enum(["early_g5", "middle_g8", "stream_g910", "career_g11"]);

const uuidString = z.string().uuid();

const optionSchema = z.object({
  key: z.string().trim().min(1).max(10),
  text: z.string().trim().min(1).max(2000),
  isCorrect: z.boolean().optional(),
  weights: z.record(z.string(), z.number()).optional()
});

const questionBody = z.object({
  category: z.enum(QUESTION_CATEGORY_VALUES),
  stem: z.string().trim().min(4).max(5000),
  bigFiveKey: z.enum(["O", "C", "E", "A", "N"]).optional(),
  useLikert: z.boolean().optional(),
  options: z.array(optionSchema).default([]),
  order: z.number().optional(),
  active: z.boolean().optional()
});

const responseItemSchema = z.object({
  questionId: uuidString,
  category: z.enum(QUESTION_CATEGORY_VALUES).optional(),
  selectedOptionKey: z.string().trim().max(20).optional(),
  likertValue: z.number().int().min(1).max(5).optional(),
  writingText: z.string().max(10000).optional(),
  voiceTranscript: z.string().max(10000).optional(),
  mediaUrl: z.string().max(2000).optional()
});

export const saveResponsesSchema = z.object({
  params: z.object({ attemptId: uuidString }),
  body: z.object({
    responses: z.array(responseItemSchema).min(1)
  })
});

export const attemptIdParamSchema = z.object({
  params: z.object({ attemptId: uuidString })
});

export const createAttemptSchema = z.object({
  body: z.preprocess(
    (v) => (v != null && typeof v === "object" ? v : {}),
    z
      .object({
        assessmentKey: assessmentKeyEnum.optional()
      })
      .passthrough()
  )
});

export const getQuestionsQuerySchema = z.object({
  query: z.preprocess(
    (v) => (v != null && typeof v === "object" ? v : {}),
    z
      .object({
        assessmentKey: assessmentKeyEnum.optional()
      })
      .passthrough()
  )
});

export const createQuestionSchema = z.object({
  body: questionBody
});

export const updateQuestionSchema = z.object({
  params: z.object({ id: uuidString }),
  body: questionBody.partial()
});

export const questionIdParamSchema = z.object({
  params: z.object({ id: uuidString })
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1).max(2000),
    context: z.record(z.string(), z.any()).optional()
  })
});

export const adaptiveCareerQuizNextSchema = z.object({
  body: z.object({
    track: assessmentKeyEnum.optional(),
    targetQuestions: z.number().int().min(15).max(20).optional(),
    history: z
      .array(
        z.object({
          code: z.string().trim().min(1).max(64),
          domain: z.enum(["big5", "riasec"]).optional(),
          axis: z.string().trim().min(1).max(10).optional(),
          likertValue: z.number().int().min(1).max(5)
        })
      )
      .default([])
  })
});

export const reportIdParamSchema = z.object({
  params: z.object({ id: uuidString })
});
