export default function Footer() {
  return (
    <footer className="py-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>🔐 This is an independent student-built tool.</div>
            <div>Not affiliated with APU.</div>
            <div>Use a different password than your official APU account.</div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <a href="/terms" className="hover:underline hover:text-gray-700 dark:hover:text-gray-300">
                Terms of Service
              </a>
              <span>•</span>
              <a href="/privacy" className="hover:underline hover:text-gray-700 dark:hover:text-gray-300">
                Privacy Policy
              </a>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>🎯 Designed for the academically fried</span>
              <span>•</span>
              <span>🔒 APU students only</span>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} APU Study Hub - Independent Student Project
          </div>
        </div>
      </div>
    </footer>
  )
} 