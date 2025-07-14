'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const { info } = useToast()

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  info('App Update Available', 'Please refresh to get the latest features!')
                }
              })
            }
          })
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running as PWA
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        return
      }
      
      // Check if installed on iOS
      if ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) {
        setIsInstalled(true)
        return
      }
      
      // Check if user has dismissed install prompt recently
      const dismissedTime = localStorage.getItem('pwa-install-dismissed')
      if (dismissedTime) {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000 // 24 hours
        if (parseInt(dismissedTime) > oneDayAgo) {
          return // Don't show for 24 hours after dismissal
        }
      }
    }

    checkIfInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      if (!isInstalled) {
        // Show install prompt after a delay
        setTimeout(() => {
          setShowInstallPrompt(true)
        }, 2000)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed')
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      info('App Installed!', 'APU Study Hub is now available on your home screen!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [info, isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`PWA: User response to install prompt: ${outcome}`)
      
      if (outcome === 'dismissed') {
        // Store dismissal time
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('PWA: Error during installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Install APU Study Hub
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Add to your home screen for quick access and offline features!
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="text-xs px-3 py-1.5 h-auto"
              >
                Install
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="text-xs px-3 py-1.5 h-auto"
              >
                Later
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 