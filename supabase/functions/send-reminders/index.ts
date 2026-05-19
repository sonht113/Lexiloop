import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type ReminderSetting = {
  user_id: string;
  time: string;
  repeat_days: number[];
  message: string;
};

type Profile = {
  id: string;
  timezone: string | null;
};

type PushToken = {
  user_id: string;
  token: string;
};

type DeliveryLog = {
  status: "processing" | "sent" | "failed";
  updated_at: string;
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data: {
    source: "lexiloop-reminder";
  };
};

type DateTimePart = "year" | "month" | "day" | "hour" | "minute" | "weekday";

const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CRON_SECRET_HEADER = "x-lexiloop-cron-secret";
const PROCESSING_RETRY_AFTER_MS = 2 * 60 * 1000;

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const reminderCronSecret = Deno.env.get("REMINDER_CRON_SECRET");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase Edge Function environment variables.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function getLocalParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);

  const part = (type: DateTimePart) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
    weekday: weekdayMap[part("weekday")] ?? -1,
  };
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown reminder push error.";
}

function parseExpoTickets(payload: unknown, expectedCount: number) {
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("Expo push response is missing data.");
  }

  const data = (payload as { data: unknown }).data;
  const tickets = Array.isArray(data) ? data : [data];
  if (tickets.length !== expectedCount) {
    throw new Error(`Expo push response ticket count mismatch. Expected ${expectedCount}, received ${tickets.length}.`);
  }

  return tickets.map((ticket): ExpoTicket => {
    if (!ticket || typeof ticket !== "object" || !("status" in ticket)) {
      throw new Error("Expo push response contains an invalid ticket.");
    }

    return ticket as ExpoTicket;
  });
}

async function reserveDelivery(userId: string, reminderDate: string, reminderTime: string) {
  const key = {
    user_id: userId,
    reminder_date: reminderDate,
    reminder_time: `${reminderTime}:00`,
  };

  const { error: insertError } = await supabase.from("reminder_push_delivery_log").insert({
    ...key,
    status: "processing",
    sent_count: 0,
    error_message: null,
  });

  if (!insertError) return true;
  if (insertError.code !== "23505") throw insertError;

  const { data: existingLog, error: selectError } = await supabase
    .from("reminder_push_delivery_log")
    .select("status,updated_at")
    .match(key)
    .maybeSingle<DeliveryLog>();
  if (selectError) throw selectError;
  if (!existingLog || existingLog.status === "sent") return false;

  const staleProcessing =
    existingLog.status === "processing" &&
    Date.now() - new Date(existingLog.updated_at).getTime() > PROCESSING_RETRY_AFTER_MS;
  if (existingLog.status === "processing" && !staleProcessing) return false;

  let updateQuery = supabase
    .from("reminder_push_delivery_log")
    .update({ status: "processing", sent_count: 0, error_message: null })
    .match(key)
    .eq("status", existingLog.status);
  if (staleProcessing) {
    updateQuery = updateQuery.lt("updated_at", new Date(Date.now() - PROCESSING_RETRY_AFTER_MS).toISOString());
  }

  const { data: updatedLog, error: updateError } = await updateQuery
    .select("status,updated_at")
    .maybeSingle<DeliveryLog>();
  if (updateError) throw updateError;

  return Boolean(updatedLog);
}

async function finalizeDelivery(
  userId: string,
  reminderDate: string,
  reminderTime: string,
  input: { status: "sent" | "failed"; sentCount: number; errorMessage?: string },
) {
  await supabase
    .from("reminder_push_delivery_log")
    .update({
      status: input.status,
      sent_count: input.sentCount,
      error_message: input.errorMessage ?? null,
    })
    .match({
      user_id: userId,
      reminder_date: reminderDate,
      reminder_time: `${reminderTime}:00`,
    });
}

