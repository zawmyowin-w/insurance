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
 * Opens a PDF blob in a new browser tab/window and triggers the print dialog.
 * The tab stays open so the user can choose a printer or "Save as PDF" in the
 * system print dialog.
 */
export async function printBlobPdf(data) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' })

  const signature = await blob.slice(0, 5).text()
  if (signature !== '%PDF-') {
    throw new Error('The server did not return a valid PDF file')
  }

  const url = URL.createObjectURL(blob)

  // Use a hidden iframe so we don't navigate the current page away.
  // Most modern browsers support printing PDF blobs loaded in an iframe.
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;'
  iframe.src = url
  document.body.appendChild(iframe)

  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch {
      // Fallback: open in a new tab if iframe print is blocked by the browser
      window.open(url, '_blank')
    }
    // Revoke after a long delay to allow the print spool to read the blob
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
      iframe.remove()
    }, 60000)
  })
}