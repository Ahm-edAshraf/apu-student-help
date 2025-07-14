'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Timetable from '@/components/timetable'

export default function TimetablePage() {
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
                📅 Class Timetable
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your weekly class schedule
              </p>
            </div>
          </div>
        </div>

        {/* Timetable Component */}
        <Timetable />

        {/* Tips Section */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Timetable Tips:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <ul className="space-y-1">
              <li>• <strong>Color Coding:</strong> Each class gets a unique color automatically</li>
              <li>• <strong>Overlap Detection:</strong> Classes with time conflicts are highlighted in red</li>
              <li>• <strong>Mobile Friendly:</strong> View your schedule in a card layout on mobile</li>
            </ul>
            <ul className="space-y-1">
              <li>• <strong>Quick Edit:</strong> Click on any class to edit or delete it</li>
              <li>• <strong>Time Validation:</strong> Classes must be 30+ minutes and within 8 AM - 10 PM</li>
              <li>• <strong>Weekly View:</strong> See your entire week at a glance on desktop</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 