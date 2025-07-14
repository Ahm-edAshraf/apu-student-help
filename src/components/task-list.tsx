'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getTasks, deleteTask, type Task } from '@/lib/supabase'
import TaskForm from './task-form'
import { Edit, Trash2, Calendar, Clock, AlertTriangle } from 'lucide-react'
import { format, isToday, isPast, isTomorrow, isThisWeek } from 'date-fns'

interface TaskListProps {
  filter?: 'all' | 'due_today' | 'overdue' | 'pending' | 'in_progress' | 'completed'
  refreshTrigger?: number
  onTaskChange?: () => void
}

export default function TaskList({ filter = 'all', refreshTrigger, onTaskChange }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTasks = async () => {
    try {
      const { data, error } = await getTasks()
      if (error) throw error
      setTasks((data as unknown as Task[]) || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [refreshTrigger])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const { error } = await deleteTask(id)
      if (error) throw error
      await fetchTasks()
      onTaskChange?.()
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleTaskUpdate = () => {
    fetchTasks()
    onTaskChange?.()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'in_progress': return '⏳'
      case 'pending': return '📋'
      default: return '📋'
    }
  }

  const getDueDateInfo = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    
    if (isPast(due) && !isToday(due)) {
      return {
        text: `Overdue by ${Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))} days`,
        color: 'text-red-600',
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />
      }
    } else if (isToday(due)) {
      return {
        text: `Due today at ${format(due, 'h:mm a')}`,
        color: 'text-orange-600',
        icon: <Clock className="h-4 w-4 text-orange-600" />
      }
    } else if (isTomorrow(due)) {
      return {
        text: `Due tomorrow at ${format(due, 'h:mm a')}`,
        color: 'text-yellow-600',
        icon: <Calendar className="h-4 w-4 text-yellow-600" />
      }
    } else if (isThisWeek(due)) {
      return {
        text: `Due ${format(due, 'EEEE')} at ${format(due, 'h:mm a')}`,
        color: 'text-blue-600',
        icon: <Calendar className="h-4 w-4 text-blue-600" />
      }
    } else {
      return {
        text: `Due ${format(due, 'MMM d, yyyy')} at ${format(due, 'h:mm a')}`,
        color: 'text-gray-600',
        icon: <Calendar className="h-4 w-4 text-gray-600" />
      }
    }
  }

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'due_today':
        return isToday(new Date(task.due_date))
      case 'overdue':
        return isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'completed'
      case 'pending':
        return task.status === 'pending'
      case 'in_progress':
        return task.status === 'in_progress'
      case 'completed':
        return task.status === 'completed'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-20"></div>
          </div>
        ))}
      </div>
    )
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No tasks found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {filter === 'all' 
            ? "You haven't created any tasks yet." 
            : `No tasks match the "${filter.replace('_', ' ')}" filter.`}
        </p>
        {filter === 'all' && (
          <TaskForm onSuccess={handleTaskUpdate} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredTasks.map((task) => {
        const dueDateInfo = getDueDateInfo(task.due_date)
        
        return (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-lg">{getStatusIcon(task.status)}</span>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {dueDateInfo.icon}
                        <span className={`text-sm ${dueDateInfo.color}`}>
                          {dueDateInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-8">
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <TaskForm 
                    task={task} 
                    onSuccess={handleTaskUpdate}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    disabled={deletingId === task.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 