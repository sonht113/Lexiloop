export type ExtractedWord = {
  id: string; // client-generated UUID for list key
  word: string;
  meaning: string;
  examples: {
    sentence: string;
    translation?: string;
  }[];
  phonetic?: string | null;
  audioUrl?: string | null;
};

export type ScanError = {
  code:
    | "AUTH"
    | "RATE_LIMIT"
    | "UNPROCESSABLE"
    | "UNAVAILABLE"
    | "NETWORK"
    | "TIMEOUT"
    | "UNKNOWN";
  message: string;
  resetTime?: string;
  retryable: boolean;
};

export type BulkInsertResult = {
  inserted: number;
  skipped: number;
  failed: number;
  remainingWords: ExtractedWord[];
};

export type ScanResponse = {
  words: ExtractedWord[];
  remaining_scans: number;
  reset_time: string;
  message?: string;
};

export type ScanQuotaResponse = {
  remaining_scans: number;
  reset_time: string;
};

export type ScanRequest = {
  image_base64: string;
  deck_id: string;
};

export type CompressionResult = {
  base64: string;
  sizeBytes: number;
};

export type CompressionError = {
  code: "TOO_LARGE" | "UNSUPPORTED_FORMAT" | "COMPRESSION_FAILED";
  message: string;
};
