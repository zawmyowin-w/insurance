import { toast } from 'react-toastify'

/**
 * Extracts a human-readable message from an Axios error and shows a toast.
 * Replaces the repeated: catch(err) { toast.error(err.response?.data?.message || fallback) }
 *
 * @param {unknown} err   - The caught error object
 * @param {string}  [fallback] - Message shown when the server gives no detail
 */
export function apiError(err, fallback = 'Something went wrong') {
  const msg = apiErrorMessage(err, fallback)
  toast.error(msg)
  return msg
}

/**
 * Same message extraction as {@link apiError} but without the toast — for
 * callers that render the error themselves (inline banners, custom toasts).
 *
 * @param {unknown} err   - The caught error object
 * @param {string}  [fallback] - Message returned when the server gives no detail
 */
export function apiErrorMessage(err, fallback = 'Something went wrong') {
  // The server detail wins; the caller's fallback is preferred over raw axios
  // messages like "Network Error", which mean nothing to a user.
  return err?.response?.data?.message || fallback || err?.message
}
