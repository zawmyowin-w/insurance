import api from '../services/api'

/**
 * Downloads a blob through an object URL.
 *
 * Keeping the URL alive briefly after the click is important: some browsers
 * start reading the object URL asynchronously, so revoking it immediately can
 * leave a downloaded PDF truncated or unreadable.
 */
export async function downloadBlob(data, filename, mimeType = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })

  if (mimeType === 'application/pdf') {
    const signature = await blob.slice(0, 5).text()
    if (signature !== '%PDF-') {
      throw new Error('The server did not return a valid PDF file')
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()

  // Do not revoke synchronously; the browser may still be consuming the blob.
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
    anchor.remove()
  }, 1000)
}

/**
 * Fetches a JWT-protected endpoint as a blob and returns an object URL for it.
 * Callers own the returned URL and must revoke it when done.
 */
export async function fetchBlobUrl(path, config = {}) {
  const res = await api.get(path, { ...config, responseType: 'blob' })
  return URL.createObjectURL(res.data)
}

/** Fetches a JWT-protected file as a blob and opens it in a new tab. */
export async function openBlobFromApi(path, config = {}) {
  const url = await fetchBlobUrl(path, config)
  window.open(url, '_blank')
  return url
}

/**
 * Fetches a JWT-protected file as a blob and saves it to disk.
 * Every file endpoint is behind the axios auth interceptor, so plain links and
 * <img src> cannot be used — the blob must be fetched and then downloaded.
 */
export async function downloadFromApi(path, filename, {
  mimeType = 'application/octet-stream', method = 'get', body = null, ...config
} = {}) {
  const requestConfig = { ...config, responseType: 'blob' }
  const res = method === 'post'
    ? await api.post(path, body, requestConfig)
    : await api.get(path, requestConfig)
  await downloadBlob(res.data, filename, mimeType)
  return res
}

/** Fetches a JWT-protected PDF and saves it to disk. */
export function downloadPdfFromApi(path, filename, options = {}) {
  return downloadFromApi(path, filename, { ...options, mimeType: 'application/pdf' })
}
