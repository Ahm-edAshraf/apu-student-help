'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { signUp, signIn, isValidAPUEmail, resetPassword } from '@/lib/supabase'
import { AlertTriangle, Shield } from 'lucide-react'

export default function AuthForm() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Client-side APU email validation
      if (!isValidAPUEmail(email)) {
        throw new Error('Only APU students with @mail.apu.edu.my emails can sign up.')
      }

      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Name is required')
        }
        const { error } = await signUp(email, password, name)
        if (error) throw error
        setSuccess('Check your email for verification link!')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        setSuccess('Signed in successfully!')
        // Small delay to ensure auth state updates, then redirect
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsResetting(true)

    try {
      if (!isValidAPUEmail(resetEmail)) {
        throw new Error('Please enter a valid APU email address.')
      }

      const { error } = await resetPassword(resetEmail)
      if (error) throw error
      
      setSuccess('Password reset email sent! Check your inbox.')
      setShowForgotPassword(false)
      setResetEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            APU STUDY HUB
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            One Website to Rule Your GPA
          </p>
        </div>

        {/* Security Warning */}
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>⚠️ Do NOT use your APUspace or Microsoft password.</strong> This site is not affiliated with APU. Use a unique password.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Join APU Study Hub with your APU email' 
                : 'Access your study dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">APU Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@mail.apu.edu.my"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {email && !isValidAPUEmail(email) && (
                  <p className="text-sm text-red-600">
                    Must be an @mail.apu.edu.my email address
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Use a unique password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || (email.length > 0 && !isValidAPUEmail(email))}
              >
                {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setSuccess('')
                }}
                className="block w-full text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
              
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setResetEmail(email)
                    setError('')
                    setSuccess('')
                  }}
                  className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400"
                >
                  Forgot your password?
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <div>🔒 Only accessible to students with @mail.apu.edu.my emails</div>
          <div className="border-t pt-2 space-y-1">
            <div>🔐 This is an independent student-built tool.</div>
            <div>Not affiliated with APU.</div>
            <div>Use a different password than your official APU account.</div>
          </div>
          <div className="text-[10px] space-x-2">
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <span>•</span>
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
          </div>
        </div>

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your APU email address and we&apos;ll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">APU Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="your.name@mail.apu.edu.my"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                {resetEmail && !isValidAPUEmail(resetEmail) && (
                  <p className="text-sm text-red-600">
                    Must be an @mail.apu.edu.my email address
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetEmail('')
                    setError('')
                    setSuccess('')
                  }}
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!resetEmail || !isValidAPUEmail(resetEmail) || isResetting}
                >
                  {isResetting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 