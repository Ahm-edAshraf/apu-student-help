import { createClient } from './supabase-client'

// Create client instance for browser use
export const supabase = createClient()



// Database types
export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  due_date: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  user_id: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  content: string
  pinned: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export interface TimetableEntry {
  id: string
  title: string
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  start_time: string // Format: HH:MM (24-hour)
  end_time: string   // Format: HH:MM (24-hour)
  user_id: string
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  title: string
  tags: string[]
  url: string
  file_name: string
  file_size: number
  file_type: string
  uploaded_at: string
  uploader_id: string
}

export interface Bookmark {
  id: string
  user_id: string
  resource_id: string
  created_at: string
}

export interface StudyLog {
  id: string
  topic: string
  duration: number // in minutes
  productivity: 1 | 2 | 3 | 4 | 5 // 1-5 rating
  timestamp: string
  user_id: string
}

export interface Conversation {
  id: string
  title: string
  user_id: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface Message {
  id: string
  conversation_id: string
  content: string
  role: 'user' | 'assistant'
  message_type: 'text' | 'file'
  metadata: Record<string, unknown>
  created_at: string
}

// APU email validation
export const isValidAPUEmail = (email: string): boolean => {
  return email.endsWith('@mail.apu.edu.my')
}

// Auth helper functions
export const signUp = async (email: string, password: string, name: string) => {
  if (!isValidAPUEmail(email)) {
    throw new Error('Only APU students with @mail.apu.edu.my emails can sign up.')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      }
    }
  })

  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// User profile management
export const updateUserProfile = async (updates: {
  name?: string
  student_id?: string
  program?: string
  year?: string
}) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  })
  return { data, error }
}

export const changePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { data, error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  return { data, error }
}

export const deleteUserAccount = async () => {
  // First get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('No user found') }

  // Delete user data from custom tables (in order of dependencies)
  const deletePromises = [
    supabase.from('bookmarks').delete().eq('user_id', user.id),
    supabase.from('messages').delete().eq('user_id', user.id),
    supabase.from('conversations').delete().eq('user_id', user.id),
    supabase.from('study_logs').delete().eq('user_id', user.id),
    supabase.from('notes').delete().eq('user_id', user.id),
    supabase.from('tasks').delete().eq('user_id', user.id),
    supabase.from('timetable_entries').delete().eq('user_id', user.id),
    supabase.from('resources').delete().eq('uploader_id', user.id)
  ]

  try {
    // Delete all user data
    await Promise.all(deletePromises)
    
    // Delete auth user (this must be done server-side in production)
    // For now, we'll sign out the user
    await supabase.auth.signOut()
    
    return { data: true, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Task helper functions
export const createTask = async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  // Add user_id to the task data
  const taskWithUserId = {
    ...task,
    user_id: user.id
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([taskWithUserId])
    .select()
    .single()

  return { data, error }
}

export const getTasks = async () => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  return { data, error }
}

export const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only update their own tasks
    .select()
    .single()

  return { data, error }
}

export const deleteTask = async (id: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: { message: 'User not authenticated' } }
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only delete their own tasks

  return { error }
}

// Note helper functions
export const createNote = async (note: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  // Add user_id to the note data
  const noteWithUserId = {
    ...note,
    user_id: user.id
  }

  const { data, error } = await supabase
    .from('notes')
    .insert([noteWithUserId])
    .select()
    .single()

  return { data, error }
}

export const getNotes = async () => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  return { data, error }
}

export const updateNote = async (id: string, updates: Partial<Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only update their own notes
    .select()
    .single()

  return { data, error }
}

export const deleteNote = async (id: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: { message: 'User not authenticated' } }
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only delete their own notes

  return { error }
}

// Timetable helper functions
export const createTimetableEntry = async (entry: Omit<TimetableEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  // Add user_id to the entry data
  const entryWithUserId = {
    ...entry,
    user_id: user.id
  }

  const { data, error } = await supabase
    .from('timetable')
    .insert([entryWithUserId])
    .select()
    .single()

  return { data, error }
}

export const getTimetableEntries = async () => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('timetable')
    .select('*')
    .eq('user_id', user.id)
    .order('day')
    .order('start_time')

  return { data, error }
}

export const updateTimetableEntry = async (id: string, updates: Partial<Omit<TimetableEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('timetable')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only update their own entries
    .select()
    .single()

  return { data, error }
}

export const deleteTimetableEntry = async (id: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: { message: 'User not authenticated' } }
  }

  const { error } = await supabase
    .from('timetable')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only delete their own entries

  return { error }
}

