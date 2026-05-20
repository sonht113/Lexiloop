import { supabase } from "@/lib/supabase";
import type {
  ScanRequest,
  ScanResponse,
  ScanQuotaResponse,
  ScanError,
} from "@/features/scan/scan-types";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const SCAN_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/scan-vocabulary`;
const SCAN_TIMEOUT_MS = 30_000;

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const error: ScanError = {
      code: "AUTH",
      message: "Session expired",
      retryable: false,
    };
    throw error;
  }
  return session.access_token;
}

function buildHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
}

export async function submitScan(request: ScanRequest): Promise<ScanResponse> {
  const token = await getAccessToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  try {
    const response = await fetch(SCAN_FUNCTION_URL, {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({
        image_base64: request.image_base64,
        deck_id: request.deck_id,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return (await response.json()) as ScanResponse;
    }

    const body = await response.json().catch(() => ({}));

    const error = mapHttpError(response.status, body);
    throw error;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (isScanError(err)) {
      throw err;
    }

    if (isAbortError(err)) {
      const error: ScanError = {
        code: "TIMEOUT",
        message: "Request timed out",
        retryable: true,
      };
      throw error;
    }

    const error: ScanError = {
      code: "NETWORK",
      message: "Connection failed",
      retryable: true,
    };
    throw error;
  }
}

export async function fetchScanQuota(): Promise<ScanQuotaResponse> {
  const token = await getAccessToken();

  try {
    const response = await fetch(SCAN_FUNCTION_URL, {
      method: "GET",
      headers: buildHeaders(token),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        remaining_scans: data.remaining_scans,
        reset_time: data.reset_time,
      };
    }

    if (response.status === 401) {
      const error: ScanError = {
        code: "AUTH",
        message: "Session expired",
        retryable: false,
      };
      throw error;
    }

    const error: ScanError = {
      code: "UNKNOWN",
      message: "Something went wrong",
      retryable: true,
    };
    throw error;
  } catch (err: unknown) {
    if (isScanError(err)) {
      throw err;
    }

    const error: ScanError = {
      code: "NETWORK",
      message: "Connection failed",
      retryable: true,
    };
    throw error;
  }
}

function mapHttpError(
  status: number,
  body: Record<string, unknown>,
): ScanError {
  switch (status) {
    case 401:
      return { code: "AUTH", message: "Session expired", retryable: false };
    case 429:
      return {
        code: "RATE_LIMIT",
        message: (body.error as string) ?? "Daily limit reached",
        resetTime: body.reset_time as string | undefined,
        retryable: false,
      };
    case 422:
      return {
        code: "UNPROCESSABLE",
        message: "Could not read text from this image",
        retryable: true,
      };
    case 502:
      return {
        code: "UNAVAILABLE",
        message: "AI service temporarily unavailable",
        retryable: true,
      };
    default:
      return {
        code: "UNKNOWN",
        message: "Something went wrong",
        retryable: true,
      };
  }
}

function isScanError(err: unknown): err is ScanError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "retryable" in err
  );
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}
