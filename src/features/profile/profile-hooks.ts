import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { ensureUserBootstrap } from '@/features/auth/user-bootstrap';
import type { Database } from '@/types/database';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const EXPORT_PAGE_SIZE = 500;
const EXPORT_VERSION = 1;
const EXPORT_MIME_TYPE = 'application/json';

type Deck = Database['public']['Tables']['decks']['Row'];
type Word = Database['public']['Tables']['words']['Row'];
type WordExample = Database['public']['Tables']['word_examples']['Row'];
type ReviewLog = Database['public']['Tables']['review_logs']['Row'];

type QueryError = {
  message: string;
};

type PagedResult<T> = {
  data: T[] | null;
  error: QueryError | null;
};

export function getProfileAvatarPublicUrl(path?: string | null) {
  if (!path) return null;
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function fetchPaged<T>(request: (from: number, to: number) => PromiseLike<PagedResult<T>>) {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + EXPORT_PAGE_SIZE - 1;
    const result = await request(from, to);
    if (result.error) throw result.error;

    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < EXPORT_PAGE_SIZE) return rows;

    from += EXPORT_PAGE_SIZE;
  }
}

export function useProfileStatsQuery() {
  return useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const profile = await ensureUserBootstrap();
      const [profileResult, statsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profile.id).single(),
        supabase.rpc('get_profile_stats'),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (statsResult.error) throw statsResult.error;

      return {
        profile: profileResult.data,
        totalWords: statsResult.data.total_words,
        masteredWords: statsResult.data.mastered_words,
        totalReviews: statsResult.data.total_reviews,
        reviewedToday: statsResult.data.reviewed_today,
        accuracy: statsResult.data.accuracy,
        currentStreak: statsResult.data.current_streak,
      };
    },
  });
}

function getAvatarExtension(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType && AVATAR_MIME_TO_EXTENSION[asset.mimeType]) return AVATAR_MIME_TO_EXTENSION[asset.mimeType];

  const uriExtension = asset.uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  if (uriExtension === 'jpeg') return 'jpg';
  if (uriExtension && ['jpg', 'png', 'webp'].includes(uriExtension)) return uriExtension;

  return 'jpg';
}

function getAvatarMimeType(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType && AVATAR_MIME_TO_EXTENSION[asset.mimeType]) return asset.mimeType;
  const extension = getAvatarExtension(asset);
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function assertSupportedAvatar(asset: ImagePicker.ImagePickerAsset, byteLength: number) {
  const mimeType = getAvatarMimeType(asset);
  if (!AVATAR_MIME_TO_EXTENSION[mimeType]) {
    throw new Error('Please choose a JPG, PNG, or WEBP image.');
  }

  if (byteLength > MAX_AVATAR_BYTES) {
    throw new Error('Avatar image must be 5 MB or smaller.');
  }
}

export function useUploadProfileAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Photo access is required to choose a profile avatar.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        exif: false,
        allowsMultipleSelection: false,
      });

      if (result.canceled || result.assets.length === 0) return null;

      const asset = result.assets[0];
      const profile = await ensureUserBootstrap();
      const arrayBuffer = await fetch(asset.uri).then((response) => response.arrayBuffer());
      assertSupportedAvatar(asset, arrayBuffer.byteLength);

      const extension = getAvatarExtension(asset);
      const mimeType = getAvatarMimeType(asset);
      const nextAvatarPath = `${profile.id}/${Date.now()}.${extension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(nextAvatarPath, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: uploadData.path })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (updateError) {
        await supabase.storage.from(AVATAR_BUCKET).remove([uploadData.path]).catch(() => undefined);
        throw updateError;
      }

      if (profile.avatar_url && profile.avatar_url.startsWith(`${profile.id}/`) && profile.avatar_url !== uploadData.path) {
        await supabase.storage.from(AVATAR_BUCKET).remove([profile.avatar_url]).catch(() => undefined);
      }

      return updatedProfile;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', 'stats'] });
    },
  });
}

export function useExportProfileDataMutation() {
  return useMutation({
    mutationFn: async () => {
      const profile = await ensureUserBootstrap();
      const [profileResult, decks, words, wordExamples, reviewLogs, reminderResult, learningSettingsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profile.id).single(),
        fetchPaged<Deck>((from, to) => supabase.from('decks').select('*').order('created_at', { ascending: true }).range(from, to)),
        fetchPaged<Word>((from, to) => supabase.from('words').select('*').order('created_at', { ascending: true }).range(from, to)),
        fetchPaged<WordExample>((from, to) => supabase.from('word_examples').select('*').order('sort_order', { ascending: true }).range(from, to)),
        fetchPaged<ReviewLog>((from, to) => supabase.from('review_logs').select('*').order('reviewed_at', { ascending: true }).range(from, to)),
        supabase.from('reminder_settings').select('*').maybeSingle(),
        supabase.from('learning_settings').select('*').maybeSingle(),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (reminderResult.error) throw reminderResult.error;
      if (learningSettingsResult.error) throw learningSettingsResult.error;

      const exportedAt = new Date().toISOString();
      const filename = `lexiloop-export-${exportedAt.replace(/[:.]/g, '-')}.json`;
      const payload = {
        exportedAt,
        exportVersion: EXPORT_VERSION,
        appVersion: '0.1.0',
        counts: {
          decks: decks.length,
          words: words.length,
          wordExamples: wordExamples.length,
          reviewLogs: reviewLogs.length,
        },
        data: {
          profile: profileResult.data,
          decks,
          words,
          wordExamples,
          reviewLogs,
          reminderSettings: reminderResult.data,
          learningSettings: learningSettingsResult.data,
        },
      };
      const text = JSON.stringify(payload, null, 2);
      const file = new File(Paths.cache, filename);
      file.create({ overwrite: true, intermediates: true });
      file.write(text);

      return {
        uri: file.uri,
        filename,
        mimeType: EXPORT_MIME_TYPE,
        textFallback: text.length <= 100_000 ? text : `LexiLoop export created: ${filename}`,
      };
    },
  });
}
