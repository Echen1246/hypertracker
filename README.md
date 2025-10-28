# HyperTracker - AI Agent Wallet Tracker

Real-time monitoring dashboard for 7 AI trading agent wallets on Hyperliquid exchange with copy trading capabilities.

## Project Overview

HyperTracker monitors the following AI-named trading wallets in real-time:
- **MY WALLET**: 0x520bb9E1Fe0DaCF4368992c3Ef8764284a69076B
- **GPT**: 0x67293D914eAFb26878534571add81F6Bd2D9fE06
- **Gemini**: 0x1b7A7D099a670256207a30dD0AE13D35f278010f
- **Claude**: 0x59fA085d106541A834017b97060bcBBb0aa82869
- **Grok**: 0x56D652e62998251b56C8398FB11fcFe464c08F84
- **Deepseek**: 0xC20aC4Dc4188660cBF555448AF52694CA62b0734
- **Qwen**: 0x7a8fd8bba33e37361ca6b0cb4518a44681bad2f3

## Architecture

- **Backend**: Node.js + Express + Socket.io + WebSocket
  - Single WebSocket connection to Hyperliquid API
  - Broadcasts position updates to all frontend clients
  - Copy trading execution engine
  - Automatic reconnection with exponential backoff
  
- **Frontend**: Vanilla TypeScript + Vite
  - Zero framework overhead for maximum performance
  - Real-time position display with live P&L
  - Clean, minimalist UI inspired by Hyperliquid
  - Table-based layout with data density
  - Copy trading configuration panel

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

Backend will run on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

The frontend will automatically connect to the backend at `ws://localhost:3000`.

## Features

### Real-Time Position Tracking
- Coin symbol (BTC, ETH, etc.)
- Position direction (LONG/SHORT with color coding)
- Leverage display (e.g., 15x)
- Entry price
- Position value and margin used
- Unrealized P&L with percentage

### Copy Trading
- Select a wallet to copy trades from
- Configurable position sizing (percentage of account)
- Real-time trade mirroring
- Emergency stop functionality

### User Experience
- **Clean UI**: Minimalist black background, no boxes or cards, table-first design
- **Connection Status**: Live/Offline indicator in header
- **Data Density**: Compact layout optimized for viewing many positions
- **Responsive Design**: Optimized for desktop with clean table layout
- **Zero Framework Overhead**: Pure TypeScript for maximum performance

### Backend Features
- **Single WebSocket Connection**: Efficient connection management to Hyperliquid
- **Exponential Backoff Reconnection**: 1s → 2s → 4s → 8s → 16s → 30s max
- **Copy Trading Engine**: Detects and mirrors trades automatically
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
│   ├── server.js               # Express + Socket.io + Hyperliquid WS + Copy Trading
│   ├── test-copy-trade.js      # Copy trading test script
│   ├── package.json
│   └── .env                    # Optional config
├── frontend/
│   ├── src/
│   │   ├── main.ts             # App initialization
│   │   ├── lib/
│   │   │   ├── websocket.ts    # WebSocket client
│   │   │   └── types.ts        # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── walletList.ts   # Wallet sidebar rendering
│   │   │   └── positions.ts    # Position cards rendering
│   │   └── styles/
│   │       └── main.css        # All styles (CSS3 with gradients)
│   ├── index.html              # Main HTML
│   ├── package.json
│   ├── tsconfig.json           # TypeScript config
│   ├── vite.config.ts          # Vite build config
│   └── .env.example            # VITE_BACKEND_URL
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

Inspired by Hyperliquid's clean, professional interface.

- **Background**: `#000000` (pure black)
- **Surface**: `#0a0a0a` (subtle elevation)
- **Success/Long**: `#00ff00` (bright green)
- **Error/Short**: `#ff4466` (red)
- **Primary**: `#00ffff` (cyan)
- **Text Primary**: `#ffffff` (white)
- **Text Muted**: `#666666` (gray)
- **Border**: `#1a1a1a` (minimal)
- **Font**: Inter (11-14px, weights 400-600)
- **Layout**: Table-based, no cards, minimal borders
- **Philosophy**: Data density, clean lines, no fluff

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

