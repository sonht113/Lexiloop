export type DictionaryPronunciation = {
  phonetic: string | null;
  audioUrl: string | null;
};

type DictionaryPhonetic = {
  text?: unknown;
  audio?: unknown;
};

type DictionaryEntry = {
  phonetic?: unknown;
  phonetics?: unknown;
};

function isDictionaryEntry(value: unknown): value is DictionaryEntry {
  return Boolean(value && typeof value === 'object');
}

function isDictionaryPhonetic(value: unknown): value is DictionaryPhonetic {
  return Boolean(value && typeof value === 'object');
}

export async function fetchDictionaryPronunciation(word: string): Promise<DictionaryPronunciation> {
  const query = word.trim();
  if (query.length < 2) return { phonetic: null, audioUrl: null };

  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
  if (!response.ok) return { phonetic: null, audioUrl: null };

  const data = await response.json();
  const entry = Array.isArray(data) && isDictionaryEntry(data[0]) ? data[0] : null;
  const phonetics = Array.isArray(entry?.phonetics) ? entry.phonetics.filter(isDictionaryPhonetic) : [];
  const phoneticMatch = phonetics.find((item) => typeof item.text === 'string');
  const audioMatch = phonetics.find((item) => typeof item.audio === 'string' && item.audio.length > 0);
  const phonetic = typeof entry?.phonetic === 'string' ? entry.phonetic : typeof phoneticMatch?.text === 'string' ? phoneticMatch.text : null;
  const audioUrl = typeof audioMatch?.audio === 'string' ? audioMatch.audio : null;

  return { phonetic, audioUrl };
}
