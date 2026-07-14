import React from 'react'

// Mobile payment methods accepted for premium payments. Icons are simple
// brand-colored badges (not the literal trademarked logos) rendered as inline SVG.
export const PAYMENT_METHODS = [
  { id: 'KBZ_PAY', label: 'KBZPay', color: '#e2231a' },
  { id: 'WAVE_PAY', label: 'Wave Pay', color: '#00a651' },
  { id: 'AYA_PAY', label: 'AYA Pay', color: '#f7941d' },
]

export default function PaymentMethodIcon({ method, size = 32 }) {
  const meta = PAYMENT_METHODS.find(m => m.id === method)
  if (!meta) return null
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: meta.color,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.42, flexShrink: 0, letterSpacing: '-0.02em',
    }}>
      {meta.id === 'KBZ_PAY' ? 'K' : meta.id === 'WAVE_PAY' ? <i className="bi bi-water" style={{ fontSize: size * 0.5 }}></i> : 'A'}
    </div>
  )
}
