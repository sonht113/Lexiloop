import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be at most 30 characters.')
  .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers and underscores only.');

export function usernameToInternalEmail(username: string) {
  return `${usernameSchema.parse(username)}@lexiloop.local`;
}
