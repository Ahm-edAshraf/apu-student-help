'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, AlertTriangle, List, Play, CheckCircle } from 'lucide-react'

interface TaskFiltersProps {
  currentFilter: 'all' | 'due_today' | 'overdue' | 'pending' | 'in_progress' | 'completed'
  onFilterChange: (filter: 'all' | 'due_today' | 'overdue' | 'pending' | 'in_progress' | 'completed') => void
  taskCounts?: {
    all: number
    due_today: number
    overdue: number
    pending: number
    in_progress: number
    completed: number
  }
}

export default function TaskFilters({ currentFilter, onFilterChange, taskCounts }: TaskFiltersProps) {
  const filters = [
    {
      key: 'all' as const,
      label: 'All Tasks',
      icon: <List className="h-4 w-4" />,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    {
      key: 'due_today' as const,
      label: 'Due Today',
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    {
      key: 'overdue' as const,
      label: 'Overdue',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800 border-red-200'
    },
    {
      key: 'pending' as const,
      label: 'Pending',
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    {
      key: 'in_progress' as const,
      label: 'In Progress',
      icon: <Play className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      key: 'completed' as const,
      label: 'Completed',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800 border-green-200'
    }
  ]

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg border">
      <div className="flex items-center gap-2 mr-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        Filter by:
      </div>
      
      {filters.map((filter) => {
        const isActive = currentFilter === filter.key
        const count = taskCounts?.[filter.key] ?? 0
        
        return (
          <Button
            key={filter.key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.key)}
            className={`gap-2 ${!isActive ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
          >
            {filter.icon}
            {filter.label}
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className={`ml-1 text-xs ${isActive ? 'bg-white/20 text-white' : filter.color}`}
              >
                {count}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
} 