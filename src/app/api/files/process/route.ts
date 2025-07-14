import { NextRequest } from 'next/server'
import { 
  rateLimit, 
  createSecureErrorResponse,
  logSecurityEvent,
  getSecurityHeaders
} from '@/lib/security'

export const runtime = 'nodejs' // Use Node.js runtime for file processing

// Comprehensive file processor that extracts FULL content from study materials
async function processFileContent(file: File, buffer: Buffer): Promise<string> {
  const fileName = file.name.toLowerCase()
  const fileType = file.type

  try {
        // PDF Files - Not supported (removed due to processing complexity)
    if (fileType === 'application/pdf') {
      return `📄 PDF File: "${file.name}"\n\nPDF processing has been disabled due to technical limitations. Please:\n\n1. Convert your PDF to a Word document (.docx) for full text extraction\n2. Copy and paste the text content you want to discuss\n3. Upload individual pages as images if you need specific sections analyzed\n4. Describe the key points from the PDF you'd like help with\n\nSorry for the inconvenience!`
    }

    // Word Documents (.docx)
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      if (result.value && result.value.trim().length > 0) {
        return `📝 Word Document Content from "${file.name}":\n\n${result.value}`
      }
      throw new Error('No text content found in Word document')
    }

    // Legacy Word Documents (.doc)
    if (fileType === 'application/msword') {
      // For .doc files, we'll need a different approach or fallback
      return `📝 Word Document: "${file.name}"\n\nLegacy .doc format detected. Please save as .docx for full text extraction, or copy and paste the content you want to discuss.`
    }

    // PowerPoint Files (.pptx)
    if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      try {
        const JSZip = await import('jszip')
        const zip = new JSZip.default()
        const contents = await zip.loadAsync(buffer)
        
        let allText = ''
        const slideTexts: string[] = []
        
        // Extract text from slides
        for (let i = 1; i <= 50; i++) { // Check up to 50 slides
          const slidePath = `ppt/slides/slide${i}.xml`
          if (contents.files[slidePath]) {
            const slideXml = await contents.files[slidePath].async('text')
            // Extract text content using regex (basic XML parsing)
            const textMatches = slideXml.match(/<a:t[^>]*>([^<]+)</g)
            if (textMatches) {
              const slideText = textMatches
                .map(match => match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, ''))
                .join(' ')
              if (slideText.trim()) {
                slideTexts.push(`Slide ${i}: ${slideText.trim()}`)
              }
            }
          }
        }
        
        if (slideTexts.length > 0) {
          allText = slideTexts.join('\n\n')
          return `📊 PowerPoint Content from "${file.name}":\n\n${allText}`
        }
        throw new Error('No text content found in PowerPoint')
             } catch {
         throw new Error('Failed to extract PowerPoint content')
       }
    }

    // Excel Files (.xlsx)
    if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      let allSheetText = ''
      
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName]
        const sheetData = XLSX.utils.sheet_to_csv(sheet)
        if (sheetData.trim()) {
          allSheetText += `\n\nSheet "${sheetName}":\n${sheetData}`
        }
      })
      
      if (allSheetText.trim()) {
        return `📊 Excel Content from "${file.name}":${allSheetText}`
      }
      throw new Error('No data found in Excel file')
    }

    // Text Files
    if (fileType === 'text/plain' || fileType === 'text/markdown' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const textContent = buffer.toString('utf-8')
      if (textContent.trim()) {
        return `📄 Text Content from "${file.name}":\n\n${textContent}`
      }
      throw new Error('Text file is empty')
    }

    // CSV Files
    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      const csvContent = buffer.toString('utf-8')
      if (csvContent.trim()) {
        return `📊 CSV Data from "${file.name}":\n\n${csvContent}`
      }
      throw new Error('CSV file is empty')
    }

    // Image Files with OCR
    if (fileType.startsWith('image/')) {
      try {
        const Tesseract = await import('tesseract.js')
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
          logger: () => {} // Disable logging
        })
        
        if (text && text.trim().length > 10) {
          return `🖼️ Text extracted from image "${file.name}":\n\n${text.trim()}`
        }
        return `🖼️ Image "${file.name}" uploaded.\n\nNo readable text detected in this image. Please describe what you see in the image or what questions you have about it.`
             } catch {
         return `🖼️ Image "${file.name}" uploaded.\n\nOCR processing failed. Please describe what you see in the image or what questions you have about it.`
       }
    }

    // Fallback for unsupported types
    throw new Error(`Unsupported file type: ${fileType}`)

  } catch (error) {
    console.error(`File processing error for ${file.name}:`, error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting for file processing
    const rateLimitResult = rateLimit('upload')(req)
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit_exceeded', req, { type: 'file_process', remaining: rateLimitResult.remaining })
      return createSecureErrorResponse('Too many requests. Please try again later.', 429)
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return createSecureErrorResponse('File is required', 400)
    }

    // Basic file validation (but more permissive for study materials)
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      logSecurityEvent('oversized_file', req, { fileSize: file.size, fileName: file.name })
      return createSecureErrorResponse('File too large (max 100MB)', 400)
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process the file and extract content
    let extractedContent: string
    
    try {
      extractedContent = await processFileContent(file, buffer)
      
      // Don't truncate content - we want FULL content for study materials
      // Only apply reasonable limits to prevent memory issues
      if (extractedContent.length > 500000) { // 500KB text limit
        extractedContent = extractedContent.substring(0, 500000) + '\n\n[Content truncated due to length - this is the first 500KB of text]'
      }
      
    } catch (processingError) {
      console.error('Processing error:', processingError)
      
      // Create a more helpful fallback message
      extractedContent = `❌ Could not extract content from "${file.name}"\n\nFile type: ${file.type}\nError: ${processingError instanceof Error ? processingError.message : 'Unknown error'}\n\nPlease try:\n1. Converting to a supported format (.pdf, .docx, .txt)\n2. Copy-pasting the content you want to discuss\n3. Describing the key points from the document`
    }

    logSecurityEvent('file_processed', req, { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      contentLength: extractedContent.length,
      success: !extractedContent.includes('❌')
    })

    // Return processed content
    const securityHeaders = getSecurityHeaders()
    return new Response(
      JSON.stringify({
        success: true,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        content: extractedContent
      }),
      {
        status: 200,
        headers: {
          ...securityHeaders,
          'Content-Type': 'application/json',
        }
      }
    )

  } catch (error) {
    console.error('API error:', error)
    logSecurityEvent('api_error', req, { error: error instanceof Error ? error.message : 'Unknown error' })
    return createSecureErrorResponse('An unexpected error occurred', 500, error instanceof Error ? error : 'Unknown error')
  }
} 