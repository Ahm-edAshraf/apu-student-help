export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🔒 Privacy Notice
              </h2>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                This privacy policy applies only to this independent student-built tool. 
                <strong> It is completely separate from Asia Pacific University&apos;s official privacy policies and data handling practices.</strong>
                APU is not responsible for how this tool handles your data.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Information We Collect
              </h2>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Account Information
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>APU email address (@mail.apu.edu.my)</li>
                <li>Name and display preferences</li>
                <li>Student ID, program, and year (optional)</li>
                <li>Password (encrypted and hashed)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                Academic Data
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Tasks and assignment information you create</li>
                <li>Study session logs and productivity data</li>
                <li>Class timetable entries</li>
                <li>Notes and reminders</li>
                <li>Files and study materials you upload</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                Usage Information
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>AI chat conversations and interactions</li>
                <li>Feature usage patterns and preferences</li>
                <li>Login times and session duration</li>
                <li>Error logs and technical diagnostics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                We use your information solely to provide and improve the Service:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>To create and maintain your account</li>
                <li>To provide productivity and study tracking features</li>
                <li>To enable AI-powered study assistance</li>
                <li>To store and organize your academic content</li>
                <li>To improve the tool&apos;s functionality and user experience</li>
                <li>To ensure security and prevent misuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Data Storage and Security
              </h2>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Storage Location
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Your data is stored using Supabase (a third-party database service) with servers located in secure data centers. 
                As a student project, we use standard cloud hosting services but cannot guarantee the same level of security as enterprise systems.
              </p>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                Security Measures
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Password encryption using industry-standard hashing</li>
                <li>Secure HTTPS connections for all data transmission</li>
                <li>APU email verification to restrict access</li>
                <li>Regular security updates and patches</li>
                <li>Limited access controls and user authentication</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                Data Backup and Recovery
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                As a student project with limited resources, we cannot guarantee comprehensive data backup or recovery services. 
                We recommend keeping local copies of important files and information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Data Sharing and Third Parties
              </h2>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                We Do NOT Share Your Data With:
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Asia Pacific University or its staff</li>
                <li>Other students or users (unless you explicitly share content)</li>
                <li>Marketing companies or advertisers</li>
                <li>Any commercial entities for profit</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                Limited Third-Party Services:
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li><strong>Supabase:</strong> Database hosting and authentication</li>
                <li><strong>OpenAI:</strong> AI chat features (anonymized interactions)</li>
                <li><strong>Hosting Provider:</strong> Website and application hosting</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                These services have their own privacy policies and are necessary for the tool&apos;s functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Your Rights and Controls
              </h2>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Account Management
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Update your profile information anytime</li>
                <li>Change your password independently</li>
                <li>Control what information you share</li>
                <li>Export your data in JSON format</li>
                <li>Delete your account permanently</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                Data Deletion
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                You can request complete data deletion through the account deletion feature in settings. 
                This will permanently remove all your data from our systems within 30 days. 
                This action cannot be undone.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. AI and Chat Features
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                When you use AI chat features:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Conversations are stored to maintain context and improve assistance</li>
                <li>AI responses are generated by OpenAI&apos;s services</li>
                <li>No personally identifiable information is sent to AI providers</li>
                <li>You can delete conversation history anytime</li>
                <li>Academic content shared with AI should not violate academic integrity policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. File Uploads and Content
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                When you upload files:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Files are stored securely in cloud storage</li>
                <li>Only you can access your uploaded files by default</li>
                <li>You choose what to share with other students</li>
                <li>We scan files for security threats but not content</li>
                <li>You remain responsible for copyright and intellectual property</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                8. Cookies and Tracking
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use minimal tracking:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>Essential cookies for login and session management</li>
                <li>Local storage for user preferences and settings</li>
                <li>No third-party advertising or analytics cookies</li>
                <li>No cross-site tracking or profiling</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                9. Age and Eligibility
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                This service is intended for university students (18+ years old) with valid APU email addresses. 
                We do not knowingly collect information from individuals under 18.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                10. Changes to Privacy Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this privacy policy as the tool evolves. 
                Material changes will be communicated through the application. 
                Continued use after changes indicates acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                11. Contact and Questions
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                For privacy-related questions or concerns about this student-built tool, 
                contact the developer through university channels. 
                For official APU privacy matters, contact APU directly through their official privacy office.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                12. Limitations and Disclaimers
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                As an independent student project:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                <li>We cannot guarantee enterprise-level data protection</li>
                <li>Privacy practices may evolve as we learn and improve</li>
                <li>Some features may require data sharing with essential third-party services</li>
                <li>Data handling is subject to limitations of available resources and expertise</li>
              </ul>
            </section>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-8">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                💡 Privacy Best Practices for Students
              </h3>
              <ul className="text-green-700 dark:text-green-300 text-sm space-y-1">
                <li>• Use a unique password different from your official APU account</li>
                <li>• Regularly review and update your profile information</li>
                <li>• Be mindful of what academic content you upload and share</li>
                <li>• Log out from shared or public computers</li>
                <li>• Report any privacy concerns immediately</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                <strong>Remember:</strong> This privacy policy is for an independent student project only. 
                Asia Pacific University has its own separate privacy policies for official services. 
                This tool and its data practices are not connected to or endorsed by APU.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 