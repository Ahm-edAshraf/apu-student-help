# APU Student Helper - Vercel Deployment Guide

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **Supabase Project**: Set up and configured with all required tables
2. **Google AI API Key**: From Google AI Studio 
3. **Vercel Account**: Free or Pro account on Vercel
4. **Git Repository**: Code pushed to GitHub/GitLab/Bitbucket

## Environment Variables

The following environment variables must be configured in Vercel:

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

### How to Get These Values

1. **Supabase Variables**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the Project URL and anon public key

2. **Google AI API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the generated key

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Environment Variables**:
   - In the project settings, go to "Environment Variables"
   - Add all required variables from above
   - Make sure to set them for Production, Preview, and Development

3. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add GOOGLE_GENERATIVE_AI_API_KEY
   vercel env add NEXT_PUBLIC_APP_URL
   ```

## Post-Deployment Configuration

### 1. Update Supabase Settings

1. **Add Domain to Allowed Origins**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel domain to "Site URL" and "Redirect URLs"

2. **Configure RLS Policies**:
   - Ensure all Row Level Security policies are properly configured
   - Test authentication flows with the live domain

### 2. Test Critical Features

1. **Authentication**: Sign up, login, logout
2. **File Upload**: Test file uploads to Supabase Storage
3. **Chat Functionality**: Verify AI chat is working
4. **PWA Features**: Test offline functionality and app installation

### 3. Performance Optimization

1. **Enable Analytics**:
   - Go to Vercel project settings
   - Enable Vercel Analytics and Speed Insights

2. **Configure Caching**:
   - The `vercel.json` file includes optimized caching headers
   - Monitor performance in Vercel dashboard

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to Git
2. **API Keys**: Rotate keys regularly and use least-privilege access
3. **Domain Verification**: Ensure Supabase is configured for your exact domain
4. **Content Security Policy**: The app includes strict CSP headers for production

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check environment variables are set correctly
   - Verify all dependencies are in package.json

2. **Authentication Issues**:
   - Verify Supabase URL configuration
   - Check CORS settings in Supabase

3. **API Errors**:
   - Confirm Google AI API key is valid and has proper permissions
   - Check function timeout limits (30s max on Vercel)

### Debug Commands

```bash
# Local testing with production build
npm run build && npm start

# Check environment variables
vercel env ls

# View deployment logs
vercel logs
```

## Custom Domain (Optional)

1. **Add Domain in Vercel**:
   - Go to project settings → Domains
   - Add your custom domain

2. **Configure DNS**:
   - Add CNAME record pointing to `cname.vercel-dns.com`

3. **Update Environment Variables**:
   - Update `NEXT_PUBLIC_APP_URL` to your custom domain

## Monitoring and Maintenance

1. **Set up Alerts**: Configure Vercel alerts for downtime
2. **Monitor Performance**: Use Vercel Analytics and Speed Insights
3. **Regular Updates**: Keep dependencies updated
4. **Backup Strategy**: Ensure Supabase data is backed up

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Monitor the deployment logs in Vercel dashboard 