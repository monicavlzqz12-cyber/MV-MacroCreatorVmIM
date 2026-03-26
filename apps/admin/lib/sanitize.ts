import sanitizeHtmlLib from 'sanitize-html'

const BASE_ALLOWLIST: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's',
    'ul', 'ol', 'li',
    'a',
    'img',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    '*': ['class'],
  },
  allowedSchemes: ['https', 'http', 'mailto'],
  allowedSchemesByTag: {
    img: ['https', 'http', 'data'],
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
  },
  disallowedTagsMode: 'discard',
}

export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, BASE_ALLOWLIST)
}

export function sanitizePaymentInstructions(dirty: string): string {
  const excluded = ['script', 'iframe', 'form', 'input', 'button', 'select', 'textarea']
  return sanitizeHtmlLib(dirty, {
    ...BASE_ALLOWLIST,
    allowedTags: Array.isArray(BASE_ALLOWLIST.allowedTags)
      ? BASE_ALLOWLIST.allowedTags.filter((tag: string) => !excluded.includes(tag))
      : BASE_ALLOWLIST.allowedTags,
  })
}

export function sanitizeCssProperty(value: string): string {
  // Strip dangerous patterns
  const dangerous = [
    /url\s*\(\s*['"]?\s*javascript:/gi,
    /expression\s*\(/gi,
    /javascript:/gi,
    /-moz-binding/gi,
    /behavior\s*:/gi,
  ]

  let safe = value
  for (const pattern of dangerous) {
    safe = safe.replace(pattern, '')
  }
  return safe
}

export function validateCustomCss(css: string): { safe: boolean; sanitized: string } {
  const dangerousPatterns = [
    /url\s*\(\s*['"]?\s*javascript:/gi,
    /expression\s*\(/gi,
    /@import\s+url\s*\(/gi,
    /behavior\s*:/gi,
    /-moz-binding\s*:/gi,
    /javascript:/gi,
    /<script/gi,
    /</gi,
  ]

  let sanitized = css
  let safe = true

  for (const pattern of dangerousPatterns) {
    if (pattern.test(css)) {
      safe = false
    }
    sanitized = sanitized.replace(pattern, '/* removed */')
  }

  return { safe, sanitized }
}
