import { z } from 'zod';

export const wordFormSchema = z.object({
  deck_id: z.string().uuid('Choose a deck.'),
  word: z.string().trim().min(1, 'Word is required.').max(80, 'Word is too long.'),
  meaning: z.string().trim().min(1, 'Meaning is required.').max(500, 'Meaning is too long.'),
  example: z.string().trim().max(500, 'Example is too long.').optional().or(z.literal('')),
  note: z.string().trim().max(500, 'Note is too long.').optional().or(z.literal('')),
  phonetic: z.string().trim().optional().or(z.literal('')),
  audio_url: z.string().trim().url('Invalid audio URL.').optional().or(z.literal('')),
});

export type WordFormValues = z.infer<typeof wordFormSchema>;
