# HyperTracker - AI Agent Wallet Tracker

Real-time monitoring dashboard for 6 AI trading agent wallets on Hyperliquid exchange.

## Project Overview

HyperTracker monitors the following AI-named trading wallets in real-time:
- **GPT**: 0x67293D914eAFb26878534571add81F6Bd2D9fE06
- **Gemini**: 0x1b7A7D099a670256207a30dD0AE13D35f278010f
- **Claude**: 0x59fA085d106541A834017b97060bcBBb0aa82869
- **Grok**: 0x56D652e62998251b56C8398FB11fcFe464c08F84
- **Deepseek**: 0xC20aC4Dc4188660cBF555448AF52694CA62b0734
- **Qwen**: 0xC20aC4Dc4188660cBF555448AF52694CA62b0734

## Architecture

- **Backend**: Node.js + Express + Socket.io + WebSocket
  - Single WebSocket connection to Hyperliquid API
  - Broadcasts position updates to all frontend clients
  - Automatic reconnection with exponential backoff
  
- **Frontend**: React + Socket.io Client + Vite
  - Real-time position display
  - Audio notifications on position changes
  - Visual flash animations
  - Minimalist dark theme design

## Local Development

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Backend Setup

```bash
cd backend
npm install
npm start
```

Backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

The frontend will automatically connect to the backend at `http://localhost:3001`.

## Features

### Real-Time Position Tracking
- Coin symbol (BTC, ETH, etc.)
- Position direction (LONG/SHORT)
- Leverage (e.g., 15x)
- Entry price
- Position size
- Unrealized P&L

### User Experience
- **Audio Notification**: Plays beep when positions update
- **Visual Feedback**: 200ms cyan flash on updated wallet cards
- **Connection Status**: Green/red indicator in top-right corner
- **Responsive Design**: Works on desktop and mobile

### Backend Features
- **Single WebSocket Connection**: Efficient connection management to Hyperliquid
- **Exponential Backoff Reconnection**: 1s → 2s → 4s → 8s → 16s → 30s max
- **Heartbeat Mechanism**: Detects stale connections
- **Console Logging**: Timestamps + wallet name + action
- **Multi-Client Broadcasting**: Socket.io broadcasts to all connected frontends

## Deployment

### Backend Deployment (Render)

1. **Create New Web Service** on Render.com
2. **Connect Repository** or deploy from Git
3. **Configuration**:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
   - **Plan**: Free
4. **Environment Variables**: None required (PORT is auto-provided)
5. **Deploy**: Render will auto-deploy and provide a URL like `https://your-app.onrender.com`

### Frontend Deployment (Vercel)

1. **Import Project** on Vercel.com
2. **Framework Preset**: Vite
3. **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   ```
   VITE_BACKEND_URL=https://your-render-backend-url.onrender.com
   ```
7. **Deploy**: Vercel will auto-deploy and provide a URL

### Important Notes

- **CORS**: Update backend `server.js` to allow your Vercel domain:
  ```javascript
  cors: {
    origin: 'https://your-vercel-app.vercel.app',
    methods: ['GET', 'POST']
  }
  ```

- **WebSocket Connection**: Render's free tier supports WebSockets but may sleep after inactivity. First request may take 30-60 seconds to wake up.

## File Structure

```
hypertracker/
├── backend/
│   ├── server.js          # Express + Socket.io + Hyperliquid WS
│   ├── package.json
│   └── .env              # PORT=3001
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Main component
│   │   ├── App.css       # Main styles
│   │   ├── components/
│   │   │   ├── WalletCard.jsx    # Wallet card component
│   │   │   └── WalletCard.css    # Card styles
│   │   ├── index.css     # Global styles
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   └── .env              # VITE_BACKEND_URL
└── README.md
```

## API Reference

### Hyperliquid WebSocket

**Endpoint**: `wss://api.hyperliquid.xyz/ws`

**Subscription Format**:
```json
{
  "method": "subscribe",
  "subscription": {
    "type": "webData2",
    "user": "<wallet_address>"
  }
}
```

**Response Format**:
```json
{
  "channel": "webData2",
  "data": {
    "user": "<wallet_address>",
    "clearinghouseState": {
      "assetPositions": [
        {
          "position": {
            "coin": "BTC",
            "leverage": {
              "value": 15,
              "type": "cross"
            },
            "szi": "0.5",
            "entryPx": "95234.50",
            "marginUsed": "3000.00",
            "positionValue": "47617.25",
            "unrealizedPnl": "1234.56"
          }
        }
      ]
    }
  }
}
```

### Socket.io Events

**Client → Server**: No events sent

**Server → Client**:
- `connectionStatus`: `{ connected: boolean }`
- `positionUpdate`: `{ wallet: string, positions: Array }`

## Design System

- **Background**: `#0a0a0f`
- **Accent**: `#00d4ff` (light cyan)
- **Success/Long**: `#00ff88` (green)
- **Error/Short**: `#ff4444` (red)
- **Text Primary**: `#ffffff`
- **Text Secondary**: `#808080`
- **Text Muted**: `#505050`
- **Border**: `#1a1a1f`
- **Font**: Inter, SF Pro Display (weight 300-400)

## Troubleshooting

### Backend not connecting to Hyperliquid
- Check if `wss://api.hyperliquid.xyz/ws` is accessible
- Look at console logs for connection errors
- Verify wallet addresses are correct

### Frontend not receiving updates
- Check browser console for Socket.io connection errors
- Verify `VITE_BACKEND_URL` points to correct backend
- Ensure backend is running and accessible

### Audio not playing
- Check browser console for audio context errors
- Most browsers require user interaction before playing audio
- Click anywhere on the page to initialize audio context

## License

MIT

## No Authentication Required

This tracker uses **public blockchain data** only. No API keys, private keys, or Hyperliquid accounts are needed. The WebSocket connection is completely unauthenticated and read-only.

