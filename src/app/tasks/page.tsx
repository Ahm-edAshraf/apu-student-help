'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import TaskForm from '@/components/task-form'
import TaskList from '@/components/task-list'
import TaskFilters from '@/components/task-filters'
import { getTasks, type Task } from '@/lib/supabase'
import { isToday, isPast } from 'date-fns'

export default function TasksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentFilter, setCurrentFilter] = useState<'all' | 'due_today' | 'overdue' | 'pending' | 'in_progress' | 'completed'>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [taskCounts, setTaskCounts] = useState({
    all: 0,
    due_today: 0,
    overdue: 0,
    pending: 0,
    in_progress: 0,
    completed: 0
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    fetchTaskCounts()
  }, [refreshTrigger])

  const fetchTaskCounts = async () => {
    try {
      const { data, error } = await getTasks()
      if (error) throw error
      
      const tasks = (data as unknown as Task[]) || []
      
      const counts = {
        all: tasks.length,
        due_today: tasks.filter(task => isToday(new Date(task.due_date))).length,
        overdue: tasks.filter(task => 
          isPast(new Date(task.due_date)) && 
          !isToday(new Date(task.due_date)) && 
          task.status !== 'completed'
        ).length,
        pending: tasks.filter(task => task.status === 'pending').length,
        in_progress: tasks.filter(task => task.status === 'in_progress').length,
        completed: tasks.filter(task => task.status === 'completed').length
      }
      
      setTaskCounts(counts)
    } catch (error) {
      console.error('Error fetching task counts:', error)
    }
  }

  const handleTaskChange = () => {
    setRefreshTrigger(prev => prev + 1)
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
              onClick={() => router.push('/dashboard')} 
              variant="ghost" 
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ⏰ Assignment Tracker
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your deadlines and stay on top of assignments
              </p>
            </div>
          </div>
          
          <TaskForm onSuccess={handleTaskChange} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{taskCounts.all}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{taskCounts.due_today}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Due Today</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{taskCounts.overdue}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{taskCounts.completed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters 
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
            taskCounts={taskCounts}
          />
        </div>

        {/* Task List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentFilter === 'all' && 'All Tasks'}
              {currentFilter === 'due_today' && 'Tasks Due Today'}
              {currentFilter === 'overdue' && 'Overdue Tasks'}
              {currentFilter === 'pending' && 'Pending Tasks'}
              {currentFilter === 'in_progress' && 'In Progress Tasks'}
              {currentFilter === 'completed' && 'Completed Tasks'}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {currentFilter === 'all' 
                ? `${taskCounts.all} task${taskCounts.all !== 1 ? 's' : ''} total`
                : `${taskCounts[currentFilter]} task${taskCounts[currentFilter] !== 1 ? 's' : ''}`
              }
            </div>
          </div>
          
          <TaskList 
            filter={currentFilter}
            refreshTrigger={refreshTrigger}
            onTaskChange={handleTaskChange}
          />
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Pro Tips:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Use <strong>High Priority</strong> for urgent assignments due soon</li>
            <li>• Mark tasks as <strong>In Progress</strong> when you start working on them</li>
            <li>• Check the <strong>Due Today</strong> filter each morning to plan your day</li>
            <li>• Complete overdue tasks first to stay on track</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 