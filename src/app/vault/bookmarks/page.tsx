'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getUserBookmarks, removeBookmark, type Resource } from '@/lib/supabase'
import { ArrowLeft, BookOpen, Download, Eye, Trash2, ExternalLink, Tag, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BookmarkWithResource {
  id: string
  user_id: string
  resource_id: string
  created_at: string
  resources: Resource
}

export default function BookmarksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BookmarkWithResource[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const fetchBookmarks = async () => {
    try {
      const { data, error } = await getUserBookmarks()
      if (error) throw error
      setBookmarks((data as unknown as BookmarkWithResource[]) || [])
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setBookmarksLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBookmarks()
    }
  }, [user])

  const handleRemoveBookmark = async (resourceId: string) => {
    try {
      const { error } = await removeBookmark(resourceId)
      if (error) throw error
      await fetchBookmarks() // Refresh the list
    } catch (error) {
      console.error('Error removing bookmark:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊'
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📈'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦'
    return '📄'
  }

  const handleDownload = (resource: Resource) => {
    window.open(resource.url, '_blank')
  }

  const handleView = (resource: Resource) => {
    // For PDFs and images, open in new tab for viewing
    if (resource.file_type.includes('pdf') || resource.file_type.includes('image')) {
      window.open(resource.url, '_blank')
    } else {
      // For other files, download them
      handleDownload(resource)
    }
  }

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BookOpen className="h-8 w-8" />
                My Bookmarks
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your saved study materials for quick access
              </p>
            </div>
          </div>
        </div>

        {bookmarksLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
              ))}
            </div>
          </div>
        ) : bookmarks.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No bookmarks yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start bookmarking useful study materials to access them quickly later.
                </p>
                <Button onClick={() => router.push('/vault')}>
                  Browse Materials
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => {
                const resource = bookmark.resources
                
                return (
                  <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getFileIcon(resource.file_type)}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {resource.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatFileSize(resource.file_size)}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBookmark(resource.id)}
                          className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                          title="Remove bookmark"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Tags */}
                      {resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resource.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{resource.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bookmark Info */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Bookmarked {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(resource)}
                          className="flex-1 gap-2"
                        >
                          {resource.file_type.includes('pdf') || resource.file_type.includes('image') ? (
                            <>
                              <Eye className="h-4 w-4" />
                              View
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(resource)}
                          className="p-2"
                          title="Download"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 