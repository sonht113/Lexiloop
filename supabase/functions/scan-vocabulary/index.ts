// eslint-disable-next-line import/no-unresolved
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase Edge Function environment variables.");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type AuthResult =
  | { user: { id: string; email?: string }; error: null }
  | { user: null; error: Response };

/**
 * Validates the Authorization header and verifies the Supabase JWT.
 * Returns the authenticated user or an error response.
 */
async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: jsonResponse({ error: "Missing authorization token" }, 401),
    };
  }

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      user: null,
      error: jsonResponse({ error: "Invalid or expired token" }, 401),
    };
  }

  return { user: data.user, error: null };
}

const DAILY_SCAN_LIMIT = 10;
const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Returns the current calendar date string (YYYY-MM-DD) in the given timezone.
 */
function getCurrentDateInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Returns the ISO 8601 timestamp of midnight (start of next day) in the given timezone.
 */
function getNextMidnightInTimezone(timezone: string): string {
  const todayStr = getCurrentDateInTimezone(timezone);
  // Parse the date and compute next day
  const [year, month, day] = todayStr.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

  // Format next day as YYYY-MM-DD
  const nextDayStr = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDay.getUTCDate()).padStart(2, "0")}`;

  // Use Intl to find the UTC offset for the next day in the user's timezone
  const tempDate = new Date(`${nextDayStr}T00:00:00`);
  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "longOffset",
  });

  const parts = utcFormatter.formatToParts(tempDate);
  const tzOffset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";

  // Parse offset like "GMT+07:00" or "GMT-05:00"
  const offsetMatch = tzOffset.match(/GMT([+-])(\d{2}):(\d{2})/);
  let offsetMs = 0;
  if (offsetMatch) {
    const sign = offsetMatch[1] === "+" ? 1 : -1;
    const hours = parseInt(offsetMatch[2], 10);
    const minutes = parseInt(offsetMatch[3], 10);
    offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;
  }

  // Midnight in user's timezone = midnight UTC minus the offset
  const midnightUtc = new Date(`${nextDayStr}T00:00:00Z`);
  const midnightInTz = new Date(midnightUtc.getTime() - offsetMs);

  return midnightInTz.toISOString();
}

/**
 * Fetches the user's timezone from the profiles table.
 * Returns the default timezone if not found or null.
 */
async function getUserTimezone(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single();

  return data?.timezone || DEFAULT_TIMEZONE;
}

type RateLimitResult =
  | { allowed: true; remaining_scans: number; reset_time: string }
  | { allowed: false; remaining_scans: 0; reset_time: string };

/**
 * Atomically checks and increments the user's daily scan count.
 * Calls the `increment_scan_usage` database function which uses
 * INSERT ... ON CONFLICT with WHERE scan_count < 10 for atomicity.
 * Returns whether the scan is allowed, remaining scans, and reset time.
 */
async function checkAndIncrementRateLimit(
  userId: string,
): Promise<RateLimitResult> {
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get user timezone from profiles
  const timezone = await getUserTimezone(supabase, userId);

  // Compute current calendar date in user's timezone
  const scanDate = getCurrentDateInTimezone(timezone);

  // Compute reset time (midnight of next day in user's timezone)
  const resetTime = getNextMidnightInTimezone(timezone);

  // Atomic rate limit check and increment via database function
  // Returns the new scan_count if allowed, or null if limit reached
  const { data, error } = await supabase.rpc("increment_scan_usage", {
    p_user_id: userId,
    p_scan_date: scanDate,
    p_limit: DAILY_SCAN_LIMIT,
  });

  if (error) {
    // On unexpected error, deny the request to be safe
    console.error("Rate limit check error:", error);
    return { allowed: false, remaining_scans: 0, reset_time: resetTime };
  }

  // data is the new scan_count (integer) or null if limit was reached
  const scanCount = data as number | null;

  if (scanCount === null) {
    // Limit reached — no row was returned from the INSERT ... RETURNING
    return { allowed: false, remaining_scans: 0, reset_time: resetTime };
  }

  return {
    allowed: true,
    remaining_scans: DAILY_SCAN_LIMIT - scanCount,
    reset_time: resetTime,
  };
}

async function handleGet(req: Request): Promise<Response> {
  const auth = await validateAuth(req);
  if (auth.error) return auth.error;

  const userId = auth.user.id;

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get user timezone
  const timezone = await getUserTimezone(supabase, userId);

  // Compute current date in user's timezone
  const scanDate = getCurrentDateInTimezone(timezone);

  // Query current scan count for today
  const { data: usageRow } = await supabase
    .from("scan_usage")
    .select("scan_count")
    .eq("user_id", userId)
    .eq("scan_date", scanDate)
    .single();

  const scanCount = usageRow?.scan_count ?? 0;
  const remainingScans = Math.max(0, DAILY_SCAN_LIMIT - scanCount);

  // Compute reset time (midnight of next day in user's timezone)
  const resetTime = getNextMidnightInTimezone(timezone);

  return jsonResponse({
    remaining_scans: remainingScans,
    reset_time: resetTime,
  });
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ValidatedBody = {
  image_base64: string;
  deck_id: string;
};

/**
 * Validates the POST request body contains required fields:
 * - image_base64: non-empty string
 * - deck_id: valid UUID
 * Returns the validated body or a 400 error Response.
 */
async function validateRequestBody(
  req: Request,
): Promise<ValidatedBody | Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { image_base64, deck_id } = body as Record<string, unknown>;

  if (typeof image_base64 !== "string" || image_base64.length === 0) {
    return jsonResponse(
      { error: "Missing or invalid image_base64 field" },
      400,
    );
  }

  if (typeof deck_id !== "string" || !UUID_REGEX.test(deck_id)) {
    return jsonResponse({ error: "Missing or invalid deck_id field" }, 400);
  }

  return { image_base64, deck_id };
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-4o-mini";
const OPENROUTER_TIMEOUT_MS = 25_000;

const VOCABULARY_EXTRACTION_PROMPT = `You are a vocabulary extraction assistant. Analyze the image and extract vocabulary words visible in it.

