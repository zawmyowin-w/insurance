// Predefined meta for known insurance types
export const TYPE_META = {
  LIFE:      { color: '#dc2626', bg: '#fef2f2',  icon: 'bi-heart-pulse',   label: 'Life Insurance' },
  HEALTH:    { color: '#16a34a', bg: '#f0fdf4',  icon: 'bi-hospital',      label: 'Health Insurance' },
  TRAVEL:    { color: '#0891b2', bg: '#ecfeff',  icon: 'bi-airplane',      label: 'Travel Insurance' },
  MOTOR:     { color: '#d97706', bg: '#fffbeb',  icon: 'bi-car-front',     label: 'Motor Insurance' },
  EDUCATION: { color: '#7c3aed', bg: '#f5f3ff',  icon: 'bi-mortarboard',   label: 'Education Insurance' },
  VEHICLE:   { color: '#2563eb', bg: '#eff6ff',  icon: 'bi-truck',         label: 'Vehicle Insurance' },
  PROPERTY:  { color: '#ca8a04', bg: '#fefce8',  icon: 'bi-house-check',   label: 'Property Insurance' },
}

// Palette for dynamically created types
const DYNAMIC_PALETTE = [
  { color: '#9333ea', bg: '#faf5ff',  icon: 'bi-shield-check' },
  { color: '#0d9488', bg: '#f0fdfa',  icon: 'bi-patch-check' },
  { color: '#ea580c', bg: '#fff7ed',  icon: 'bi-stars' },
  { color: '#be185d', bg: '#fdf2f8',  icon: 'bi-gem' },
  { color: '#4f46e5', bg: '#eef2ff',  icon: 'bi-award' },
  { color: '#0369a1', bg: '#f0f9ff',  icon: 'bi-umbrella' },
  { color: '#15803d', bg: '#f0fdf4',  icon: 'bi-leaf' },
  { color: '#b45309', bg: '#fef3c7',  icon: 'bi-briefcase' },
]

function hashType(type) {
  let h = 0
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0
  return h % DYNAMIC_PALETTE.length
}

/** Returns meta for any type — predefined or dynamically generated */
export function getTypeMeta(type) {
  if (!type) return { color: '#6b7280', bg: '#f3f4f6', icon: 'bi-shield', label: 'Insurance' }
  if (TYPE_META[type]) return { ...TYPE_META[type] }
  const palette = DYNAMIC_PALETTE[hashType(type)]
  return { ...palette, label: type.charAt(0) + type.slice(1).toLowerCase() + ' Insurance' }
}
