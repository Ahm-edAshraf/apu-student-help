'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Chat from '@/components/chat'

export default function BraincellPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="ghost" 
                size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
              </Button>
              <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  🧠 Braincell AI
                </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your intelligent study companion powered by Gemini AI
                </p>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <Chat className="max-w-full" />

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">💡 How to get the best results:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <ul className="space-y-2">
              <li>• <strong>Be specific:</strong> Ask detailed questions about your study topics</li>
              <li>• <strong>Upload materials:</strong> Share documents, notes, or images for analysis</li>
              <li>• <strong>Request examples:</strong> Ask for practice questions or explanations</li>
            </ul>
            <ul className="space-y-2">
              <li>• <strong>Explain concepts:</strong> Request step-by-step breakdowns</li>
              <li>• <strong>Study strategies:</strong> Get personalized learning tips</li>
              <li>• <strong>Multiple formats:</strong> Ask for summaries, mind maps, or flashcards</li>
            </ul>
          </div>
        </div>

        {/* Academic Integrity Notice */}
        <div className="mt-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Academic Integrity:</strong> Braincell AI is designed to help you learn and understand concepts. 
            Use it responsibly to enhance your studies, not to complete assignments directly.
          </p>
        </div>
      </div>
    </div>
  )
} 