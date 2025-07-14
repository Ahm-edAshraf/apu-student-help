'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createStudyLog, getStudyStats, StudyLog } from '@/lib/supabase'
import { ArrowLeft, BookOpen, Clock, Target, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'

interface StudyStats {
  totalHours: number
  totalSessions: number
  streak: number
  logs: StudyLog[]
}

export default function StudyTrackerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [formData, setFormData] = useState({
    topic: '',
    duration: '',
    productivity: '3'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  const fetchStats = async () => {
    const { data, error } = await getStudyStats()
    if (error) {
      console.error('Error fetching stats:', error)
      return
    }
    setStats(data as unknown as StudyStats)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic.trim() || !formData.duration) return

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await createStudyLog({
        topic: formData.topic.trim(),
        duration: parseInt(formData.duration),
        productivity: parseInt(formData.productivity) as 1 | 2 | 3 | 4 | 5
      })

      if (error) throw error

      setSuccess(`Study session logged: ${formData.duration} minutes on ${formData.topic}`)
      setFormData({ topic: '', duration: '', productivity: '3' })
      fetchStats() // Refresh stats

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log study session')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getWeeklyData = () => {
    if (!stats?.logs) return []

    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return daysInWeek.map(day => {
      const dayLogs = stats.logs.filter((log: StudyLog) => 
        isSameDay(new Date(log.timestamp), day)
      )
      const totalMinutes = dayLogs.reduce((sum: number, log: StudyLog) => sum + log.duration, 0)
      
      return {
        day: format(day, 'EEE'),
        date: format(day, 'MMM dd'),
        minutes: totalMinutes,
        hours: Math.round(totalMinutes / 60 * 10) / 10
      }
    })
  }

  const getTopicData = () => {
    if (!stats?.logs) return []

    const topicMap = new Map<string, number>()
    stats.logs.forEach((log: StudyLog) => {
      const current = topicMap.get(log.topic) || 0
      topicMap.set(log.topic, current + log.duration)
    })

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0']
    let colorIndex = 0

    return Array.from(topicMap.entries())
      .map(([topic, minutes]) => ({
        topic,
        minutes,
        hours: Math.round(minutes / 60 * 10) / 10,
        fill: colors[colorIndex++ % colors.length]
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 6) // Top 6 topics
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (!user) return null

  const weeklyData = getWeeklyData()
  const topicData = getTopicData()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => router.push('/dashboard')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              📊 Study Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your study sessions and monitor your progress
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalHours || 0}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalSessions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Streak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.streak || 0} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg/Session</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalSessions ? Math.round((stats.totalHours * 60) / stats.totalSessions) : 0}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Study Session Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Study Session</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="topic">Topic/Subject</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Mathematics, Programming"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 60"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="productivity">Productivity (1-5)</Label>
                  <Select 
                    value={formData.productivity} 
                    onValueChange={(value) => setFormData({ ...formData, productivity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Moderate</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                {success && (
                  <div className="text-green-600 text-sm">{success}</div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Logging...' : 'Log Study Session'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Weekly Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>This Week&apos;s Study Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} hours`, 'Study Time']}
                      labelFormatter={(label) => {
                        const dayData = weeklyData.find(d => d.day === label)
                        return dayData ? dayData.date : label
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topic Distribution */}
        {topicData.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Study Time by Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topicData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="hours"
                        label={({ topic, hours }) => `${topic}: ${hours}h`}
                      >
                        {topicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} hours`, 'Study Time']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Topic Breakdown</h4>
                  {topicData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="font-medium">{item.topic}</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.hours}h ({item.minutes}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 