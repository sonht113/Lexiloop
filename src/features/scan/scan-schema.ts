import { z } from "zod";

const exampleSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  translation: z.string().trim().max(500).optional(),
});

export const extractedWordSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, "Word is required.")
    .max(80, "Word is too long."),
  meaning: z
    .string()
    .trim()
    .min(1, "Meaning is required.")
    .max(500, "Meaning is too long."),
  examples: z.array(exampleSchema).max(3),
});

export const scanResponseSchema = z.object({
  words: z.array(extractedWordSchema).max(50),
  remaining_scans: z.number(),
  reset_time: z.string(),
  message: z.string().optional(),
});

export const reviewWordSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, "Word is required.")
    .max(80, "Word is too long."),
  meaning: z
    .string()
    .trim()
    .min(1, "Meaning is required.")
    .max(500, "Meaning is too long."),
  examples: z
    .array(
      z.object({
        sentence: z
          .string()
          .trim()
          .max(500, "Example is too long.")
          .optional()
          .or(z.literal("")),
        translation: z
          .string()
          .trim()
          .max(500, "Translation is too long.")
          .optional()
          .or(z.literal("")),
      }),
    )
    .max(3),
});

export type ExtractedWordSchema = z.infer<typeof extractedWordSchema>;
export type ScanResponseSchema = z.infer<typeof scanResponseSchema>;
export type ReviewWordSchema = z.infer<typeof reviewWordSchema>;
