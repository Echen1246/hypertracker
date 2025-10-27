# Deployment Guide

## Prerequisites

- GitHub account (for code repository)
- Render account (for backend hosting)
- Vercel account (for frontend hosting)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Push your code to GitHub:

```bash
cd /Users/eddie/hypertracker
git init
git add .
git commit -m "Initial commit - AI Agent Wallet Tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hypertracker.git
git push -u origin main
```

---

## Backend Deployment on Render

### Step 1: Create Web Service

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

### Step 2: Configure Service

**Basic Settings**:
- **Name**: `hypertracker-backend` (or your choice)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`

**Build & Deploy**:
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Instance Type**:
- **Plan**: `Free` (or upgrade as needed)

### Step 3: Environment Variables

Render automatically provides `PORT` - no manual environment variables needed!

### Step 4: Deploy

Click **"Create Web Service"**

Render will:
1. Clone your repository
2. Install dependencies
3. Start the server
4. Provide a URL like: `https://hypertracker-backend.onrender.com`

**Save this URL** - you'll need it for the frontend!

### Step 5: Verify Backend

Visit `https://your-backend-url.onrender.com/health` to verify it's running.

Expected response:
```json
{
  "status": "ok",
  "connected": true,
  "timestamp": "2025-10-26T..."
}
```

---

## Frontend Deployment on Vercel

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository

### Step 2: Configure Project

**Project Settings**:
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)

### Step 3: Environment Variables

Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_BACKEND_URL` | `https://your-render-backend-url.onrender.com` |

**Important**: Use your actual Render backend URL from Step 4 above!

### Step 4: Deploy

Click **"Deploy"**

Vercel will:
1. Clone your repository
2. Install dependencies
3. Build the React app
4. Deploy to CDN
5. Provide a URL like: `https://hypertracker.vercel.app`

---

## Post-Deployment Configuration

### Update Backend CORS

Once you have your Vercel URL, update backend CORS settings:

1. Open `backend/server.js`
2. Update CORS configuration:

```javascript
// Replace this:
app.use(cors({
  origin: '*', // In production, replace with your Vercel domain
  methods: ['GET', 'POST']
}));

// With this:
app.use(cors({
  origin: 'https://your-vercel-app.vercel.app',
  methods: ['GET', 'POST']
}));

// Also update Socket.io CORS:
const io = new Server(server, {
  cors: {
    origin: 'https://your-vercel-app.vercel.app',
    methods: ['GET', 'POST']
  }
});
```

3. Commit and push changes:

```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push
```

Render will automatically redeploy with the new settings.

---

## Verification Checklist

### Backend Health Check
- [ ] Visit `https://your-backend.onrender.com/health`
- [ ] Verify `"status": "ok"` response
- [ ] Check logs for "Connected to Hyperliquid WebSocket"
- [ ] Confirm all 6 wallet subscriptions logged

### Frontend Check
- [ ] Open `https://your-frontend.vercel.app`
- [ ] Verify connection status dot is green
- [ ] See 6 wallet cards displayed
- [ ] Wait for position updates (may take a few minutes)
- [ ] Check browser console for Socket.io connection

### Real-Time Updates
- [ ] Watch for position updates in backend logs
- [ ] Verify frontend cards update automatically
- [ ] Confirm audio beep plays (click page first)
- [ ] Check visual flash animation on updates

---

## Render Free Tier Notes

### Important Limitations

1. **Sleep After Inactivity**
   - Free tier services sleep after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds to wake up
   - WebSocket will reconnect automatically

2. **Solution for Always-On**:
   - Upgrade to paid tier ($7/month)
   - Or use external uptime monitor (like UptimeRobot) to ping `/health` every 10 minutes

3. **WebSocket Support**:
   - Render Free tier DOES support WebSockets
   - No special configuration needed

---

## Vercel Notes

### Environment Variables

