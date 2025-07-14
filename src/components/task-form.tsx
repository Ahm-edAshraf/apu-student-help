'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createTask, updateTask, type Task } from '@/lib/supabase'
import { CalendarDays, Plus, Edit } from 'lucide-react'

interface TaskFormProps {
  task?: Task | null
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export default function TaskForm({ task, onSuccess, trigger }: TaskFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed'
  })

  const isEditing = !!task

  useEffect(() => {
    if (open) {
      setError(null) // Clear any previous errors when dialog opens
      
      if (task) {
        setFormData({
          title: task.title,
          due_date: new Date(task.due_date).toISOString().slice(0, 16),
          priority: task.priority,
          status: task.status
        })
      } else {
        setFormData({
          title: '',
          due_date: '',
          priority: 'medium',
          status: 'pending'
        })
      }
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const taskData = {
        ...formData,
        due_date: new Date(formData.due_date).toISOString()
      }

      if (isEditing && task) {
        const { error } = await updateTask(task.id, taskData)
        if (error) throw error
      } else {
        const { error } = await createTask(taskData)
        if (error) throw error
      }

      setOpen(false)
      onSuccess?.()
    } catch (err: unknown) {
      console.error('Error saving task:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the task'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }



  const defaultTrigger = (
    <Button size="sm" className="gap-2">
      {isEditing ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {isEditing ? 'Edit Task' : 'Add Task'}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {isEditing ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your task details below.' : 'Create a new task to track your deadlines.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="e.g., SAAD Report, Java Lab Assignment"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'pending' | 'in_progress' | 'completed') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">📋 Pending</SelectItem>
                  <SelectItem value="in_progress">⏳ In Progress</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 