'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { createNote, getNotes, updateNote, deleteNote, type Note } from '@/lib/supabase'
import { Pin, PinOff, Plus, X, Skull } from 'lucide-react'
import { differenceInDays } from 'date-fns'

const MAX_NOTES = 5

const NEGLECTED_MESSAGES = [
  "This note is gathering digital dust 💀",
  "Forgotten like last semester's textbooks 💀",
  "More neglected than a gym membership 💀",
  "Aging like milk in the sun 💀",
  "Cobwebs are forming on this note 💀",
  "This note is having an existential crisis 💀"
]

interface StickyNotesProps {
  className?: string
}

export default function StickyNotes({ className }: StickyNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  const fetchNotes = async () => {
    try {
      const { data, error } = await getNotes()
      if (error) throw error
      setNotes((data as unknown as Note[]) || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  const createNewNote = async () => {
    if (notes.length >= MAX_NOTES) return

    try {
      const { data, error } = await createNote({
        content: '',
        pinned: false
      })
      if (error) throw error
      if (data) {
        setNotes(prev => [data as unknown as Note, ...prev])
      }
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const debouncedUpdate = useCallback(
    debounce(async (id: string, content: string) => {
      try {
        const { error } = await updateNote(id, { content })
        if (error) throw error
      } catch (error) {
        console.error('Error updating note:', error)
      } finally {
        setSavingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(id)
          return newSet
        })
      }
    }, 1000),
    []
  )

  const handleContentChange = (id: string, content: string) => {
    // Update local state immediately
    setNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, content } : note
      )
    )

    // Mark as saving
    setSavingIds(prev => new Set(prev).add(id))

    // Debounced save
    debouncedUpdate(id, content)
  }

  const togglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await updateNote(id, { pinned: !currentPinned })
      if (error) throw error
      
      setNotes(prev => 
        prev.map(note => 
          note.id === id ? { ...note, pinned: !currentPinned } : note
        )
      )
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteNote(id)
      if (error) throw error
      
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const isNoteOld = (createdAt: string) => {
    return differenceInDays(new Date(), new Date(createdAt)) >= 7
  }

  const getRandomNeglectedMessage = () => {
    return NEGLECTED_MESSAGES[Math.floor(Math.random() * NEGLECTED_MESSAGES.length)]
  }

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📝 Sticky Notes
        </h3>
        <Button
          onClick={createNewNote}
          disabled={notes.length >= MAX_NOTES}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {notes.length >= MAX_NOTES && (
        <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-2">
          📌 Maximum {MAX_NOTES} notes reached. Delete a note to add a new one.
        </div>
      )}

      <div className="grid gap-3">
        {notes.map((note) => {
          const isOld = isNoteOld(note.created_at)
          const isSaving = savingIds.has(note.id)
          
          return (
            <Card 
              key={note.id} 
              className={`relative transition-all duration-300 ${
                isOld ? 'opacity-60 grayscale' : ''
              } ${note.pinned ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => togglePin(note.id, note.pinned)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      {note.pinned ? (
                        <Pin className="h-3 w-3 text-blue-600" />
                      ) : (
                        <PinOff className="h-3 w-3 text-gray-400" />
                      )}
                    </Button>
                    {isSaving && (
                      <div className="text-xs text-gray-500">Saving...</div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDelete(note.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {isOld && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <Skull className="h-3 w-3" />
                    <span>{getRandomNeglectedMessage()}</span>
                  </div>
                )}

                <Textarea
                  value={note.content}
                  onChange={(e) => handleContentChange(note.id, e.target.value)}
                  placeholder="Write your note here..."
                  className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 bg-transparent"
                />

                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                  <span>
                    {differenceInDays(new Date(), new Date(note.created_at)) === 0
                      ? 'Today'
                      : `${differenceInDays(new Date(), new Date(note.created_at))} days ago`}
                  </span>
                  {note.pinned && (
                    <span className="text-blue-600 dark:text-blue-400">Pinned</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No sticky notes yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first note to get started!
          </p>
          <Button onClick={createNewNote} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>
      )}
    </div>
  )
}

// Debounce utility function
function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
} 