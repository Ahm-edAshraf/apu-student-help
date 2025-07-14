'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { signOut, getTasks, getStudyLogs, getResources } from '@/lib/supabase'
import StickyNotes from '@/components/sticky-notes'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Dashboard statistics
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    hoursStudied: 0,
    filesUploaded: 0,
    pendingTasks: 0,
    loading: true
  })

  // Fetch dashboard statistics
  const fetchStats = async () => {
    if (!user) return
    
    setStats(prev => ({ ...prev, loading: true }))
    
    try {
      const [tasksResult, studyLogsResult, resourcesResult] = await Promise.all([
        getTasks(),
        getStudyLogs(),
        getResources()
      ])

      // Count completed tasks
      const completedTasks = tasksResult.data?.filter(task => task.status === 'completed').length || 0

      // Count pending tasks due today
      const today = new Date().toISOString().split('T')[0]
      const todayTasks = tasksResult.data?.filter(task => 
        task.status !== 'completed' && 
        task.due_date && 
        task.due_date.startsWith(today)
      ).length || 0

      // Calculate total study hours
      const totalMinutes = studyLogsResult.data?.reduce((sum, log) => sum + log.duration, 0) || 0
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10 // Round to 1 decimal place

      // Count files uploaded by current user
      const userFiles = resourcesResult.data?.filter(resource => resource.uploader_id === user.id).length || 0

      setStats({
        tasksCompleted: completedTasks,
        hoursStudied: totalHours,
        filesUploaded: userFiles,
        pendingTasks: todayTasks,
        loading: false
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              APU STUDY HUB
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Welcome back, {user.user_metadata?.name || user.email}!
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm" className="self-start sm:self-auto">
            Sign Out
          </Button>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.loading ? (
                <div className="animate-pulse bg-blue-200 dark:bg-blue-700 h-8 w-8 rounded"></div>
              ) : (
                stats.tasksCompleted
              )}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Tasks Completed</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.loading ? (
                <div className="animate-pulse bg-green-200 dark:bg-green-700 h-8 w-12 rounded"></div>
              ) : (
                stats.hoursStudied
              )}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Hours Studied</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.loading ? (
                <div className="animate-pulse bg-purple-200 dark:bg-purple-700 h-8 w-8 rounded"></div>
              ) : (
                stats.filesUploaded
              )}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Files Uploaded</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Deadlines Due Today */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">⚠️ Deadlines Due Today</h3>
            {stats.loading ? (
              <div className="animate-pulse space-y-2">
                <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4"></div>
              </div>
            ) : stats.pendingTasks > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.pendingTasks}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/tasks')}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                  >
                    View Tasks
                  </Button>
                </div>
                <p className="text-red-600 dark:text-red-400">
                  {stats.pendingTasks === 1 ? 'task' : 'tasks'} due today
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don&apos;t forget to complete your assignments!
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <div className="text-4xl mb-2">🎉</div>
                <p>No deadlines today!</p>
                <p className="text-sm mt-2">You&apos;re all caught up</p>
              </div>
            )}
          </div>

          {/* Sticky Notes */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <StickyNotes />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Cards */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">📅 Timetable</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Manage your class schedule
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/timetable')}>
              Build Timetable
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">⏰ Assignment Tracker</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Track deadlines and tasks
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/tasks')}>
              Manage Tasks
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">🗂️ Study Materials</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Upload and browse resources
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/vault')}>
              Browse Vault
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">📊 Study Tracker</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Log and visualize study sessions
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/study-tracker')}>
              Track Study Time
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">🧠 Braincell AI</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              AI-powered study assistant
            </p>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => window.location.href = '/braincell'}
            >
              Ask AI Assistant
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">⚙️ Settings</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Manage your profile and preferences
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/settings')}>
              View Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 