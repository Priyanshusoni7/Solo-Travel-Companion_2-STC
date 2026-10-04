export const DEFAULT_AVATAR = '/images/userimg.png';

/**
 * Parses "yyyy-MM-dd" as a LOCAL date. `new Date('2025-01-15')` would be UTC midnight and
 * show the previous day for users west of UTC.
 */
export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Small formatter mirroring the Thymeleaf #dates.format patterns that were used. */
export function formatDate(value, pattern = 'MMM dd, yyyy') {
  const date = parseLocalDate(value);
  if (!date) return '';
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  switch (pattern) {
    case 'dd MMM yyyy':
      return `${day} ${month} ${year}`;
    case 'dd MMM':
      return `${day} ${month}`;
    case 'MMM dd':
      return `${month} ${day}`;
    default:
      return `${month} ${day}, ${year}`;
  }
}

export function toInputDate(date) {
  const d = parseLocalDate(date);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayInputDate() {
  return toInputDate(new Date());
}

/** Inclusive number of days between two "yyyy-MM-dd" dates. */
export function tripLengthDays(start, end) {
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  if (!s || !e) return null;
  return Math.round(Math.abs(e - s) / 86400000) + 1;
}

export function formatTime(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Itinerary map {"1": "...", "2": "..."} -> [[1, "..."], [2, "..."]] sorted by day. */
export function itineraryEntries(dayItineraries) {
  return Object.entries(dayItineraries || {})
    .map(([day, text]) => [Number(day), text])
    .sort((a, b) => a[0] - b[0]);
}

export function splitInterests(interest) {
  return (interest || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function locationOf(user) {
  return [user?.city, user?.state, user?.country].filter(Boolean).join(', ');
}

export function usernameOf(email) {
  return (email || '').split('@')[0];
}

/** Same rule as the backend (AuthController): 8+ characters with at least one letter and one number. */
export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*[0-9]).{8,}$/;
export const PASSWORD_HINT = 'At least 8 characters, including a letter and a number.';

/** "2/3 joined" when the plan has a limit, otherwise "2 joined". */
export function capacityLabel(plan) {
  const joined = plan?.joinedCount ?? 0;
  return plan?.maxCompanions ? `${joined}/${plan.maxCompanions} joined` : `${joined} joined`;
}

export function isFull(plan) {
  return !!plan?.maxCompanions && (plan.joinedCount ?? 0) >= plan.maxCompanions;
}
