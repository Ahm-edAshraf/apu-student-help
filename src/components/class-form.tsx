'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTimetableEntry, updateTimetableEntry, type TimetableEntry } from '@/lib/supabase'
import { Calendar, Clock, Trash2 } from 'lucide-react'

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
] as const

interface ClassFormProps {
  entry?: TimetableEntry | null
  onSuccess?: () => void
  onCancel?: () => void
  onDelete?: () => void
  isDeleting?: boolean
}

export default function ClassForm({ entry, onSuccess, onCancel, onDelete, isDeleting }: ClassFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    day: 'monday' as TimetableEntry['day'],
    start_time: '',
    end_time: ''
  })

  const isEditing = !!entry

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        day: entry.day,
        start_time: entry.start_time,
        end_time: entry.end_time
      })
    } else {
      setFormData({
        title: '',
        day: 'monday',
        start_time: '',
        end_time: ''
      })
    }
    setError(null)
  }, [entry])

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Class title is required'
    }
    
    if (!formData.start_time || !formData.end_time) {
      return 'Both start and end times are required'
    }

    const startMinutes = timeToMinutes(formData.start_time)
    const endMinutes = timeToMinutes(formData.end_time)

    if (startMinutes >= endMinutes) {
      return 'End time must be after start time'
    }

    if (endMinutes - startMinutes < 30) {
      return 'Class duration must be at least 30 minutes'
    }

    if (startMinutes < 480 || endMinutes > 1320) { // 8:00 AM to 10:00 PM
      return 'Classes must be scheduled between 8:00 AM and 10:00 PM'
    }

    return null
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        return
      }

      if (isEditing && entry) {
        const { error } = await updateTimetableEntry(entry.id, formData)
        if (error) throw error
      } else {
        const { error } = await createTimetableEntry(formData)
        if (error) throw error
      }

      onSuccess?.()
    } catch (err: unknown) {
      console.error('Error saving class:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the class'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Class Title</Label>
        <Input
          id="title"
          placeholder="e.g., Database Systems, Web Development Lab"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="day">Day of Week</Label>
        <Select value={formData.day} onValueChange={(value: TimetableEntry['day']) => setFormData({ ...formData, day: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((day) => (
              <SelectItem key={day.key} value={day.key}>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {day.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="start_time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="pl-10"
              min="08:00"
              max="22:00"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="end_time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="pl-10"
              min="08:30"
              max="22:00"
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-md text-sm">
        <div className="font-medium mb-1">💡 Tips:</div>
        <ul className="space-y-1 text-xs">
          <li>• Classes must be between 8:00 AM and 10:00 PM</li>
          <li>• Minimum class duration is 30 minutes</li>
                     <li>• You&apos;ll be warned if classes overlap</li>
        </ul>
      </div>

      <div className="flex justify-between gap-3 pt-4">
        <div>
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting || loading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Class'}
            </Button>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Class' : 'Add Class')}
          </Button>
        </div>
      </div>
    </form>
  )
} 