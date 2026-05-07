import { z } from 'zod';

export const deckFormSchema = z.object({
  name: z.string().trim().min(1, 'Deck name is required.').max(60, 'Deck name is too long.'),
  description: z.string().trim().max(160, 'Description is too long.').optional().or(z.literal('')),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type DeckFormValues = z.infer<typeof deckFormSchema>;
