'use client'

import { useChat } from 'ai/react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Send, 
  Upload, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Loader2,
  Plus,
  MessageSquare,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getConversations, deleteConversation, type Conversation } from '@/lib/supabase'

interface ChatProps {
  initialConversationId?: string
  className?: string
}

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId?: string
  onConversationSelect: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  isLoading?: boolean
}

function ConversationList({ 
  conversations, 
  currentConversationId, 
  onConversationSelect, 
  onNewConversation,
  onDeleteConversation,
  isLoading 
}: ConversationListProps) {
  return (
    <div className="w-full lg:w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
      <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700">
        <Button 
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 text-sm lg:text-base"
          size="sm"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-200px)]">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                  currentConversationId === conversation.id && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                )}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConversation(conversation.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface MessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt?: Date
  }
  isLoading?: boolean
}

function Message({ message, isLoading }: MessageProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className={cn(
      "flex gap-4 p-4",
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      {message.role === 'assistant' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
        </div>
      )}

      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3",
        message.role === 'user'
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
      )}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          </div>
        )}

        {message.role === 'assistant' && !isLoading && (
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </div>

      {message.role === 'user' && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Chat({ initialConversationId, className }: ChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(initialConversationId)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: [],
    body: {
      conversationId: currentConversationId
    },
    onResponse: (response) => {
      // Update conversation ID from response headers
      const newConversationId = response.headers.get('X-Conversation-Id')
      if (newConversationId && newConversationId !== currentConversationId) {
        setCurrentConversationId(newConversationId)
        loadConversations() // Refresh conversations list
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  const loadConversations = async () => {
    setIsLoadingConversations(true)
    try {
      const { data, error } = await getConversations()
      if (!error && data) {
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const handleNewConversation = () => {
    setCurrentConversationId(undefined)
    setMessages([])
  }

  const handleConversationSelect = async (conversationId: string) => {
    setCurrentConversationId(conversationId)
    
    try {
      // Load conversation messages
      const response = await fetch(`/api/chat?conversationId=${conversationId}`)
      const data = await response.json()
      
             if (data.messages) {
         const formattedMessages = data.messages.map((msg: { id: string; role: string; content: string; created_at: string }) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.created_at)
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      await loadConversations()
      
      // If we deleted the current conversation, start a new one
      if (conversationId === currentConversationId) {
        handleNewConversation()
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Clear file input immediately
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    try {
      // Show processing message
      const processingMessage = `📁 **Processing File:** ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)\n\nProcessing file content...`
      handleInputChange({ target: { value: processingMessage } } as React.ChangeEvent<HTMLTextAreaElement>)

      // Upload file to processing endpoint
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/files/process', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to process file' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process file')
      }

      // Create message with extracted content
      const fileMessage = `📁 **File Uploaded:** ${result.fileName}\n\n${result.content}\n\nPlease let me know what questions you have about this content or how I can help you study it.`
      
      // Set the input to the extracted content
      handleInputChange({ target: { value: fileMessage } } as React.ChangeEvent<HTMLTextAreaElement>)
      
      // Auto-submit after a short delay to ensure the input is updated
      setTimeout(() => {
        const form = document.querySelector('form')
        if (form) {
          form.requestSubmit()
        }
      }, 200)
      
    } catch (error) {
      console.error('Error processing file:', error)
      
      // Show error message with fallback
      const errorMessage = `📁 **File Upload Error:** ${file.name}\n\n❌ ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease try uploading the file again, or copy and paste the content you'd like to discuss.`
      handleInputChange({ target: { value: errorMessage } } as React.ChangeEvent<HTMLTextAreaElement>)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  return (
    <div className={cn("flex flex-col lg:flex-row h-[80vh] lg:h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden", className)}>
      {/* Conversations Sidebar - Hidden on mobile, shown on large screens */}
      <div className="hidden lg:block">
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversationId}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Braincell AI Assistant
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your academic study companion
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bot className="h-16 w-16 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Braincell AI!
              </h3>
                             <p className="text-gray-600 dark:text-gray-400 max-w-md">
                 I&apos;m here to help you study, understand concepts, and succeed academically. 
                 Ask me anything or upload a document to get started!
               </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm font-medium">Ask Questions</p>
                  </div>
                </Card>
                <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">Upload Files</p>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.filter(msg => msg.role === 'user' || msg.role === 'assistant').map((message) => (
                <Message key={message.id} message={{
                  id: message.id,
                  role: message.role as 'user' | 'assistant',
                  content: message.content,
                  createdAt: message.createdAt
                }} />
              ))}
              {isLoading && (
                <Message 
                  message={{ 
                    id: 'loading', 
                    role: 'assistant', 
                    content: '' 
                  }} 
                  isLoading={true} 
                />
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about your studies..."
                className="min-h-[50px] sm:min-h-[60px] resize-none text-sm sm:text-base"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <div className="text-xs text-gray-500 mt-1 px-1 hidden sm:block">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>

            <div className="flex gap-2 justify-end sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.md,.csv,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff,.svg,.zip,.rar,.7z"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
              </Button>
              
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 