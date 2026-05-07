import { AppText } from './app-text';

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <AppText className="text-sm text-danger">{message}</AppText>;
}
