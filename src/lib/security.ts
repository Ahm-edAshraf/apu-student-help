import { NextRequest, NextResponse } from 'next/server'

// Basic HTML tag and attribute patterns for sanitization
const HTML_TAG_PATTERN = /<[^>]*>/g
const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
const STYLE_PATTERN = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi
const ON_EVENT_PATTERN = /\son\w+\s*=\s*["'][^"']*["']/gi
const JAVASCRIPT_PROTOCOL = /javascript:/gi
const DATA_PROTOCOL = /data:/gi

// Rate limiting store with cleanup mechanism
const rateLimitStore = new Map<string, { count: number; resetTime: number; timestamps: number[] }>()

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

// Security configuration
export const SECURITY_CONFIG = {
  rateLimits: {
    api: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 auth attempts per 15 minutes
    upload: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 uploads per hour
    chat: { requests: 50, windowMs: 60 * 60 * 1000 }, // 50 chat messages per hour
  },
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/x-7z-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml'
  ],
  contentLimits: {
    title: 100,
    content: 50000,
    name: 50,
    email: 254,
    password: 128,
    message: 10000,
    topic: 100
  }
}

// Security headers for responses
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' https://unpkg.com https://api.google.com",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.google.com wss://*.supabase.co",
      "worker-src 'self' blob: https://unpkg.com",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    
    // Security headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // HSTS (only in production)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    })
  }
}

// Rate limiting middleware with sliding window
export function rateLimit(type: keyof typeof SECURITY_CONFIG.rateLimits) {
  return (req: NextRequest): { allowed: boolean; remaining: number; resetTime: number } => {
    const config = SECURITY_CONFIG.rateLimits[type]
    const key = `${getClientIP(req)}-${type}`
    const now = Date.now()
    
    let existing = rateLimitStore.get(key)
    
    if (!existing || now > existing.resetTime) {
      // Reset or first request
      const resetTime = now + config.windowMs
      existing = { count: 1, resetTime, timestamps: [now] }
      rateLimitStore.set(key, existing)
      return { allowed: true, remaining: config.requests - 1, resetTime }
    }
    
    // Remove timestamps outside the window
    existing.timestamps = existing.timestamps.filter(timestamp => 
      timestamp > now - config.windowMs
    )
    
    if (existing.timestamps.length >= config.requests) {
      return { allowed: false, remaining: 0, resetTime: existing.resetTime }
    }
    
    // Add current request
    existing.timestamps.push(now)
    existing.count = existing.timestamps.length
    
    return { allowed: true, remaining: config.requests - existing.count, resetTime: existing.resetTime }
  }
}

// Get client IP address
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real
  }
  
  return 'unknown'
}

// Input validation schemas
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= SECURITY_CONFIG.contentLimits.email
  },
  
  apuEmail: (email: string): boolean => {
    return validators.email(email) && email.endsWith('@mail.apu.edu.my')
  },
  
  password: (password: string): boolean => {
    return password.length >= 6 && password.length <= SECURITY_CONFIG.contentLimits.password
  },
  
  name: (name: string): boolean => {
    const trimmed = name.trim()
    return trimmed.length > 0 && trimmed.length <= SECURITY_CONFIG.contentLimits.name
  },
  
  title: (title: string): boolean => {
    const trimmed = title.trim()
    return trimmed.length > 0 && trimmed.length <= SECURITY_CONFIG.contentLimits.title
  },
  
  content: (content: string): boolean => {
    return content.length <= SECURITY_CONFIG.contentLimits.content
  },
  
  message: (message: string): boolean => {
    const trimmed = message.trim()
    return trimmed.length > 0 && trimmed.length <= SECURITY_CONFIG.contentLimits.message
  },
  
  topic: (topic: string): boolean => {
    const trimmed = topic.trim()
    return trimmed.length > 0 && trimmed.length <= SECURITY_CONFIG.contentLimits.topic
  },
  
  uuid: (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  },
  
  filename: (filename: string): boolean => {
    const trimmed = filename.trim()
    // Allow alphanumeric, spaces, dots, hyphens, underscores
    const safeFilename = /^[a-zA-Z0-9\s\.\-_]+$/
    return trimmed.length > 0 && trimmed.length <= 255 && safeFilename.test(trimmed)
  },
  
  fileType: (mimeType: string): boolean => {
    return SECURITY_CONFIG.allowedFileTypes.includes(mimeType)
  },
  
  fileSize: (size: number): boolean => {
    return size > 0 && size <= SECURITY_CONFIG.maxFileSize
  }
}

// Input sanitization
export const sanitizers = {
  text: (input: string): string => {
    return input
      .replace(HTML_TAG_PATTERN, '')
      .replace(SCRIPT_PATTERN, '')
      .replace(STYLE_PATTERN, '')
      .replace(ON_EVENT_PATTERN, '')
      .replace(JAVASCRIPT_PROTOCOL, '')
      .replace(DATA_PROTOCOL, '')
  },
  
  html: (input: string): string => {
    return input
      .replace(HTML_TAG_PATTERN, '')
      .replace(SCRIPT_PATTERN, '')
      .replace(STYLE_PATTERN, '')
      .replace(ON_EVENT_PATTERN, '')
      .replace(JAVASCRIPT_PROTOCOL, '')
      .replace(DATA_PROTOCOL, '')
  },
  
  filename: (filename: string): string => {
    return filename
      .trim()
      .replace(/[^a-zA-Z0-9\s\.\-_]/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 255)
  }
}

// Error responses without information leakage
export function createSecureErrorResponse(
  message: string, 
  status: number, 
  logError?: Error | string
): NextResponse {
  // Log the actual error for debugging (server-side only)
  if (logError) {
    console.error('Security error:', logError)
  }
  
  const securityHeaders = getSecurityHeaders()
  
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString()
    },
    { 
      status,
      headers: securityHeaders
    }
  )
}

// Validate request body against schema
export function validateRequestBody<T>(
  body: unknown,
  schema: Record<string, (value: unknown) => boolean>
): { valid: boolean; errors: string[]; data?: T } {
  const errors: string[] = []
  const validatedData: Record<string, unknown> = {}
  
  for (const [key, validator] of Object.entries(schema)) {
    const value = (body as Record<string, unknown>)[key]
    
    if (value === undefined || value === null) {
      errors.push(`${key} is required`)
      continue
    }
    
    if (!validator(value)) {
      errors.push(`${key} is invalid`)
      continue
    }
    
    validatedData[key] = value
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedData as T : undefined
  }
}

// Security logging
export function logSecurityEvent(
  event: string,
  req: NextRequest,
  details?: Record<string, unknown>
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent'),
    url: req.url,
    method: req.method,
    ...details
  }
  
  console.warn('SECURITY EVENT:', JSON.stringify(logData))
}

// Check for suspicious patterns
export function detectSuspiciousInput(input: string): boolean {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
    /alert\(/i,
    /confirm\(/i,
    /prompt\(/i
  ]
  
  return patterns.some(pattern => pattern.test(input))
} 