// Resource helper functions
export const createResource = async (resource: Omit<Resource, 'id' | 'uploader_id' | 'uploaded_at'>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  // Add uploader_id to the resource data
  const resourceWithUploader = {
    ...resource,
    uploader_id: user.id
  }

  const { data, error } = await supabase
    .from('resources')
    .insert([resourceWithUploader])
    .select()
    .single()

  return { data, error }
}

export const getResources = async (searchQuery?: string, tagFilter?: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  let query = supabase
    .from('resources')
    .select('*')
    .order('uploaded_at', { ascending: false })

  // Apply search filter
  if (searchQuery) {
    query = query.ilike('title', `%${searchQuery}%`)
  }

  // Apply tag filter
  if (tagFilter) {
    query = query.contains('tags', [tagFilter])
  }

  const { data, error } = await query

  return { data, error }
}

export const deleteResource = async (id: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: { message: 'User not authenticated' } }
  }

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)
    .eq('uploader_id', user.id) // Ensure user can only delete their own resources

  return { error }
}

// Bookmark helper functions
export const addBookmark = async (resourceId: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .insert([{ user_id: user.id, resource_id: resourceId }])
    .select()
    .single()

  return { data, error }
}

export const removeBookmark = async (resourceId: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: { message: 'User not authenticated' } }
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('resource_id', resourceId)

  return { error }
}

export const getUserBookmarks = async () => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      resources (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const isResourceBookmarked = async (resourceId: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: false, error: null }
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('resource_id', resourceId)
    .single()

  return { data: !!data, error: error?.code === 'PGRST116' ? null : error }
} 

// Study Log helper functions
export const createStudyLog = async (studyLog: Omit<StudyLog, 'id' | 'user_id' | 'timestamp'>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  // Add user_id to the study log data
  const studyLogWithUserId = {
    ...studyLog,
    user_id: user.id
  }

  const { data, error } = await supabase
    .from('study_log')
    .insert([studyLogWithUserId])
    .select()
    .single()

  return { data, error }
}

export const getStudyLogs = async (startDate?: string, endDate?: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  let query = supabase
    .from('study_log')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })

  // Apply date filters if provided
  if (startDate) {
    query = query.gte('timestamp', startDate)
  }
  if (endDate) {
    query = query.lte('timestamp', endDate)
  }

  const { data, error } = await query

  return { data, error }
}

export const updateStudyLog = async (id: string, updates: Partial<Omit<StudyLog, 'id' | 'user_id' | 'timestamp'>>) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('study_log')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only update their own logs
    .select()
    .single()

  return { data, error }
}

export const deleteStudyLog = async (id: string) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: { message: 'User not authenticated' } }
  }

  const { error } = await supabase
    .from('study_log')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only delete their own logs

  return { error }
}

export const getStudyStats = async () => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  // Get all study logs for the user
  const { data: logs, error } = await supabase
    .from('study_log')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: true })

  if (error) return { data: null, error }

  // Calculate stats
  const totalMinutes = logs?.reduce((sum, log) => sum + (log as unknown as StudyLog).duration, 0) || 0
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10 // Round to 1 decimal place
  
  // Calculate streak (consecutive days with study sessions)
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (logs && logs.length > 0) {
    const sortedLogs = (logs as unknown as StudyLog[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // Group logs by date
    const logsByDate = new Map<string, boolean>()
    sortedLogs.forEach(log => {
      const date = new Date(log.timestamp)
      date.setHours(0, 0, 0, 0)
      const dateKey = date.toISOString().split('T')[0]
      logsByDate.set(dateKey, true)
    })
    
    // Calculate streak starting from today
    const currentDate = new Date(today)
    while (true) {
      const dateKey = currentDate.toISOString().split('T')[0]
      if (logsByDate.has(dateKey)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        // If it's today and no study session, that's okay for streak calculation
        if (currentDate.getTime() === today.getTime()) {
          currentDate.setDate(currentDate.getDate() - 1)
          continue
        }
        break
      }
    }
  }

  return {
    data: {
      totalHours,
      totalSessions: logs?.length || 0,
      streak,
      logs: logs || []
    },
    error: null
  }
}

// Chat/Conversation helper functions
export const createConversation = async (title: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      title,
      user_id: user.id,
      is_active: true
    }])
    .select()
    .single()

  return { data, error }
}

export const getConversations = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  return { data, error }
}

export const getConversation = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return { data, error }
}

export const updateConversation = async (id: string, updates: Partial<Pick<Conversation, 'title'>>) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  return { data, error }
}

export const deleteConversation = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('conversations')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  return { data, error }
}

 