Return a JSON object with a "words" array containing up to 50 vocabulary entries. Each entry must have:
- "word": the vocabulary term (string)
- "meaning": the definition or translation (string)
- "examples": an array of up to 3 usage examples, each with:
  - "sentence": an example sentence using the word (string)
  - "translation": optional translation of the sentence (string or omit)

If no vocabulary words are found in the image, return {"words": []}.

Return ONLY valid JSON. Do not include markdown formatting or code blocks.`;

// --- Zod schema for AI response validation ---

const aiExampleSchema = z.object({
  sentence: z.string().max(500),
  translation: z.string().max(500).optional(),
});

const aiWordSchema = z.object({
  word: z.string().max(80),
  meaning: z.string().max(500),
  examples: z.array(aiExampleSchema).max(3).default([]),
});

const aiResponseSchema = z.object({
  words: z.array(aiWordSchema).max(50).default([]),
});

type ValidatedAiResponse = z.infer<typeof aiResponseSchema>;

/**
 * Validates the raw AI response against the Zod schema.
 * Returns the parsed response if valid, or null if invalid.
 */
function validateAndExtractWords(
  rawResponse: unknown,
): ValidatedAiResponse | null {
  const result = aiResponseSchema.safeParse(rawResponse);
  if (result.success) {
    return result.data;
  }
  return null;
}

// --- Word filtering and response assembly (task 4.3) ---

type FilteredWord = {
  word: string;
  meaning: string;
  examples: Array<{ sentence: string; translation?: string }>;
};

/**
 * Filters out words with empty trimmed `word` or `meaning` fields,
 * truncates fields to max lengths, and limits examples to 3 per word.
 */
function filterAndAssembleWords(
  rawWords: Array<{
    word: string;
    meaning: string;
    examples: Array<{ sentence: string; translation?: string }>;
  }>,
): FilteredWord[] {
  return rawWords
    .filter(
      (entry) =>
        entry.word.trim().length > 0 && entry.meaning.trim().length > 0,
    )
    .map((entry) => ({
      word: entry.word.slice(0, 80),
      meaning: entry.meaning.slice(0, 500),
      examples: entry.examples.slice(0, 3).map((ex) => ({
        sentence: ex.sentence.slice(0, 500),
        ...(ex.translation !== undefined
          ? { translation: ex.translation.slice(0, 500) }
          : {}),
      })),
    }));
}

/**
 * Calls OpenRouter vision API to extract vocabulary from an image.
 * Uses google/gemini-2.0-flash with a structured prompt.
 * Enforces a 25-second timeout via AbortController.
 */
async function callOpenRouterVision(imageBase64: string): Promise<unknown> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY environment variable");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lexiloop.app",
        "X-Title": "LexiLoop",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VOCABULARY_EXTRACTION_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      throw new Error("Invalid OpenRouter response: missing content");
    }

    return JSON.parse(content);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenRouter request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handlePost(req: Request): Promise<Response> {
  const auth = await validateAuth(req);
  if (auth.error) return auth.error;

  const validationResult = await validateRequestBody(req);
  if (validationResult instanceof Response) {
    return validationResult;
  }

  const { image_base64, deck_id: _deck_id } = validationResult;

  // Rate limit check and increment
  const rateLimitResult = await checkAndIncrementRateLimit(auth.user.id);
  if (!rateLimitResult.allowed) {
    return jsonResponse(
      {
        error: `Daily scan limit reached (10 scans). Resets at ${rateLimitResult.reset_time}.`,
        reset_time: rateLimitResult.reset_time,
      },
      429,
    );
  }

  // Call OpenRouter vision API with retry on invalid response
  let aiResponse: unknown;
  try {
    aiResponse = await callOpenRouterVision(image_base64);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown AI error";

    if (message.includes("timed out")) {
      console.error("OpenRouter timeout");
      return jsonResponse({ error: "AI service timeout" }, 502);
    }

    if (message.includes("HTTP error")) {
      console.error("OpenRouter HTTP error:", message);
      return jsonResponse({ error: "AI service unavailable" }, 502);
    }

    console.error("OpenRouter error:", message);
    return jsonResponse({ error: "AI service unavailable" }, 502);
  }

  // Validate AI response with Zod schema
  let validated = validateAndExtractWords(aiResponse);

  if (!validated) {
    // First attempt failed validation — log and retry once
    console.error(
      "Invalid AI response (attempt 1):",
      JSON.stringify(aiResponse),
    );

    try {
      aiResponse = await callOpenRouterVision(image_base64);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown AI error";

      if (message.includes("timed out")) {
        console.error("OpenRouter timeout on retry");
        return jsonResponse({ error: "AI service timeout" }, 502);
      }

      if (message.includes("HTTP error")) {
        console.error("OpenRouter HTTP error on retry:", message);
        return jsonResponse({ error: "AI service unavailable" }, 502);
      }

      console.error("OpenRouter error on retry:", message);
      return jsonResponse({ error: "AI service unavailable" }, 502);
    }

    validated = validateAndExtractWords(aiResponse);

    if (!validated) {
      // Second attempt also failed validation
      console.error(
        "Invalid AI response (attempt 2):",
        JSON.stringify(aiResponse),
      );
      return jsonResponse({ error: "Could not process image" }, 422);
    }
  }

  // If AI returned zero words, return early with message
  if (validated.words.length === 0) {
    return jsonResponse({
      words: [],
      remaining_scans: rateLimitResult.remaining_scans,
      reset_time: rateLimitResult.reset_time,
      message: "No vocabulary words were found in the image.",
    });
  }

  // Filter and truncate words (task 4.3)
  const filteredWords = filterAndAssembleWords(validated.words);

  // Assemble final response
  return jsonResponse({
    words: filteredWords,
    remaining_scans: rateLimitResult.remaining_scans,
    reset_time: rateLimitResult.reset_time,
    ...(filteredWords.length === 0
      ? { message: "No valid vocabulary words were found in the image." }
      : {}),
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return await handleGet(req);
  }

  if (req.method === "POST") {
    return await handlePost(req);
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
