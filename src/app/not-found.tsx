'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, BookOpen, MessageSquare, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'

const studentRoasts = [
  "Looks like you're as lost as you were during that calculus exam! 📊",
  "404: Page not found, just like your motivation on a Monday morning ☕",
  "This page is missing, unlike your assignment deadlines (which are always there) 📚",
  "Error 404: Content not found. Try checking your notes... oh wait, you didn&apos;t take any 📝",
  "You've reached a dead end, much like your GPA after finals week 🎓",
  "Page not found - it probably went to get coffee and never came back ☕",
  "This URL is more broken than your sleep schedule during exam season 😴",
  "404: The page you're looking for is in another castle... or library 🏰",
  "Oops! This page is as elusive as a parking spot on campus 🚗",
  "Page not found - it's probably cramming for finals somewhere 📖"
]

const helpfulTips = [
  "Double-check that URL like you should double-check your exam answers",
  "The page might be taking a mental health break (good for it!)",
  "Maybe try using the search function - it's more reliable than your group project partners",
  "This page could be in the library... have you checked there recently?",
  "The content you're looking for might be hiding like you during attendance",
  "Perhaps this page graduated and moved on to better things"
]

export default function NotFound() {
  const router = useRouter()
  const [currentRoast, setCurrentRoast] = useState('')
  const [currentTip, setCurrentTip] = useState('')

  useEffect(() => {
    // Randomly select a roast and tip
    setCurrentRoast(studentRoasts[Math.floor(Math.random() * studentRoasts.length)])
    setCurrentTip(helpfulTips[Math.floor(Math.random() * helpfulTips.length)])
  }, [])

  const quickActions = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      description: 'Back to your academic command center'
    },
    {
      icon: BookOpen,
      label: 'Study Vault',
      path: '/vault',
      description: 'Browse your study materials'
    },
    {
      icon: MessageSquare,
      label: 'AI Assistant',
      path: '/braincell',
      description: 'Get help from Braincell AI'
    },
    {
      icon: Calendar,
      label: 'Tasks',
      path: '/tasks',
      description: 'Check your assignments'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Animated 404 */}
        <div className="relative">
          <div className="text-8xl md:text-9xl font-bold text-gray-200 dark:text-gray-700 select-none animate-pulse">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl animate-bounce">😵‍💫</span>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border space-y-4">
            <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
              {currentRoast}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              💡 Pro tip: {currentTip}
            </p>
          </div>

          {/* Academic humor */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Fun Fact:</strong> You&apos;re more likely to find this page than to find a study group that actually studies! 📚✨
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Where would you like to go instead?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.path}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/20 dark:hover:border-blue-700 transition-colors"
                  onClick={() => router.push(action.path)}
                >
                  <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div className="text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {action.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {action.description}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Go back button */}
        <div className="pt-4">
          <Button
            variant="default"
            onClick={() => router.back()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
                         Take Me Back (I Promise I&apos;ll Pay Attention This Time)
          </Button>
        </div>

        {/* Footer message */}
        <div className="pt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Lost? Confused? Welcome to university life! 🎓<br />
            <span className="italic">At least this 404 page is more organized than your dorm room.</span>
          </p>
        </div>
      </div>
    </div>
  )
} 