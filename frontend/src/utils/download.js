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