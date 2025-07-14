'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getResources, addBookmark, removeBookmark, isResourceBookmarked, deleteResource, type Resource } from '@/lib/supabase'
import { Search, Filter, Download, Eye, Bookmark, BookmarkCheck, Calendar, FileText, Tag, Trash2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ResourceBrowserProps {
  className?: string
  showUploadedOnly?: boolean
}

export default function ResourceBrowser({ className, showUploadedOnly = false }: ResourceBrowserProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest')
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set())
  const [allTags, setAllTags] = useState<string[]>([])

  const fetchResources = async () => {
    try {
      const { data, error } = await getResources()
      if (error) throw error
      const resourceData = (data as unknown as Resource[]) || []
      setResources(resourceData)
      
      // Extract all unique tags
      const tags = new Set<string>()
      resourceData.forEach(resource => {
        resource.tags.forEach(tag => tags.add(tag))
      })
      setAllTags(Array.from(tags).sort())
      
      // Check bookmarked status for each resource
      const bookmarkedIds = new Set<string>()
      for (const resource of resourceData) {
        try {
          const { data: isBookmarked } = await isResourceBookmarked(resource.id)
          if (isBookmarked) {
            bookmarkedIds.add(resource.id)
          }
        } catch (error) {
          console.error('Error checking bookmark status:', error)
        }
      }
      setBookmarkedResources(bookmarkedIds)
      
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    let filtered = [...resources]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply tag filter
    if (selectedTag && selectedTag !== 'all') {
      filtered = filtered.filter(resource => resource.tags.includes(selectedTag))
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        case 'oldest':
          return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        case 'size':
          return b.file_size - a.file_size
        default:
          return 0
      }
    })

    setFilteredResources(filtered)
  }, [resources, searchQuery, selectedTag, sortBy])

  const handleBookmarkToggle = async (resourceId: string) => {
    try {
      const isCurrentlyBookmarked = bookmarkedResources.has(resourceId)
      
      if (isCurrentlyBookmarked) {
        const { error } = await removeBookmark(resourceId)
        if (error) throw error
        setBookmarkedResources(prev => {
          const newSet = new Set(prev)
          newSet.delete(resourceId)
          return newSet
        })
      } else {
        const { error } = await addBookmark(resourceId)
        if (error) throw error
        setBookmarkedResources(prev => new Set(prev).add(resourceId))
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    
    try {
      const { error } = await deleteResource(resourceId)
      if (error) throw error
      await fetchResources() // Refresh the list
    } catch (error) {
      console.error('Error deleting resource:', error)
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
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources by title or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tag Filter */}
          <div className="w-full sm:w-48">
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="w-full sm:w-40">
            <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'name' | 'size') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found</span>
          {(searchQuery || selectedTag !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedTag('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-md transition-shadow">
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
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBookmarkToggle(resource.id)}
                    className="p-1 h-8 w-8"
                  >
                    {bookmarkedResources.has(resource.id) ? (
                      <BookmarkCheck className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Bookmark className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  
                  {showUploadedOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(resource.id)}
                      className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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

              {/* Upload Info */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(resource.uploaded_at), { addSuffix: true })}
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
        ))}
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || selectedTag !== 'all' ? 'No resources found' : 'No resources available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || selectedTag !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Be the first to upload study materials to the vault!'
                }
              </p>
              {(searchQuery || selectedTag !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedTag('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 