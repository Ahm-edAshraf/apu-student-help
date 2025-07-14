'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getTimetableEntries, deleteTimetableEntry, type TimetableEntry } from '@/lib/supabase'
import { Plus, Clock, AlertTriangle } from 'lucide-react'
import ClassForm from '@/components/class-form'

const DAYS = [
  { key: 'monday', label: 'Mon', fullLabel: 'Monday' },
  { key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { key: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
  { key: 'friday', label: 'Fri', fullLabel: 'Friday' },
  { key: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
  { key: 'sunday', label: 'Sun', fullLabel: 'Sunday' }
] as const

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
]

const CLASS_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
  'bg-yellow-500', 'bg-cyan-500'
]

interface TimetableProps {
  className?: string
}

export default function Timetable({ className }: TimetableProps) {
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [overlaps, setOverlaps] = useState<string[]>([])

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await getTimetableEntries()
      if (error) throw error
      const timetableData = (data as unknown as TimetableEntry[]) || []
      setEntries(timetableData)
      detectOverlaps(timetableData)
    } catch (error) {
      console.error('Error fetching timetable entries:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const detectOverlaps = (entries: TimetableEntry[]) => {
    const overlappingIds: string[] = []
    
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entry1 = entries[i]
        const entry2 = entries[j]
        
        // Check if they're on the same day
        if (entry1.day === entry2.day) {
          const start1 = timeToMinutes(entry1.start_time)
          const end1 = timeToMinutes(entry1.end_time)
          const start2 = timeToMinutes(entry2.start_time)
          const end2 = timeToMinutes(entry2.end_time)
          
          // Check for overlap
          if (start1 < end2 && start2 < end1) {
            overlappingIds.push(entry1.id, entry2.id)
          }
        }
      }
    }
    
    setOverlaps([...new Set(overlappingIds)])
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getClassColor = (entryId: string): string => {
    const index = entries.findIndex(entry => entry.id === entryId)
    return CLASS_COLORS[index % CLASS_COLORS.length]
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const { error } = await deleteTimetableEntry(id)
      if (error) throw error
      await fetchEntries()
    } catch (error) {
      console.error('Error deleting entry:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (entry: TimetableEntry) => {
    setSelectedEntry(entry)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedEntry(null)
    fetchEntries()
  }

  const getEntriesForDayAndTime = (day: string, timeSlot: string) => {
    return entries.filter(entry => {
      if (entry.day !== day) return false
      
      const entryStart = timeToMinutes(entry.start_time)
      const entryEnd = timeToMinutes(entry.end_time)
      const slotTime = timeToMinutes(timeSlot)
      const nextSlotTime = timeToMinutes(getNextTimeSlot(timeSlot))
      
      // Check if entry overlaps with this time slot
      return entryStart < nextSlotTime && entryEnd > slotTime
    })
  }

  const getNextTimeSlot = (currentSlot: string): string => {
    const currentIndex = TIME_SLOTS.indexOf(currentSlot)
    return currentIndex < TIME_SLOTS.length - 1 
      ? TIME_SLOTS[currentIndex + 1] 
      : '20:00' // End time for last slot
  }

  const calculateEntryHeight = (entry: TimetableEntry): number => {
    const duration = timeToMinutes(entry.end_time) - timeToMinutes(entry.start_time)
    return Math.max(duration / 60, 0.5) // Minimum 0.5 hour height
  }

  const calculateEntryPosition = (entry: TimetableEntry, timeSlot: string): number => {
    const slotTime = timeToMinutes(timeSlot)
    const entryStart = timeToMinutes(entry.start_time)
    const offsetMinutes = entryStart - slotTime
    return Math.max(offsetMinutes / 60, 0) // Convert to hours
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            📅 Weekly Timetable
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your class schedule
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Class
        </Button>
      </div>

      {overlaps.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Time Conflict Detected!</span>
          </div>
          <p className="text-sm mt-1">
            Some classes have overlapping times. Please review your schedule.
          </p>
        </div>
      )}

      {/* Desktop View */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 min-w-[800px]">
                {/* Time column header */}
                <div className="border-r border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    Time
                  </div>
                </div>
                
                {/* Day headers */}
                {DAYS.map((day) => (
                  <div
                    key={day.key}
                    className="border-r last:border-r-0 border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800 text-center"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {day.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {day.fullLabel}
                    </div>
                  </div>
                ))}
                
                {/* Time slots and entries */}
                {TIME_SLOTS.map((timeSlot) => (
                  <div key={timeSlot} className="contents">
                    {/* Time label */}
                    <div className="border-r border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatTime(timeSlot)}
                      </div>
                    </div>
                    
                    {/* Day columns */}
                    {DAYS.map((day) => {
                      const dayEntries = getEntriesForDayAndTime(day.key, timeSlot)
                      
                      return (
                        <div
                          key={`${day.key}-${timeSlot}`}
                          className="border-r last:border-r-0 border-t border-gray-200 dark:border-gray-700 p-1 min-h-[60px] relative"
                        >
                          {dayEntries.map((entry) => {
                            const isOverlapping = overlaps.includes(entry.id)
                            const height = calculateEntryHeight(entry)
                            const position = calculateEntryPosition(entry, timeSlot)
                            
                            return (
                              <div
                                key={entry.id}
                                className={`absolute left-1 right-1 rounded-md p-2 text-white text-xs cursor-pointer transition-all hover:shadow-md ${
                                  getClassColor(entry.id)
                                } ${isOverlapping ? 'ring-2 ring-red-400' : ''}`}
                                style={{
                                  top: `${position * 60}px`,
                                  height: `${Math.max(height * 60 - 4, 30)}px`
                                }}
                                onClick={() => handleEdit(entry)}
                              >
                                <div className="font-medium truncate">
                                  {entry.title}
                                </div>
                                <div className="text-xs opacity-90">
                                  {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                </div>
                                {isOverlapping && (
                                  <div className="absolute top-1 right-1">
                                    <AlertTriangle className="h-3 w-3 text-red-200" />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {DAYS.map((day) => {
          const dayEntries = entries.filter(entry => entry.day === day.key)
          
          return (
            <Card key={day.key}>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {day.fullLabel}
                </h4>
                
                {dayEntries.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No classes scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayEntries
                      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
                      .map((entry) => {
                        const isOverlapping = overlaps.includes(entry.id)
                        
                        return (
                          <div
                            key={entry.id}
                            className={`p-3 rounded-lg text-white cursor-pointer transition-all hover:shadow-md ${
                              getClassColor(entry.id)
                            } ${isOverlapping ? 'ring-2 ring-red-400' : ''}`}
                            onClick={() => handleEdit(entry)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{entry.title}</div>
                                <div className="text-sm opacity-90">
                                  {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                                </div>
                              </div>
                              {isOverlapping && (
                                <AlertTriangle className="h-4 w-4 text-red-200 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {entries.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No classes scheduled
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start building your timetable by adding your first class.
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Class
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? 'Edit Class' : 'Add New Class'}
            </DialogTitle>
            <DialogDescription>
              {selectedEntry 
                ? 'Update your class details below.' 
                : 'Add a new class to your timetable.'}
            </DialogDescription>
          </DialogHeader>
          <ClassForm
            entry={selectedEntry}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setSelectedEntry(null)
            }}
            onDelete={selectedEntry ? () => handleDelete(selectedEntry.id) : undefined}
            isDeleting={selectedEntry ? deletingId === selectedEntry.id : false}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 