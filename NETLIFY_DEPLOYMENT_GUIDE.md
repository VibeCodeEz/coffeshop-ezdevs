# Netlify Deployment Guide for EzDevs Coffee Shop

## 🚀 Quick Deployment Steps

### Method 1: GitHub + Netlify (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Netlify will auto-detect the settings from `netlify.toml`

3. **Set Environment Variables**:
   In Netlify dashboard → Site settings → Environment variables:
   ```
   VITE_SUPABASE_URL = https://luolyadipwdyvovcjgvv.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1b2x5YWRpcHdkeXZvdmNqZ3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODM3ODEsImV4cCI6MjA4MDA1OTc4MX0.FTz9KJm6KBc0ijbXwZU-PtJoWURkZ4HGeMMThOoP9qs
   VITE_DEV_MODE = false
   ```

### Method 2: Manual Upload

1. **Build the project**:
   ```bash
   npm install
   npm run build
   ```

2. **Upload to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder to the deploy area
   - Set environment variables as above

## 📁 Files to Include in Deployment

✅ **Include these**:
- `src/` (entire source folder)
- `public/` (if exists)
- `index.html`
- `package.json` & `package-lock.json`
- `vite.config.ts`
- `tsconfig.json` & `tsconfig.node.json`
- `netlify.toml` (deployment config)
- `.gitignore`

❌ **Don't include**:
- `node_modules/` (Netlify installs automatically)
- `dist/` (Netlify builds automatically)
- `.env.local` (use Netlify environment variables instead)
- `tmp_rovodev_*` files

## ⚙️ Build Settings (Auto-configured via netlify.toml)

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `18`

## 🔒 Environment Variables Setup

In Netlify Dashboard → Site settings → Environment variables, add:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_SUPABASE_URL` | `https://luolyadipwdyvovcjgvv.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Your Supabase anon key |
| `VITE_DEV_MODE` | `false` | Disable dev mode for production |

## 🌐 Domain Setup

After deployment:
1. Your site will get a random Netlify subdomain (e.g., `amazing-coffee-123.netlify.app`)
2. To use a custom domain:
   - Go to Site settings → Domain management
   - Add your custom domain
   - Follow DNS configuration instructions

## 🔧 Troubleshooting

### Build Fails
- Check if all dependencies are in `package.json`
- Ensure Node version is 18+
- Check build logs for specific errors

### Environment Variables Not Working
- Ensure they start with `VITE_` prefix
- Check spelling and values in Netlify dashboard
- Redeploy after adding variables

### Routing Issues
- The `netlify.toml` file handles React Router redirects
- All routes will redirect to `index.html`

### Performance Issues
- The optimized Vite config splits code into chunks
- Static assets are cached for 1 year
- Gzip compression is automatic

## 🎉 Post-Deployment Checklist

- [ ] Test all pages and routes
- [ ] Verify Supabase connection works
- [ ] Check responsive design on mobile
- [ ] Test shopping cart functionality
- [ ] Verify admin dashboard access
- [ ] Check SSL certificate is active
- [ ] Set up monitoring/analytics if needed

## 🔄 Continuous Deployment

With GitHub integration:
- Every push to `main` branch triggers automatic deployment
- Pull request previews are available
- Branch deploys for testing

Your coffee shop is now ready to serve customers worldwide! ☕