# What to Download for Deployment

## Required Files for Your WebRTC Remote Desktop

When you download this project as a ZIP, you need these folders and files:

### Essential Files:
- ✅ `package.json` - Dependencies and build scripts
- ✅ `package-lock.json` - Exact dependency versions
- ✅ `client/` folder - React frontend (all files inside)
- ✅ `server/` folder - Node.js backend (all files inside) 
- ✅ `shared/` folder - Common types (all files inside)
- ✅ `netlify.toml` - Deployment configuration
- ✅ `backend-only/` folder - For split deployment option
- ✅ `DEPLOYMENT_STEPS.md` - Your deployment guide

### Optional Files:
- ✅ `README.md` - Project information
- ✅ `replit.md` - Project documentation
- ✅ Other config files (`tsconfig.json`, `vite.config.ts`, etc.)

### Files to Ignore:
- ❌ `node_modules/` - Will be recreated during deployment
- ❌ Any `.md` files except the ones mentioned above

## Quick Deploy Summary:
1. **Download ZIP** from Replit (••• menu → Download as ZIP)
2. **Extract ZIP** to your computer  
3. **Create GitHub repo** called `webrtc-remote-desktop`
4. **Upload all files** to GitHub repo
5. **Deploy to Netlify**: netlify.com → New site from Git
   - Build command: `npm run build`
   - Publish directory: `dist/public`
6. **Get your URL** and share it!

Users visit your URL and get instant screen sharing - no downloads, no setup needed!