export type DictionaryPronunciation = {
  phonetic: string | null;
  audioUrl: string | null;
};

export async function fetchDictionaryPronunciation(word: string): Promise<DictionaryPronunciation> {
  const query = word.trim();
  if (query.length < 2) return { phonetic: null, audioUrl: null };

  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
  if (!response.ok) return { phonetic: null, audioUrl: null };

  const data = await response.json();
  const entry = Array.isArray(data) ? data[0] : null;
  const phonetic = entry?.phonetic ?? entry?.phonetics?.find((item: any) => item?.text)?.text ?? null;
  const audioUrl = entry?.phonetics?.find((item: any) => item?.audio)?.audio ?? null;

  return { phonetic, audioUrl };
}
