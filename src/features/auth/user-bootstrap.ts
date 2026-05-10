import { useQuery } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { usernameSchema } from './auth-utils';

function getBootstrapUsername(user: User) {
  const metadataUsername = typeof user.user_metadata?.username === 'string' ? user.user_metadata.username : '';
  const emailUsername = user.email?.split('@')[0] ?? '';
  const parsed = usernameSchema.safeParse(metadataUsername || emailUsername);
  if (parsed.success) return parsed.data;
  return `user_${user.id.replace(/-/g, '').slice(0, 12)}`;
}

export async function ensureUserBootstrap() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Not authenticated');

  const { data: existingProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userData.user.id).maybeSingle();
  if (profileError) throw profileError;

  if (!existingProfile) {
    const preferredUsername = getBootstrapUsername(userData.user);
    const { data: createdProfile, error: createdError } = await supabase
      .from('profiles')
      .insert({ id: userData.user.id, username: preferredUsername })
      .select('*')
      .single();

    if (createdError) {
      const fallbackUsername = `user_${userData.user.id.replace(/-/g, '').slice(0, 12)}`;
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('profiles')
        .upsert({ id: userData.user.id, username: fallbackUsername }, { onConflict: 'id' })
        .select('*')
        .single();
      if (fallbackError) throw createdError;
      const { error: deckError } = await supabase.rpc('ensure_default_deck', { p_user_id: userData.user.id });
      if (deckError) throw deckError;
      return fallbackProfile;
    } else {
      const { error: deckError } = await supabase.rpc('ensure_default_deck', { p_user_id: userData.user.id });
      if (deckError) throw deckError;
      return createdProfile;
    }
  }

  const { error: deckError } = await supabase.rpc('ensure_default_deck', { p_user_id: userData.user.id });
  if (deckError) throw deckError;

  return existingProfile;
}

export function useUserBootstrapQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'bootstrap'],
    enabled,
    queryFn: ensureUserBootstrap,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  });
}
