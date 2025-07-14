# 🎓 APU Student Helper

An intelligent study companion designed specifically for APU (Asia Pacific University) students. This comprehensive web application helps students manage their academic life with AI-powered features, task management, file organization, and study tracking.

## ✨ Features

### 🧠 AI-Powered Study Assistant
- **Braincell Chat**: Intelligent academic assistant powered by Google's Gemini AI
- Context-aware responses tailored for university students
- Academic integrity guidelines built-in
- Chat history and conversation management

### 📋 Task & Study Management
- **Smart Task Tracker**: Create, manage, and prioritize academic tasks
- **Study Time Tracker**: Monitor study sessions with detailed analytics
- **Interactive Timetable**: Visual schedule management
- **Deadline Management**: Never miss an assignment again

### 📁 Document Vault
- **File Upload & Management**: Secure file storage and organization
- **Smart File Processing**: Extract text from PDFs, images, and documents
- **ZIP File Support**: Upload and extract archive files
- **Bookmark System**: Save and organize important links

### 🔐 Security & Privacy
- **Secure Authentication**: Powered by Supabase Auth
- **Rate Limiting**: Protection against abuse
- **Content Security Policy**: Strict security headers
- **Data Encryption**: All data securely stored and transmitted

### 📱 Modern Web Features
- **Progressive Web App (PWA)**: Install on any device
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Offline Support**: Core features work without internet
- **Keyboard Shortcuts**: Quick navigation for power users
- **Dark Mode**: Easy on the eyes for late-night study sessions

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- Supabase project
- Google AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/apu-student-helper.git
   cd apu-student-helper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini API
- **File Storage**: Supabase Storage
- **PWA**: Custom Service Worker

### Project Structure
```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   ├── dashboard/      # Main dashboard
│   ├── braincell/      # AI chat interface
│   ├── tasks/          # Task management
│   ├── vault/          # File management
│   └── ...
├── components/         # Reusable UI components
│   ├── ui/            # Base UI components
│   └── ...
└── lib/               # Utilities and configurations
    ├── supabase.ts    # Database client
    ├── security.ts    # Security utilities
    └── ...
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to Git repository** (GitHub, GitLab, or Bitbucket)

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**
   Add the following in Vercel project settings:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

4. **Deploy**
   Vercel will automatically build and deploy your application.

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the database migrations
3. Configure Row Level Security (RLS) policies
4. Set up Supabase Storage for file uploads
5. Configure authentication providers

### Google AI Setup
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add the key to your environment variables

## 🛡️ Security Features

- **Rate Limiting**: Prevents API abuse with sliding window algorithm
- **Input Validation**: Comprehensive sanitization and validation
- **Content Security Policy**: Strict CSP headers for XSS protection
- **Authentication**: Secure JWT-based authentication
- **File Upload Security**: Virus scanning and type validation
- **HTTPS Enforcement**: Strict transport security headers

## 🔒 Privacy & Legal

### Important Disclaimers
- 🔐 **Independent Project**: This is a student-built tool, not affiliated with APU
- 🔐 **Password Security**: Use a different password than your official APU account
- 🔐 **Academic Integrity**: Tool promotes learning, not cheating
- 🔐 **Data Privacy**: Your data is encrypted and securely stored

For complete terms and privacy policy, visit:
- [Terms of Service](/terms)
- [Privacy Policy](/privacy)

## 🤝 Contributing

We welcome contributions from the APU community! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- **Issues**: Report bugs or feature requests on GitHub Issues
- **Documentation**: Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- **Community**: Connect with other APU developers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- APU student community for feedback and testing
- Open source libraries and their maintainers
- Supabase and Vercel for excellent developer platforms

---

**Built with ❤️ by APU students, for APU students**

*Remember: This tool is designed to enhance your learning experience. Always maintain academic integrity and use it responsibly.* 