async function sendExpoPush(tokens: string[], body: string) {
  const messages: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    title: "LexiLoop",
    body,
    sound: "default",
    data: { source: "lexiloop-reminder" },
  }));

  const tickets: ExpoTicket[] = [];
  for (const batch of chunk(messages, 100)) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      throw new Error(`Expo push request failed with ${response.status}.`);
    }

    tickets.push(...parseExpoTickets(await response.json(), batch.length));
  }

  return tickets;
}

async function runReminderDispatch() {
  const now = new Date();
  const { data: rawSettings, error: settingsError } = await supabase
    .from("reminder_settings")
    .select("user_id,time,repeat_days,message")
    .eq("enabled", true);
  if (settingsError) throw settingsError;

  const settings = (rawSettings ?? []) as ReminderSetting[];
  if (settings.length === 0) {
    return { checked: 0, sent: 0, skipped: 0, errors: [] };
  }

  const userIds = settings.map((setting) => setting.user_id);
  const { data: rawProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,timezone")
    .in("id", userIds);
  if (profilesError) throw profilesError;

  const { data: rawPushTokens, error: pushTokenError } = await supabase
    .from("reminder_push_tokens")
    .select("user_id,token")
    .eq("enabled", true)
    .in("user_id", userIds);
  if (pushTokenError) throw pushTokenError;

  const profiles = (rawProfiles ?? []) as Profile[];
  const pushTokens = (rawPushTokens ?? []) as PushToken[];
  const timezoneByUserId = new Map(
    profiles.map((profile) => [profile.id, profile.timezone || DEFAULT_TIMEZONE]),
  );
  const tokensByUserId = new Map<string, string[]>();
  for (const pushToken of pushTokens) {
    const tokens = tokensByUserId.get(pushToken.user_id) ?? [];
    tokens.push(pushToken.token);
    tokensByUserId.set(pushToken.user_id, tokens);
  }

  let sent = 0;
  let skipped = 0;
  const errors: Array<{ user_id: string; message: string }> = [];

  for (const setting of settings) {
    const tokens = tokensByUserId.get(setting.user_id) ?? [];
    if (tokens.length === 0) {
      skipped += 1;
      continue;
    }

    const timezone = timezoneByUserId.get(setting.user_id) ?? DEFAULT_TIMEZONE;
    const local = getLocalParts(now, timezone);
    if (
      local.time !== normalizeTime(setting.time) ||
      !setting.repeat_days.includes(local.weekday)
    ) {
      skipped += 1;
      continue;
    }

    const reserved = await reserveDelivery(setting.user_id, local.date, local.time);
    if (!reserved) {
      skipped += 1;
      continue;
    }

    try {
      const tickets = await sendExpoPush(tokens, setting.message);
      const okCount = tickets.filter((ticket) => ticket.status === "ok").length;
      sent += okCount;

      await Promise.all(
        tickets.map((ticket, index) => {
          if (ticket.status !== "error") return Promise.resolve();
          const token = tokens[index];
          if (!token) return Promise.resolve();

          const isDeviceGone = ticket.details?.error === "DeviceNotRegistered";
          return supabase
            .from("reminder_push_tokens")
            .update({
              enabled: !isDeviceGone,
              last_error: ticket.message ?? ticket.details?.error ?? "Expo push failed.",
            })
            .eq("user_id", setting.user_id)
            .eq("token", token);
        }),
      );

      await finalizeDelivery(setting.user_id, local.date, local.time, {
        status: okCount > 0 ? "sent" : "failed",
        sentCount: okCount,
        errorMessage: okCount > 0 ? undefined : "Expo push returned no successful tickets.",
      });
    } catch (error) {
      const message = getErrorMessage(error);
      errors.push({ user_id: setting.user_id, message });
      await finalizeDelivery(setting.user_id, local.date, local.time, {
        status: "failed",
        sentCount: 0,
        errorMessage: message,
      });
    }
  }

  return { checked: settings.length, sent, skipped, errors };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  if (!reminderCronSecret || req.headers.get(CRON_SECRET_HEADER) !== reminderCronSecret) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    const result = await runReminderDispatch();
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    return jsonResponse({ ok: false, error: getErrorMessage(error) }, 500);
  }
});