Remember to use `VITE_` prefix for Vite environment variables:
- ✅ `VITE_BACKEND_URL`
- ❌ `REACT_APP_BACKEND_URL` (Create React App only)

### Automatic Deployments

Vercel auto-deploys on:
- Push to `main` branch (production)
- Pull requests (preview deployments)

### Custom Domain

To use a custom domain:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update backend CORS with new domain

---

## Environment-Specific URLs

### Local Development
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

### Production
- Backend: `https://your-app.onrender.com`
- Frontend: `https://your-app.vercel.app`

---

## Monitoring & Logs

### Render Logs

View real-time logs:
1. Go to your service dashboard on Render
2. Click "Logs" tab
3. Watch for:
   - WebSocket connection status
   - Position updates
   - Reconnection attempts

### Vercel Logs

View function logs:
1. Go to your project on Vercel
2. Click "Deployments"
3. Select latest deployment
4. View build and runtime logs

### Browser Console

Check frontend logs:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Watch for:
   - Socket.io connection status
   - Position update messages
   - Any errors

---

## Updating After Deployment

### Backend Updates

```bash
# Make changes to backend/server.js
git add backend/
git commit -m "Update backend logic"
git push
# Render auto-deploys in ~2 minutes
```

### Frontend Updates

```bash
# Make changes to frontend/src/
git add frontend/
git commit -m "Update UI"
git push
# Vercel auto-deploys in ~1 minute
```

### Environment Variable Changes

**Render**:
1. Dashboard → Environment
2. Update variables
3. Click "Save" → service restarts automatically

**Vercel**:
1. Project Settings → Environment Variables
2. Update variables
3. Trigger new deployment (or push to GitHub)

---

## Troubleshooting

### Backend not receiving WebSocket data

**Check**:
1. Render logs for "Connected to Hyperliquid WebSocket"
2. Verify wallet addresses are correct
3. Test Hyperliquid API accessibility: `wscat -c wss://api.hyperliquid.xyz/ws`

**Solution**:
- Wait 1-2 minutes after deployment
- Check Render status page for outages
- Verify WebSocket connection in logs

### Frontend shows "Reconnecting..."

**Check**:
1. Backend is running (visit `/health` endpoint)
2. `VITE_BACKEND_URL` is correct (no trailing slash)
3. CORS is properly configured
4. Browser console for errors

**Solution**:
- Verify backend URL in Vercel environment variables
- Check browser console for CORS errors
- Ensure backend CORS allows your Vercel domain

### No audio playing

**Check**:
1. Browser console for audio context errors
2. User interaction requirement (most browsers)

**Solution**:
- Click anywhere on page to initialize audio
- Check browser audio permissions
- Test with browser volume unmuted

---

## Cost Breakdown

### Free Tier (Both Services)

**Render Free**:
- ✅ WebSocket support
- ✅ Automatic HTTPS
- ✅ 750 hours/month
- ⚠️ Sleeps after 15 min inactivity

**Vercel Free**:
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ 100 GB bandwidth/month
- ✅ No sleep time

**Total Cost**: $0/month

### Upgrade for Production

**Render Starter ($7/month)**:
- Always-on (no sleep)
- 512 MB RAM
- Better for persistent WebSocket connections

**Vercel Pro ($20/month)**:
- Advanced analytics
- Better performance
- Team collaboration

**Total Cost**: $7-27/month depending on needs

---

## Security Checklist

- [ ] Update CORS to specific domain (not `*`)
- [ ] Add rate limiting if needed (optional)
- [ ] Monitor logs for suspicious activity
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS (automatic on Render/Vercel)

---

## Success!

Your AI Agent Wallet Tracker is now live! 🎉

**Next Steps**:
1. Share your Vercel URL with others
2. Monitor backend logs for activity
3. Watch real-time position updates
4. Customize design/features as needed

**Support**:
- Check backend logs on Render
- Check browser console on frontend
- Review README.md for architecture details

