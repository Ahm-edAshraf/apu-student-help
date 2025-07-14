import { google } from '@ai-sdk/google'
import { streamText, convertToCoreMessages } from 'ai'
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { 
  rateLimit, 
  validators, 
  sanitizers, 
  createSecureErrorResponse,
  validateRequestBody,
  logSecurityEvent,
  detectSuspiciousInput,
  getSecurityHeaders
} from '@/lib/security'

// Allow streaming responses
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit('chat')(req)
    if (!rateLimitResult.allowed) {
      logSecurityEvent('rate_limit_exceeded', req, { type: 'chat', remaining: rateLimitResult.remaining })
      return createSecureErrorResponse('Too many requests. Please try again later.', 429)
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return createSecureErrorResponse('Invalid JSON in request body', 400)
    }

    // Validate request structure
    const validation = validateRequestBody<{ messages: Array<{ role: string; content: string }> }>(
      body,
      {
        messages: (value) => Array.isArray(value) && value.length > 0 && value.every(msg => 
          msg && typeof msg.role === 'string' && typeof msg.content === 'string' &&
          validators.message(msg.content) && ['user', 'assistant', 'system'].includes(msg.role)
        )
      }
    )

    if (!validation.valid) {
      logSecurityEvent('invalid_input', req, { errors: validation.errors })
      return createSecureErrorResponse('Invalid request format', 400)
    }

    const { messages } = validation.data!
    
    // Handle conversationId separately since it's optional
    const requestBody = body as { messages: Array<{ role: string; content: string }>; conversationId?: string }
    const conversationId = requestBody.conversationId
    
    // Validate conversationId if provided
    if (conversationId !== undefined && (!validators.uuid(conversationId))) {
      logSecurityEvent('invalid_conversation_id', req, { conversationId })
      return createSecureErrorResponse('Invalid conversation ID format', 400)
    }

    // Check for suspicious content in messages (but skip file uploads)
    for (const message of messages) {
      // Skip suspicious content detection for file uploads (they start with 📁)
      if (!message.content.startsWith('📁') && detectSuspiciousInput(message.content)) {
        logSecurityEvent('suspicious_content', req, { content: message.content.substring(0, 100) })
        return createSecureErrorResponse('Content contains potentially harmful patterns', 400)
      }
    }

    // Sanitize message content
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      content: sanitizers.text(msg.content)
    }))

    // Create server-side Supabase client with proper authentication
    const supabase = await createServerSupabaseClient(req)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 })
    }

    let currentConversationId = conversationId

    // If no conversation ID provided, create a new conversation
    if (!currentConversationId) {
      const userMessage = sanitizedMessages[sanitizedMessages.length - 1]
      const title = userMessage?.content ? 
        (userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '')) : 
        'New Chat'
      
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert([{
          title,
          user_id: user.id,
          is_active: true
        }])
        .select()
        .single()
      
      if (conversationError || !newConversation) {
        logSecurityEvent('conversation_creation_failed', req, { error: conversationError?.message })
        return createSecureErrorResponse('Failed to create conversation', 500, conversationError || undefined)
      }
      
      currentConversationId = newConversation.id
    }

    // Verify conversation exists and user has access
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', currentConversationId)
      .eq('user_id', user.id)
      .single()
      
    if (conversationError || !conversation) {
      logSecurityEvent('unauthorized_conversation_access', req, { conversationId: currentConversationId, userId: user.id })
      return createSecureErrorResponse('Conversation not found', 404)
    }

    // Store the user message in the database
    const userMessage = sanitizedMessages[sanitizedMessages.length - 1]
    if (userMessage.role === 'user') {
      await supabase
        .from('messages')
        .insert([{
          conversation_id: currentConversationId,
          content: userMessage.content,
          role: 'user',
          message_type: 'text',
          metadata: {}
        }])
    }

    // Convert messages to the format expected by the AI SDK
    const coreMessages = convertToCoreMessages(sanitizedMessages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>)

    // Add system message for academic assistant context
    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI academic assistant designed to help university students with their studies. Please provide helpful, accurate, and educational responses. Focus on:
- Clear explanations
- Educational value
- Academic integrity
- Constructive learning

Avoid providing direct answers to homework/exam questions that could encourage cheating. Instead, guide students to understand concepts. Be encouraging and supportive while maintaining high academic standards.`
    }

    // Call Gemini API using the AI SDK
    const result = await streamText({
      model: google('gemini-2.0-flash'),
      messages: [systemMessage, ...coreMessages],
      temperature: 0.7,
      maxTokens: 4000,
    })

    // Store the complete assistant response after streaming
    let assistantContent = ''
    
    // Create a transform stream to capture the response content
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)
        assistantContent += text
        controller.enqueue(chunk)
      },
      async flush() {
        // Store assistant message in database after streaming is complete
        try {
          await supabase
            .from('messages')
            .insert([{
              conversation_id: currentConversationId!,
              content: assistantContent,
              role: 'assistant',
              message_type: 'text',
              metadata: {}
            }])
        } catch (error) {
          // Log error but don't fail the response since message was already streamed
          logSecurityEvent('message_save_failed', req, { 
            error: error instanceof Error ? error.message : 'Unknown error',
            conversationId: currentConversationId
          })
        }
      }
    })

    // Return streaming response with security headers
    const securityHeaders = getSecurityHeaders()
    return new Response(
      result.toDataStreamResponse({
        getErrorMessage: (error) => {
          if (error instanceof Error) {
            return error.message
          }
          return 'An unexpected error occurred'
        }
      }).body?.pipeThrough(transformStream),
      {
        headers: {
          ...securityHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Conversation-Id': currentConversationId || '',
        },
      }
    )

  } catch (error) {
    logSecurityEvent('api_error', req, { error: error instanceof Error ? error.message : 'Unknown error' })
    return createSecureErrorResponse('An unexpected error occurred', 500, error instanceof Error ? error : 'Unknown error')
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const conversationId = url.searchParams.get('conversationId')

    if (!conversationId) {
      return Response.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Create server-side Supabase client with proper authentication
    const supabase = await createServerSupabaseClient(req)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return Response.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Get conversation and messages
    const [conversationResult, messagesResult] = await Promise.all([
      supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
    ])

    if (conversationResult.error || !conversationResult.data) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (messagesResult.error) {
      return Response.json({ error: 'Failed to load messages' }, { status: 500 })
    }

    return Response.json({
      conversation: conversationResult.data,
      messages: messagesResult.data || []
    })

  } catch (error) {
    console.error('Get chat API error:', error)
    
    return Response.json(
      { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 