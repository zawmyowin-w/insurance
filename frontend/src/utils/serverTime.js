/**
 * serverTime.js
 *
 * Synchronises the frontend clock with the backend server so that
 * countdowns and date comparisons are not affected by browser clock drift.
 *
 * Myanmar Standard Time = UTC +6:30
 *
 * Usage
 * ─────
 *   import { initServerTime, serverNow, utcMidnightMs } from './serverTime'
 *
 *   // once, at app startup (fire-and-forget):
 *   initServerTime()
 *
 *   // instead of Date.now():
 *   const ms = serverNow()
 *
 *   // convert "YYYY-MM-DD" (server-side UTC date) to epoch ms at UTC midnight:
 *   const expiry = utcMidnightMs('2028-05-15')
 */

/** Myanmar Standard Time offset from UTC in milliseconds (+6h 30m) */
export const MMT_OFFSET_MS = (6 * 60 + 30) * 60 * 1000   // 23 400 000 ms

let _clockOffset = 0      // serverEpoch - clientEpoch, in ms
let _ready       = false

/**
 * Fetches the server's current epoch from `GET /api/public/server-time`.
 * Compensates for network round-trip latency using the midpoint method.
 * Safe to call multiple times — only runs once.
 */
export async function initServerTime() {
  if (_ready) return
  try {
    const t0   = Date.now()
    const res  = await fetch('/api/public/server-time')
    const t1   = Date.now()
    const { epochMs } = await res.json()
    // Server timestamp corresponds to the midpoint of the request journey
    _clockOffset = epochMs - Math.round((t0 + t1) / 2)
    _ready = true
  } catch {
    // Graceful fallback: keep offset at 0 (use client clock as-is)
    _ready = true
  }
}

/**
 * Returns the current time in epoch milliseconds, corrected to the
 * server's clock.  Drop-in replacement for `Date.now()`.
 */
export function serverNow() {
  return Date.now() + _clockOffset
}

/**
 * Converts a server-side date string "YYYY-MM-DD" (in UTC) to the
 * epoch milliseconds of UTC midnight on that day.
 *
 * This is the exact moment the server's daily expiry job will mark
 * a policy as EXPIRED (the server runs in UTC, cron at 00:00 UTC).
 *
 * @param {string} dateStr  e.g. "2028-05-15"
 * @returns {number|null}   epoch ms, or null if dateStr is falsy
 */
export function utcMidnightMs(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y, m - 1, d)   // explicit UTC — no local-timezone drift
}

/**
 * Returns the current date in Myanmar Standard Time as a
 * "YYYY-MM-DD" string (useful for same-day comparisons in MMT).
 */
export function todayMyanmarStr() {
  const now = new Date(serverNow() + MMT_OFFSET_MS)
  return now.toISOString().slice(0, 10)
}
