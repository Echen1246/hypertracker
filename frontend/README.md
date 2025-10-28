# HyperTracker Frontend

A modern, professional vanilla TypeScript frontend for tracking Hyperliquid positions and copy trading.

## Tech Stack

- **Pure TypeScript** - No React, no frameworks
- **Vite** - Fast build tool and dev server
- **Custom WebSocket Client** - Real-time position updates
- **CSS3** - Modern, responsive design with gradients and animations

## Features

- 📊 Real-time position tracking for multiple wallets
- 💰 Live P&L calculations
- 🔄 Copy trading configuration
- 🎨 Professional dark theme with gradient accents
- ⚡ Zero-latency DOM updates

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

```
src/
├── main.ts              # App initialization
├── styles/
│   └── main.css        # All styles
├── lib/
│   ├── websocket.ts    # WebSocket client
│   └── types.ts        # TypeScript interfaces
└── components/
    ├── walletList.ts   # Wallet sidebar
    └── positions.ts    # Position cards
```

## Backend Connection

The frontend connects to the Node.js backend via WebSocket on `ws://localhost:3000`.

Make sure the backend is running before starting the frontend.
