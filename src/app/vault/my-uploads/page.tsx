"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getResources, deleteResource, Resource } from '@/lib/supabase'
import { Trash2, ArrowLeft } from 'lucide-react'

export default function MyUploadsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [extraConfirm, setExtraConfirm] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Resource | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const fetchUploads = useCallback(async () => {
    const { data, error } = await getResources()
    if (error || !user || !Array.isArray(data)) return
    setResources(
      (data as unknown[]).filter((r): r is Resource =>
        typeof r === 'object' && r !== null &&
        'id' in r && 'title' in r && 'uploader_id' in r && (r as Resource).uploader_id === user.id
      )
    )
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUploads()
    }
  }, [user, fetchUploads])

  const handleDelete = (resource: Resource) => {
    setPendingDelete(resource)
    setConfirmText('')
    setExtraConfirm(false)
    setError('')
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    if (confirmText !== pendingDelete.title) {
      setError('File name does not match. Please type the exact file name to confirm.')
      return
    }
    if (!extraConfirm) {
      setError('Please check the extra confirmation box.')
      return
    }
    setDeletingId(pendingDelete.id)
    setError('')
    const { error } = await deleteResource(pendingDelete.id)
    if (error) {
      setError('Failed to delete. Please try again.')
      setDeletingId(null)
      return
    }
    setResources(resources.filter(r => r.id !== pendingDelete.id))
    setPendingDelete(null)
    setDeletingId(null)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => router.push('/vault')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vault
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Uploads</h1>
        </div>
        {resources.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">You haven&apos;t uploaded any resources yet.</div>
        ) : (
          <div className="space-y-4">
            {resources.map(resource => (
              <Card key={resource.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{resource.title}</div>
                    <div className="text-xs text-gray-500">{resource.file_type} &middot; {resource.file_size} bytes</div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(resource)}
                    disabled={deletingId === resource.id}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {pendingDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-bold mb-2 text-red-600">Confirm Deletion</h2>
              <p className="mb-2">To delete <span className="font-semibold">{pendingDelete.title}</span>, type the file name below:</p>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Type file name exactly..."
                className="mb-2"
                autoFocus
              />
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="extra-confirm"
                  checked={extraConfirm}
                  onChange={e => setExtraConfirm(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="extra-confirm" className="text-sm">I understand this action is permanent and cannot be undone.</label>
              </div>
              {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deletingId === pendingDelete.id}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={deletingId === pendingDelete.id}>
                  {deletingId === pendingDelete.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 