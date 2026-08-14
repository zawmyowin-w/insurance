import { useRef, useState, useEffect } from 'react'
import { downloadBlob, printBlobPdf } from '../utils/download'

/**
 * A dropdown button that offers "Save as PDF" and "Print" for any dynamic PDF.
 *
 * Props:
 *   fetchPdf   — async fn() → Blob (or ArrayBuffer)  [called fresh for each action]
 *   filename   — string  e.g. "policy_contract_12.pdf"
 *   label      — string  text on the main button  (default: "PDF")
 *   size       — "sm" | "md"  (default: "md")
 *   variant    — "primary" | "success" | "secondary"  (default: "primary")
 *   disabled   — boolean
 */
export default function PdfDropdownButton({ fetchPdf, filename, label = 'PDF', size = 'md', variant = 'primary', disabled = false }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(null)  // 'save' | 'print' | null
  const ref = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const COLOR = {
    primary:   { main: 'var(--primary)',  text: '#fff', hover: '#1e40af' },
    success:   { main: '#16a34a',         text: '#fff', hover: '#15803d' },
    secondary: { main: '#64748b',         text: '#fff', hover: '#475569' },
  }[variant] || { main: 'var(--primary)', text: '#fff', hover: '#1e40af' }

  const PAD = size === 'sm' ? '0.3rem 0.65rem' : '0.4rem 0.85rem'
  const FS  = size === 'sm' ? '0.8rem' : '0.85rem'

  const handleSave = async () => {
    setOpen(false)
    setLoading('save')
    try {
      const blob = await fetchPdf()
      await downloadBlob(blob, filename, 'application/pdf')
    } catch (err) {
      console.error('PDF download failed', err)
    } finally { setLoading(null) }
  }

  const handlePrint = async () => {
    setOpen(false)
    setLoading('print')
    try {
      const blob = await fetchPdf()
      await printBlobPdf(blob)
    } catch (err) {
      console.error('PDF print failed', err)
    } finally { setLoading(null) }
  }

  const busy = loading !== null

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Button group */}
      <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${COLOR.main}` }}>
        {/* Main area (click → save) */}
        <button
          onClick={handleSave}
          disabled={disabled || busy}
          style={{
            padding: PAD, fontSize: FS, fontWeight: 600,
            background: COLOR.main, color: COLOR.text,
            border: 'none', cursor: disabled || busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {loading === 'save'
            ? <span className="spinner-border spinner-border-sm"></span>
            : <i className="bi bi-file-earmark-arrow-down-fill"></i>}
          {label}
        </button>

        {/* Divider */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.35)' }}></div>

        {/* Caret (click → open dropdown) */}
        <button
          onClick={() => setOpen(o => !o)}
          disabled={disabled || busy}
          style={{
            padding: `${size === 'sm' ? '0.3rem' : '0.4rem'} 0.5rem`, fontSize: FS,
            background: COLOR.main, color: COLOR.text,
            border: 'none', cursor: disabled || busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {loading === 'print'
            ? <span className="spinner-border spinner-border-sm"></span>
            : <i className={`bi bi-caret-${open ? 'up' : 'down'}-fill`} style={{ fontSize: '0.7rem' }}></i>}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 1050,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 170, overflow: 'hidden',
        }}>
          <button
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#dc2626' }}></i>
            Save as PDF
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '0 0.5rem' }}></div>
          <button
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '0.6rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className="bi bi-printer-fill" style={{ color: '#1d4ed8' }}></i>
            Print
          </button>
        </div>
      )}
    </div>
  )
}
