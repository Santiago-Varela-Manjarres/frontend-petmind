const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

// $3.620.000 (sin espacio entre el signo y el número, como en los mockups)
export function formatCOP(value) {
  const amount = Number(value) || 0
  return `${amount < 0 ? '-' : ''}$${numberFormat.format(Math.abs(Math.round(amount)))}`
}

// $320M · $6,8M · $100 mil
export function formatCOPShort(value) {
  const amount = Number(value) || 0
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    const text = millions >= 100 ? Math.round(millions).toString() : millions.toFixed(1).replace(/\.0$/, '')
    return `$${text.replace('.', ',')}M`
  }
  // 999.600 redondea a 1.000 mil: en ese caso se muestra como millones ("$1M"), no "$1000 mil".
  if (amount >= 1_000 && Math.round(amount / 1_000) < 1_000) return `$${Math.round(amount / 1_000)} mil`
  if (amount >= 1_000) return formatCOPShort(1_000_000)
  return formatCOP(amount)
}

export function formatNumber(value) {
  return numberFormat.format(Number(value) || 0)
}

// plural(1, 'donante') → "1 donante" · plural(3, 'mes', 'meses') → "3 meses"
export function plural(count, singular, pluralWord = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralWord}`
}

export function percent(part, total) {
  if (!total) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

// "Brayan Ciro" → "BC" · "Huellitas de Amor" → "HA"
export function initials(text = '') {
  const words = text
    .split(/\s+/)
    .filter((word) => word && !['de', 'del', 'la', 'las', 'los', 'y'].includes(word.toLowerCase()))
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// "brayan.ciro@correo.com" → "br•••••••@correo.com"
export function maskEmail(email = '') {
  const [user, domain] = email.split('@')
  if (!domain) return email
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(3, user.length - 2))}@${domain}`
}

// "1023456482" → "1.0•• ••• 482"
export function maskDocument(value = '') {
  const digits = String(value).replace(/\D/g, '')
  if (digits.length < 5) return value
  return `${digits[0]}.${digits[1]}•• ••• ${digits.slice(-3)}`
}

// "3001234567" → "300 123 4567". Otros formatos se devuelven tal cual.
export function formatPhone(value = '') {
  const digits = String(value).replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  return value
}

export function slugify(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita las tildes que separa normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

// Descarga un archivo de texto generado en el navegador (comprobantes, certificados, CSV).
export function downloadTextFile(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
