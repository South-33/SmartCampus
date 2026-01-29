// Cambodia timezone utilities

export const CAMBODIA_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7

/**
 * Gets current date string in Cambodia timezone (YYYY-MM-DD)
 */
export function getCambodiaDateString(): string {
  const now = new Date();
  const cambodiaTime = new Date(now.getTime() + CAMBODIA_OFFSET_MS);
  return cambodiaTime.toISOString().split("T")[0];
}

/**
 * Gets current day of week in Cambodia timezone (0=Sun, 6=Sat)
 */
export function getCambodiaDayOfWeek(): number {
  const now = new Date();
  const cambodiaTime = new Date(now.getTime() + CAMBODIA_OFFSET_MS);
  return cambodiaTime.getUTCDay();
}

/**
 * Parses a time string (HH:MM) for a given date in Cambodia timezone
 * and returns UTC epoch timestamp
 */
export function parseTimeForDate(date: string, time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const baseDate = new Date(date + "T00:00:00Z");
  baseDate.setUTCHours(hours - 7, minutes, 0, 0); // Adjust for UTC+7
  return baseDate.getTime();
}
