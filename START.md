# Quick Start Guide

## Starting HyperTracker

### 1. Start the Backend

```bash
cd backend
npm start
```

You should see:
```
Server running on http://localhost:3000
Connecting to Hyperliquid WebSocket...
WebSocket connected to Hyperliquid
```

### 2. Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. Open Your Browser

Navigate to: **http://localhost:5173**

You should see:
- Clean black background with minimal borders
- "Live" status indicator (green dot) in top-right
- List of 7 tracked wallets in left sidebar
- Position table with columns: MARKET, SIDE, LEVERAGE, ENTRY, VALUE, MARGIN, PNL
- Copy trading panel at the bottom

## What You Should See

✅ **Status Badge**: Top-right should show "Live" with a pulsing green dot  
✅ **Wallet List**: 7 wallets (MY WALLET, GPT, Gemini, Claude, Grok, Deepseek, Qwen)  
✅ **Positions**: Live positions with P&L for each wallet  
✅ **Copy Trading Panel**: Toggle and configuration options  

## First-Time Setup

The app works out of the box with no configuration needed! It uses public blockchain data.

## Troubleshooting

**Backend won't start?**
- Make sure port 3000 is not in use: `lsof -i :3000`
- Check Node.js version: `node -v` (needs 16+)

**Frontend shows "Offline"?**
- Ensure backend is running first
- Check browser console for errors
- Verify backend URL in browser DevTools

**No positions showing?**
- Positions update in real-time from Hyperliquid
- Wallets without open positions will show "No open positions"
- Try selecting different wallets from the sidebar

## Tech Stack

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Pure TypeScript + Vite
- **Design**: Modern dark theme with gradient accents
- **Data**: Real-time via Hyperliquid WebSocket API

Enjoy tracking! 🚀
