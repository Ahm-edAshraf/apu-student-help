'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Keyboard, Search, Home, BookOpen, MessageSquare, Calendar, BarChart3, HelpCircle } from 'lucide-react'

interface Shortcut {
  key: string
  description: string
  action: () => void
  icon?: React.ComponentType<{ className?: string }>
  requireAuth?: boolean
}

export default function KeyboardShortcuts() {
  const router = useRouter()
  const { user } = useAuth()
  const { info } = useToast()
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts: Shortcut[] = [
    {
      key: 'g h',
      description: 'Go to Dashboard',
      action: () => router.push('/dashboard'),
      icon: Home,
      requireAuth: true
    },
    {
      key: 'g t',
      description: 'Go to Tasks',
      action: () => router.push('/tasks'),
      icon: Calendar,
      requireAuth: true
    },
    {
      key: 'g v',
      description: 'Go to Vault',
      action: () => router.push('/vault'),
      icon: BookOpen,
      requireAuth: true
    },
    {
      key: 'g a',
      description: 'Go to AI Assistant',
      action: () => router.push('/braincell'),
      icon: MessageSquare,
      requireAuth: true
    },
    {
      key: 'g s',
      description: 'Go to Study Tracker',
      action: () => router.push('/study-tracker'),
      icon: BarChart3,
      requireAuth: true
    },
    {
      key: 'g c',
      description: 'Go to Timetable',
      action: () => router.push('/timetable'),
      icon: Calendar,
      requireAuth: true
    },
    {
      key: '/',
      description: 'Search (focus search)',
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        } else {
          info('Search', 'Navigate to a page with search functionality')
        }
      },
      icon: Search
    },
    {
      key: 'Escape',
      description: 'Close dialogs/modals',
      action: () => {
        // Trigger escape key event
        const event = new KeyboardEvent('keydown', { key: 'Escape' })
        document.dispatchEvent(event)
      }
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowHelp(true),
      icon: HelpCircle
    },
    {
      key: 'Ctrl+K',
      description: 'Command palette (future)',
      action: () => info('Coming Soon', 'Command palette will be available in a future update!'),
      icon: Search
    }
  ]

  useEffect(() => {
    let keySequence = ''
    let sequenceTimeout: NodeJS.Timeout

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        // Exception: allow '/' and '?' to work in any context
        if (event.key !== '/' && event.key !== '?' && event.key !== 'Escape') {
          return
        }
      }

      // Handle single key shortcuts
      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        const shortcut = shortcuts.find(s => s.key === '/')
        if (shortcut) shortcut.action()
        return
      }

      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        const shortcut = shortcuts.find(s => s.key === '?')
        if (shortcut) shortcut.action()
        return
      }

      if (event.key === 'Escape') {
        setShowHelp(false)
        const shortcut = shortcuts.find(s => s.key === 'Escape')
        if (shortcut) shortcut.action()
        return
      }

      // Handle Ctrl+K
      if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        const shortcut = shortcuts.find(s => s.key === 'Ctrl+K')
        if (shortcut) shortcut.action()
        return
      }

      // Handle key sequences (like 'g h')
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        keySequence += event.key.toLowerCase()
        
        // Clear sequence timeout
        if (sequenceTimeout) {
          clearTimeout(sequenceTimeout)
        }
        
        // Check for matching shortcuts
        const matchingShortcut = shortcuts.find(shortcut => {
          const normalizedKey = shortcut.key.toLowerCase().replace(/\s/g, '')
          return normalizedKey === keySequence
        })
        
        if (matchingShortcut) {
          event.preventDefault()
          
          // Check if user is authenticated for auth-required shortcuts
          if (matchingShortcut.requireAuth && !user) {
            info('Authentication Required', 'Please sign in to use this shortcut')
            keySequence = ''
            return
          }
          
          matchingShortcut.action()
          keySequence = ''
        } else {
          // Reset sequence after 1 second if no match
          sequenceTimeout = setTimeout(() => {
            keySequence = ''
          }, 1000)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (sequenceTimeout) {
        clearTimeout(sequenceTimeout)
      }
    }
  }, [router, user, info, shortcuts])

  const formatKey = (key: string) => {
    return key.split(' ').map(k => (
      <Badge key={k} variant="outline" className="font-mono text-xs px-1.5 py-0.5">
        {k === 'Ctrl+K' ? (
          <>
            <span className="text-xs">Ctrl</span>+<span className="text-xs">K</span>
          </>
        ) : (
          k
        )}
      </Badge>
    ))
  }

  return (
    <>
      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Navigate faster with these keyboard shortcuts:
            </div>
            
            <div className="grid gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Navigation</h3>
                <div className="space-y-2">
                  {shortcuts.filter(s => s.key.startsWith('g')).map((shortcut) => {
                    const IconComponent = shortcut.icon
                    return (
                      <div key={shortcut.key} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          {IconComponent && <IconComponent className="h-4 w-4 text-gray-500" />}
                          <span className="text-sm">{shortcut.description}</span>
                          {shortcut.requireAuth && (
                            <Badge variant="secondary" className="text-xs">Auth required</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {formatKey(shortcut.key)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Actions</h3>
                <div className="space-y-2">
                  {shortcuts.filter(s => !s.key.startsWith('g')).map((shortcut) => {
                    const IconComponent = shortcut.icon
                    return (
                      <div key={shortcut.key} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-3">
                          {IconComponent && <IconComponent className="h-4 w-4 text-gray-500" />}
                          <span className="text-sm">{shortcut.description}</span>
                        </div>
                        <div className="flex gap-1">
                          {formatKey(shortcut.key)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Pro Tips:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                  <li>Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">g</code> followed by a letter for quick navigation</li>
                  <li>Press <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">?</code> anytime to see this help</li>
                  <li>Shortcuts work globally across the app</li>
                  <li>Some shortcuts require authentication</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowHelp(false)}>
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 