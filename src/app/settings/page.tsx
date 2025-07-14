'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Palette, 
  Keyboard, 
  Download, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Key
} from 'lucide-react'
import { updateUserProfile, changePassword, deleteUserAccount } from '@/lib/supabase'

interface UserProfile {
  name: string
  email: string
  student_id?: string
  program?: string
  year?: string
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { success, error, info } = useToast()
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    student_id: '',
    program: '',
    year: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Preferences
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [darkMode, setDarkMode] = useState('system')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        student_id: user.user_metadata?.student_id || '',
        program: user.user_metadata?.program || '',
        year: user.user_metadata?.year || ''
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error: updateError } = await updateUserProfile({
        name: profile.name,
        student_id: profile.student_id,
        program: profile.program,
        year: profile.year
      })
      
      if (updateError) throw updateError
      
      success('Profile Updated', 'Your profile has been saved successfully!')
      setIsEditing(false)
    } catch {
      error('Save Failed', 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      error('Password Mismatch', 'New passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      error('Password Too Short', 'Password must be at least 6 characters long.')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error: passwordError } = await changePassword(newPassword)
      
      if (passwordError) throw passwordError
      
      success('Password Changed', 'Your password has been updated successfully!')
      setShowPasswordDialog(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      error('Password Change Failed', 'Failed to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      error('Invalid Confirmation', 'Please type "DELETE" to confirm account deletion.')
      return
    }

    setIsDeleting(true)
    try {
      const { error: deleteError } = await deleteUserAccount()
      
      if (deleteError) throw deleteError
      
      success('Account Deleted', 'Your account has been permanently deleted.')
      router.push('/')
    } catch {
      error('Deletion Failed', 'Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteConfirmation('')
    }
  }

  const handleExportData = () => {
    // In a real app, this would generate and download user data
    const userData = {
      profile,
      exported_at: new Date().toISOString(),
      note: 'This is a demo export. In a real app, this would contain all your data.'
    }
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `apu-study-hub-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    info('Data Exported', 'Your data has been downloaded successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SettingsIcon className="h-8 w-8" />
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your account and app preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and student details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_id">Student ID</Label>
                  <Input
                    id="student_id"
                    value={profile.student_id}
                    onChange={(e) => setProfile(prev => ({ ...prev, student_id: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., TP12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Input
                    id="program"
                    value={profile.program}
                    onChange={(e) => setProfile(prev => ({ ...prev, program: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year of Study</Label>
                  <Input
                    id="year"
                    value={profile.year}
                    onChange={(e) => setProfile(prev => ({ ...prev, year: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Year 2"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false)
                        // Reset changes
                        if (user) {
                          setProfile({
                            name: user.user_metadata?.name || '',
                            email: user.email || '',
                            student_id: user.user_metadata?.student_id || '',
                            program: user.user_metadata?.program || '',
                            year: user.user_metadata?.year || ''
                          })
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                App Preferences
              </CardTitle>
              <CardDescription>
                Customize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Theme</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={darkMode === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDarkMode('light')}
                    >
                      <Sun className="h-4 w-4 mr-1" />
                      Light
                    </Button>
                    <Button
                      variant={darkMode === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDarkMode('dark')}
                    >
                      <Moon className="h-4 w-4 mr-1" />
                      Dark
                    </Button>
                    <Button
                      variant={darkMode === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDarkMode('system')}
                    >
                      <Monitor className="h-4 w-4 mr-1" />
                      System
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about deadlines and updates</p>
                  </div>
                  <Button
                    variant={notifications ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotifications(!notifications)}
                  >
                    {notifications ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Updates</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive weekly summaries via email</p>
                  </div>
                  <Button
                    variant={emailUpdates ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmailUpdates(!emailUpdates)}
                  >
                    {emailUpdates ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage your account security and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="font-medium">Change Password</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                        Update your account password
                      </p>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Change Password
                      </DialogTitle>
                      <DialogDescription>
                        Enter your new password. You&apos;ll need to sign in again after changing it.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          minLength={6}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          minLength={6}
                        />
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowPasswordDialog(false)
                            setCurrentPassword('')
                            setNewPassword('')
                            setConfirmPassword('')
                          }}
                          disabled={isChangingPassword}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleChangePassword}
                          disabled={!newPassword || !confirmPassword || isChangingPassword}
                        >
                          {isChangingPassword ? 'Changing...' : 'Change Password'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={handleExportData} className="h-auto p-4 flex flex-col items-start space-y-2">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Export Data</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                    Download all your data in JSON format
                  </p>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    <span className="font-medium">Keyboard Shortcuts</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                    Press <Badge variant="outline" className="font-mono text-xs">?</Badge> to view shortcuts
                  </p>
                </Button>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your account is secured with APU email authentication. All data is encrypted and stored securely.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Account
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <Alert className="border-red-200 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        All your tasks, notes, study materials, and AI conversations will be permanently deleted.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="delete-confirmation">
                        Type <strong>DELETE</strong> to confirm:
                      </Label>
                      <Input
                        id="delete-confirmation"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteDialog(false)
                          setDeleteConfirmation('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 