/**
 * Single source of truth for status chip colours across the portal.
 *
 * Every list (applications, claims, payments, premium schedule, transfers)
 * renders the same statuses with the same colour/background/icon, so the maps
 * live here instead of being re-declared per page.
 *
 * Usage:
 *   import { getStatusStyle, statusChipStyle } from '../utils/statusMeta'
 *   const { color, bg, icon } = getStatusStyle(item.status)
 */

const NEUTRAL = { color: '#64748b', bg: '#f1f5f9', icon: 'bi-dash-circle' }

export const STATUS_STYLES = {
  // Application / claim workflow
  APPROVED:                     { color: '#15803d', bg: '#dcfce7', icon: 'bi-check-circle-fill' },
  VERIFIED:                     { color: '#16a34a', bg: '#dcfce7', icon: 'bi-patch-check-fill' },
  PENDING:                      { color: '#d97706', bg: '#fef3c7', icon: 'bi-clock-fill' },
  REJECTED:                     { color: '#dc2626', bg: '#fee2e2', icon: 'bi-x-circle-fill' },
  REVISION_REQUESTED:           { color: '#3730a3', bg: '#e0e7ff', icon: 'bi-pencil-square' },
  CLAIMED:                      { color: '#7c3aed', bg: '#ede9fe', icon: 'bi-shield-check' },
  CANCELLED:                    { color: '#dc2626', bg: '#fee2e2', icon: 'bi-slash-circle' },

  // Premium schedule / payment states
  PAID:                         { color: '#16a34a', bg: '#dcfce7', icon: 'bi-check-circle-fill' },
  DUE:                          { color: '#d97706', bg: '#fef3c7', icon: 'bi-clock-fill' },
  OVERDUE:                      { color: '#dc2626', bg: '#fee2e2', icon: 'bi-exclamation-triangle-fill' },
  PENDING_VERIFICATION:         { color: '#7c3aed', bg: '#ede9fe', icon: 'bi-hourglass-split' },
  UPCOMING:                     { color: '#64748b', bg: '#f1f5f9', icon: 'bi-calendar-event' },

  // Policy transfer workflow
  PENDING_TRANSFEREE_SIGNATURE: { color: '#d97706', bg: '#fef3c7', icon: 'bi-pen' },
  PENDING_ADMIN_APPROVAL:       { color: '#1d4ed8', bg: '#eff6ff', icon: 'bi-hourglass-split' },

  // Scheduled-job outcomes
  SUCCESS:                      { color: '#16a34a', bg: '#dcfce7', icon: 'bi-check-circle-fill' },
  PARTIAL:                      { color: '#ca8a04', bg: '#fef9c3', icon: 'bi-exclamation-triangle-fill' },
  SKIPPED:                      { color: '#64748b', bg: '#f1f5f9', icon: 'bi-skip-forward-circle' },
  ERROR:                        { color: '#dc2626', bg: '#fee2e2', icon: 'bi-x-circle-fill' },
}

/** Returns { color, bg, icon } for any status, falling back to a neutral grey. */
export function getStatusStyle(status) {
  return STATUS_STYLES[status] || NEUTRAL
}

/** Inline style for the rounded status pill used in tables, cards and modals. */
export function statusChipStyle(status, overrides = {}) {
  const { color, bg } = getStatusStyle(status)
  return {
    display: 'inline-block',
    padding: '0.2rem 0.7rem',
    borderRadius: 99,
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    background: bg,
    color,
    ...overrides,
  }
}
