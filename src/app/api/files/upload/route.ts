import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { 
  rateLimit, 
  validators, 
  sanitizers, 
  createSecureErrorResponse,
  logSecurityEvent,
  getSecurityHeaders,
  SECURITY_CONFIG
} from '@/lib/security'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting for file uploads
    const rateLimitResult = rateLimit('upload')(req)
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit_exceeded', req, { type: 'upload', remaining: rateLimitResult.remaining })
      return createSecureErrorResponse('Too many upload attempts. Please try again later.', 429)
    }

    // Check content length
    const contentLength = req.headers.get('content-length')
    if (!contentLength || parseInt(contentLength) > SECURITY_CONFIG.maxRequestSize) {
      logSecurityEvent('oversized_request', req, { contentLength })
      return createSecureErrorResponse('Request too large', 413)
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const tags = formData.get('tags') as string | null

    // Validate required fields
    if (!file || !title) {
      return createSecureErrorResponse('File and title are required', 400)
    }

    // Validate file - Vault allows more file types including PDFs
    const VAULT_ALLOWED_TYPES = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'application/zip',
      'application/x-rar-compressed'
    ]
    
    if (!VAULT_ALLOWED_TYPES.includes(file.type)) {
      logSecurityEvent('invalid_file_type', req, { fileType: file.type, fileName: file.name })
      return createSecureErrorResponse('File type not allowed', 400)
    }

    // Use 50MB limit for vault uploads
    if (file.size > 50 * 1024 * 1024) {
      logSecurityEvent('oversized_file', req, { fileSize: file.size, fileName: file.name })
      return createSecureErrorResponse('File too large (max 50MB)', 400)
    }

    if (!validators.filename(file.name)) {
      logSecurityEvent('invalid_filename', req, { fileName: file.name })
      return createSecureErrorResponse('Invalid filename', 400)
    }

    // Validate and sanitize inputs
    const sanitizedTitle = sanitizers.text(title.trim())
    if (!validators.title(sanitizedTitle)) {
      return createSecureErrorResponse('Invalid title format', 400)
    }

    let sanitizedTags: string[] = []
    if (tags) {
      try {
        const parsedTags = JSON.parse(tags)
        if (Array.isArray(parsedTags)) {
          sanitizedTags = parsedTags
            .map(tag => sanitizers.text(tag))
            .filter(tag => tag.length > 0 && tag.length <= 20)
            .slice(0, 10) // Limit to 10 tags
        }
      } catch {
        return createSecureErrorResponse('Invalid tags format', 400)
      }
    }

    // Additional file content validation
    try {
      // Read first few bytes to check for malicious headers
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      
      // Check for common malicious file signatures
      const maliciousSignatures = [
        [0x4D, 0x5A], // PE executable
        [0x50, 0x4B, 0x03, 0x04], // ZIP (could contain malware)
        [0x7F, 0x45, 0x4C, 0x46], // ELF executable
        [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
      ]

      for (const signature of maliciousSignatures) {
        if (bytes.length >= signature.length) {
          const matches = signature.every((byte, index) => bytes[index] === byte)
          if (matches) {
            logSecurityEvent('malicious_file_signature', req, { 
              fileName: file.name, 
              signature: signature.map(b => b.toString(16)).join(' ')
            })
            return createSecureErrorResponse('File contains suspicious content', 400)
          }
        }
      }

      // Recreate file from buffer for upload
      const sanitizedFile = new File([arrayBuffer], sanitizers.filename(file.name), {
        type: file.type
      })

      // Authenticate user
      const supabase = await createServerSupabaseClient(req)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        logSecurityEvent('unauthorized_upload', req, { fileName: file.name })
        return createSecureErrorResponse('Authentication required', 401)
      }

      // Generate secure filename
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const secureFileName = `${timestamp}-${randomId}.${fileExt}`
      const filePath = `study-materials/${user.id}/${secureFileName}`

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, sanitizedFile, {
          cacheControl: '3600',
          upsert: false,
          duplex: 'half'
        })

      if (uploadError) {
        logSecurityEvent('upload_failed', req, { error: uploadError.message, fileName: file.name })
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      // Create resource record in database
      const { data: resource, error: createError } = await supabase
        .from('resources')
        .insert([{
          title: sanitizedTitle,
          tags: sanitizedTags,
          url: publicUrl,
          file_name: sanitizers.filename(file.name),
          file_size: file.size,
          file_type: file.type,
          user_id: user.id,
          file_path: filePath
        }])
        .select()
        .single()

      if (createError) {
        // Clean up uploaded file if database insertion fails
        await supabase.storage.from('files').remove([filePath])
        throw createError
      }

      logSecurityEvent('file_uploaded', req, { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        resourceId: resource.id
      })

      // Return success response with security headers
      const securityHeaders = getSecurityHeaders()
      return new Response(
        JSON.stringify({
          success: true,
          resource,
          message: 'File uploaded successfully'
        }),
        {
          status: 201,
          headers: {
            ...securityHeaders,
            'Content-Type': 'application/json',
          }
        }
      )

    } catch (fileError) {
      logSecurityEvent('file_processing_error', req, { 
        error: fileError instanceof Error ? fileError.message : 'Unknown error',
        fileName: file.name 
      })
      return createSecureErrorResponse('Failed to process file', 500, fileError instanceof Error ? fileError : 'Unknown error')
    }

  } catch (error) {
    logSecurityEvent('upload_api_error', req, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return createSecureErrorResponse('Upload failed', 500, error instanceof Error ? error : 'Unknown error')
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const securityHeaders = getSecurityHeaders()
  return new Response(null, {
    status: 200,
    headers: {
      ...securityHeaders,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
} 