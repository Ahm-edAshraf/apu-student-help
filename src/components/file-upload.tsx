'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, File, X, CheckCircle, Plus } from 'lucide-react'
import { createResource } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { SECURITY_CONFIG, validators, sanitizers, detectSuspiciousInput } from '@/lib/security'

const ALLOWED_FILE_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-powerpoint': 'PPT', 
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/plain': 'TXT',
  'text/markdown': 'MD',
  'text/csv': 'CSV',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
  'image/bmp': 'BMP',
  'image/tiff': 'TIFF',
  'image/svg+xml': 'SVG',
  'application/zip': 'ZIP',
  'application/x-zip-compressed': 'ZIP',
  'application/x-rar-compressed': 'RAR',
  'application/vnd.rar': 'RAR',
  'application/x-7z-compressed': '7Z'
}



const COMMON_TAGS = [
  'Programming', 'Mathematics', 'Database', 'Web Development', 
  'Data Science', 'Networks', 'Software Engineering', 'AI/ML',
  'Cybersecurity', 'Mobile Development', 'UI/UX', 'Project Management',
  'Algorithms', 'Systems Design', 'Cloud Computing', 'DevOps'
]

interface FileUploadProps {
  onSuccess?: () => void
  className?: string
}

export default function FileUpload({ onSuccess, className }: FileUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Use vault-specific file type validation (includes PDFs)
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      return `File type ${file.type} is not supported. Allowed types: ${Object.values(ALLOWED_FILE_TYPES).join(', ')}`
    }

    // Use 50MB size limit for vault uploads
    if (file.size > 50 * 1024 * 1024) {
      return 'File size must be less than 50MB'
    }

    // Check filename for security issues
    if (!validators.filename(file.name)) {
      return 'Invalid filename. Only alphanumeric characters, spaces, dots, hyphens, and underscores are allowed.'
    }

    return null
  }

  const validateInput = (title: string, tags: string[]): string | null => {
    if (!validators.title(title)) {
      return 'Title must be between 1 and 100 characters'
    }

    // Check for suspicious content in title
    if (detectSuspiciousInput(title)) {
      return 'Title contains potentially harmful content'
    }

    // Validate tags
    for (const tag of tags) {
      if (tag.length > 20 || tag.length === 0) {
        return 'Tags must be between 1 and 20 characters'
      }
      if (detectSuspiciousInput(tag)) {
        return 'Tag contains potentially harmful content'
      }
    }

    if (tags.length > 10) {
      return 'Maximum 10 tags allowed'
    }

    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)

    // Auto-populate title from filename if not set
    if (!title) {
      const sanitizedFilename = sanitizers.filename(file.name.replace(/\.[^/.]+$/, ''))
      setTitle(sanitizedFilename)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)

    if (!title) {
      const sanitizedFilename = sanitizers.filename(file.name.replace(/\.[^/.]+$/, ''))
      setTitle(sanitizedFilename)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const addTag = (tag: string) => {
    const trimmedTag = sanitizers.text(tag.trim())
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      if (trimmedTag.length <= 20 && !detectSuspiciousInput(trimmedTag)) {
        setTags([...tags, trimmedTag])
      }
    }
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !title.trim()) return

    // Validate all inputs
    const sanitizedTitle = sanitizers.text(title.trim())
    const sanitizedTags = tags.map(tag => sanitizers.text(tag))

    const inputValidationError = validateInput(sanitizedTitle, sanitizedTags)
    if (inputValidationError) {
      setError(inputValidationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Generate secure filename
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const sanitizedFileName = sanitizers.filename(`${timestamp}-${randomId}.${fileExt}`)
      const filePath = `study-materials/${sanitizedFileName}`

      // Upload file to Supabase storage with security checks
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      // Create resource record with sanitized data
      const { error: createError } = await createResource({
        title: sanitizedTitle,
        tags: sanitizedTags,
        url: publicUrl,
        file_name: sanitizers.filename(selectedFile.name),
        file_size: selectedFile.size,
        file_type: selectedFile.type
      })

      if (createError) throw createError

      // Reset form
      setSelectedFile(null)
      setTitle('')
      setTags([])
      setSuccess(true)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setTimeout(() => setSuccess(false), 3000)
      onSuccess?.()

    } catch (err: unknown) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= SECURITY_CONFIG.contentLimits.title) {
      setTitle(value)
    }
  }

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(newTag)
    }
  }

  if (success) {
    return (
      <Card className={className}>
        <CardContent className="p-12">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              File Uploaded Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your study material has been added to the vault.
            </p>
            <Button 
              onClick={() => {
                setSuccess(false)
                setSelectedFile(null)
                setTitle('')
                setTags([])
              }}
            >
              Upload Another File
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Study Material
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFile 
                ? 'border-green-300 bg-green-50 dark:bg-green-950' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50 dark:bg-gray-800'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <File className="h-12 w-12 mx-auto text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatFileSize(selectedFile.size)} • {ALLOWED_FILE_TYPES[selectedFile.type as keyof typeof ALLOWED_FILE_TYPES]}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Max size: 50MB • Supported: PDF, DOC, PPT, XLS, TXT, CSV, Images, ZIP, RAR, 7Z
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
              className="hidden"
            />
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Database Design Notes, Java Programming Guide"
              value={title}
              onChange={handleTitleChange}
              required
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-3">
            <Label>Tags</Label>
            
            {/* Selected Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim() || loading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Common Tags */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Common tags:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.filter(tag => !tags.includes(tag)).slice(0, 8).map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(tag)}
                    className="text-xs"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedFile(null)
                setTitle('')
                setTags([])
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              disabled={loading}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !title.trim() || loading}
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 