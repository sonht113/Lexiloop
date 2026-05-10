import { z } from 'zod';
import { deckIconKeys } from './deck-icons';

export const deckFormSchema = z.object({
  name: z.string().trim().min(1, 'Deck name is required.').max(60, 'Deck name is too long.'),
  description: z.string().trim().max(160, 'Description is too long.').optional().or(z.literal('')),
  icon: z.enum(deckIconKeys).optional(),
  color: z.string().optional(),
});

export type DeckFormValues = z.infer<typeof deckFormSchema>;
