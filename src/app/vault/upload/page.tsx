'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import FileUpload from '@/components/file-upload'

export default function UploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/vault')} 
              variant="ghost" 
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vault
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🗂️ Upload Study Material
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Share your study materials with the community
              </p>
            </div>
          </div>
        </div>

        {/* Upload Component */}
        <FileUpload 
          onSuccess={() => {
            // Redirect to browse page after successful upload
            setTimeout(() => {
              router.push('/vault')
            }, 2000)
          }}
        />

        {/* Tips Section */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📚 Upload Guidelines:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <ul className="space-y-1">
              <li>• <strong>Supported Formats:</strong> PDF, DOC, PPT, XLS, TXT, CSV, Images, ZIP, RAR</li>
              <li>• <strong>File Size Limit:</strong> Maximum 50MB per file</li>
              <li>• <strong>Quality Content:</strong> Upload clear, useful study materials</li>
            </ul>
            <ul className="space-y-1">
              <li>• <strong>Descriptive Titles:</strong> Use clear, searchable titles</li>
              <li>• <strong>Relevant Tags:</strong> Add tags to help others find your content</li>
              <li>• <strong>Community Guidelines:</strong> Respect copyright and academic integrity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 