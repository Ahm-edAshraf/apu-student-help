'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, BookOpen } from 'lucide-react'
import ResourceBrowser from '@/components/resource-browser'

export default function VaultPage() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="ghost" 
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🗂️ Study Materials Vault
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Browse and download study materials shared by the community
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/vault/bookmarks')}
              variant="outline"
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              My Bookmarks
            </Button>
            <Button
              onClick={() => router.push('/vault/upload')}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Material
            </Button>
            <Button
              onClick={() => router.push('/vault/my-uploads')}
              variant="outline"
              className="gap-2"
            >
              My Uploads
            </Button>
          </div>
        </div>

        {/* Resource Browser */}
        <ResourceBrowser />

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📚 How to Use</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Search by title or tags, filter by categories, and bookmark useful resources for quick access later.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🤝 Sharing Guidelines</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload high-quality study materials with clear titles and relevant tags to help your fellow students.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">⚡ Quick Actions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on any resource to view or download. Use the bookmark button to save resources for later reference.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 