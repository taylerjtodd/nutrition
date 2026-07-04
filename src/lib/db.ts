import { Redis } from "@upstash/redis";

// ─── Redis Client ────────────────────────────────────────────────────────────
// Lazy-initialised so that callers (e.g. scripts that load .env.local via
// loadEnvConfig) can populate process.env *before* the first Redis command.
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = Redis.fromEnv();
  }
  return _redis;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type FocusMacro =
  | "saturatedFat"
  | "calories"
  | "protein"
  | "totalFat"
  | "carbs";

export interface UserSettings {
  focusMacro: FocusMacro;
  targetSaturatedFat: number; // grams
  targetCalories: number; // kcal
  targetProtein: number; // grams
  targetTotalFat: number; // grams
  targetCarbs: number; // grams
}

export interface LoggedItem {
  id: string; // UUID – used as the Redis Hash field key
  name: string;
  servingSize: string; // e.g. "100g" or "1 serving (14g)"
  quantity: number; // multiplier, e.g. 1.5
  calories: number;
  saturatedFat: number; // grams
  totalFat: number; // grams
  protein: number; // grams
  carbs: number; // grams
  loggedAt: string; // ISO 8601 timestamp
}

// ─── Key Helpers ─────────────────────────────────────────────────────────────

const settingsKey = (userId: string) => `user:${userId}:settings`;
const dailyLogKey = (userId: string, date: string) =>
  `user:${userId}:log:${date}`;
const loggedDatesKey = (userId: string) => `user:${userId}:logged_dates`;

/**
 * Convert a YYYY-MM-DD date string to an integer score for the sorted set.
 * e.g. "2026-07-04" → 20260704
 */
function dateToScore(date: string): number {
  return Number(date.replace(/-/g, ""));
}

// ─── User Settings ───────────────────────────────────────────────────────────

/**
 * Fetch a user's macro targets and focus preference.
 * Returns null if the user has not yet saved settings.
 */
export async function getUserSettings(
  userId: string,
): Promise<UserSettings | null> {
  const raw = await getRedis().hgetall<Record<string, string>>(settingsKey(userId));
  if (!raw) return null;

  return {
    focusMacro: (raw.focusMacro as FocusMacro) ?? "saturatedFat",
    targetSaturatedFat: Number(raw.targetSaturatedFat ?? 20),
    targetCalories: Number(raw.targetCalories ?? 2000),
    targetProtein: Number(raw.targetProtein ?? 50),
    targetTotalFat: Number(raw.targetTotalFat ?? 65),
    targetCarbs: Number(raw.targetCarbs ?? 260),
  };
}

/**
 * Persist user macro targets and/or focus preference.
 * Performs a partial update – fields not provided are left unchanged.
 */
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  const stringified: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    stringified[key] = String(value);
  }
  await getRedis().hset(settingsKey(userId), stringified);
}

// ─── Daily Food Log ───────────────────────────────────────────────────────────

/**
 * Append a food item to the user's log for a given date.
 *
 * The item is stored as a JSON string in a Redis Hash:
 *   Key:   user:{userId}:log:{YYYY-MM-DD}
 *   Field: item.id (UUID)
 *   Value: JSON-serialised LoggedItem
 *
 * The date is also added to the sorted set index so it can be
 * retrieved efficiently in range queries.
 *
 * @returns The complete LoggedItem (with id and loggedAt populated).
 */
export async function logFoodItem(
  userId: string,
  date: string,
  item: Omit<LoggedItem, "id" | "loggedAt">,
): Promise<LoggedItem> {
  const id = crypto.randomUUID();
  const loggedAt = new Date().toISOString();
  const fullItem: LoggedItem = { ...item, id, loggedAt };

  // Store as a JSON string value in the hash, keyed by UUID
  await getRedis().hset(dailyLogKey(userId, date), {
    [id]: JSON.stringify(fullItem),
  });

  // Add the date to the user's sorted set index (score = YYYYMMDD integer)
  await getRedis().zadd(loggedDatesKey(userId), {
    score: dateToScore(date),
    member: date,
  });

  return fullItem;
}

/**
 * Retrieve all logged food items for a specific date.
 * Returns an empty array if nothing has been logged yet.
 */
export async function getDailyLog(
  userId: string,
  date: string,
): Promise<LoggedItem[]> {
  const raw = await getRedis().hvals(dailyLogKey(userId, date));
  if (!raw || raw.length === 0) return [];

  return raw.map((entry: string | LoggedItem) => {
    // @upstash/redis may auto-parse JSON strings; guard both cases
    if (typeof entry === "string") {
      return JSON.parse(entry) as LoggedItem;
    }
    return entry as LoggedItem;
  });
}

/**
 * Remove a specific food item from a day's log.
 * If the day's log becomes empty after deletion, the date entry remains
 * in the sorted set index (harmless – getDailyLog returns [] for empty hashes).
 */
export async function deleteFoodItem(
  userId: string,
  date: string,
  itemId: string,
): Promise<void> {
  await getRedis().hdel(dailyLogKey(userId, date), itemId);
}

// ─── Logged Dates Index ───────────────────────────────────────────────────────

/**
 * Return an array of YYYY-MM-DD strings for every date in [startDate, endDate]
 * on which the user logged at least one item.
 *
 * Uses a sorted set range query by score (YYYYMMDD integers) for O(log N) perf.
 */
export async function getLoggedDatesInRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<string[]> {
  const results = await getRedis().zrange(loggedDatesKey(userId), dateToScore(startDate), dateToScore(endDate), {
    byScore: true,
  });

  return results as string[];
}
