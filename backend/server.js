const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration - supports both local and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL // Production frontend URL from environment
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST']
}));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Wallet configurations
const WALLETS = [
  { name: 'MY WALLET', address: process.env.MAIN_WALLET_ADDRESS || '0x520bb9E1Fe0DaCF4368992c3Ef8764284a69076B', isOwn: true },
  { name: 'GPT', address: '0x67293D914eAFb26878534571add81F6Bd2D9fE06' },
  { name: 'Gemini', address: '0x1b7A7D099a670256207a30dD0AE13D35f278010f' },
  { name: 'Whale Wallet', address: '0xa312114b5795dff9b8db50474dd57701aa78ad1e' },
  { name: 'Grok', address: '0x56D652e62998251b56C8398FB11fcFe464c08F84' },
  { name: 'Deepseek', address: '0xC20aC4Dc4188660cBF555448AF52694CA62b0734' },
  { name: 'Qwen', address: '0x7a8fd8bba33e37361ca6b0cb4518a44681bad2f3' }
];

// Copy trading configuration
let copyTradingConfig = {
  enabled: false,
  copyFrom: null, // which wallet to copy
  positionSizeType: 'percentage', // 'percentage' or 'fixed'
  positionSizeValue: 10, // 10% or $X
  leverageMode: 'match', // 'match' or 'fixed'
  fixedLeverage: 2,
  maxPositionSize: 1000, // max $ per position
  maxOpenPositions: 3,
  copyCloses: true
};

// Hyperliquid SDK setup (initialized after getTimestamp is defined)

const HYPERLIQUID_WS_URL = 'wss://api.hyperliquid.xyz/ws';

// WebSocket state management
let hyperliquidWs = null;
let reconnectAttempts = 0;
let reconnectTimeout = null;
let heartbeatInterval = null;
let isConnected = false;

// Store last known positions to detect changes
const lastPositions = {};

// Track if initial data has been loaded for each wallet
const initialLoadComplete = {};

// Store trade history (persists across frontend refreshes)
const tradeHistory = [];
const MAX_HISTORY_SIZE = 100; // Keep last 100 trades

// Exponential backoff configuration
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]; // milliseconds

// Get timestamp for logging
function getTimestamp() {
  return new Date().toISOString();
}

// Initialize Hyperliquid SDK for trading
const { HttpTransport, ExchangeClient, InfoClient } = require('@nktkas/hyperliquid');
const { privateKeyToAccount } = require('viem/accounts');

let walletClient = null;
let infoClient = null;

try {
  const transport = new HttpTransport({ url: 'https://api.hyperliquid.xyz' });
  infoClient = new InfoClient(transport);
  
  if (process.env.API_WALLET_PRIVATE_KEY) {
    const account = privateKeyToAccount(process.env.API_WALLET_PRIVATE_KEY);
    walletClient = new ExchangeClient(account, transport);
    console.log(`[${getTimestamp()}] Hyperliquid API wallet initialized (${process.env.API_WALLET_ADDRESS})`);
    console.log(`[${getTimestamp()}] Trading on behalf of main wallet: ${process.env.MAIN_WALLET_ADDRESS}`);
  } else {
    console.warn(`[${getTimestamp()}] No private key found - trading disabled`);
  }
} catch (error) {
  console.error(`[${getTimestamp()}] Failed to initialize Hyperliquid clients:`, error.message);
}

// Execute copy trade
async function executeCopyTrade(sourceWallet, action, tradeDetails) {
  if (!walletClient || !copyTradingConfig.enabled || copyTradingConfig.copyFrom !== sourceWallet) {
    return;
  }
  
  try {
    console.log(`[${getTimestamp()}] Copy trade triggered from ${sourceWallet}:`, action, tradeDetails);
    
    const { coin, isLong, leverage } = tradeDetails;
    
    // Calculate position size
    let positionSize = 0;
    if (copyTradingConfig.positionSizeType === 'percentage') {
      // For percentage-based, we'll use a simplified approach
      // Use fixed size calculations based on the config
      // In a real scenario, you'd want to get account value from clearinghouseState
      positionSize = copyTradingConfig.positionSizeValue; // Use as USD amount for now
    } else {
      positionSize = copyTradingConfig.positionSizeValue;
    }
    
    // Apply max position size limit
    positionSize = Math.min(positionSize, copyTradingConfig.maxPositionSize);
    
    // Determine leverage
    const useLeverage = copyTradingConfig.leverageMode === 'match' ? leverage : copyTradingConfig.fixedLeverage;
    
    // Check max open positions
    const myPositions = lastPositions['MY WALLET'] || [];
    if (action === 'open' && myPositions.length >= copyTradingConfig.maxOpenPositions) {
      console.log(`[${getTimestamp()}] Copy trade skipped: Max open positions (${copyTradingConfig.maxOpenPositions}) reached`);
      io.emit('copyTradeStatus', { 
        success: false, 
        message: `Max open positions (${copyTradingConfig.maxOpenPositions}) reached`,
        sourceWallet,
        action
      });
      return;
    }
    
    // Execute the trade
    if (action === 'open') {
      // Open new position
      // Note: sz is position size in USD notional value
      const result = await walletClient.placeOrder({
        coin,
        is_buy: isLong,
        sz: positionSize, // USD notional size
        limit_px: null, // Market order
        order_type: { limit: { tif: 'Ioc' } },
        reduce_only: false,
        vaultAddress: process.env.MAIN_WALLET_ADDRESS // Trade on behalf of main wallet
      });
      
      console.log(`[${getTimestamp()}] Copy trade executed: Opened ${positionSize} ${coin} ${isLong ? 'LONG' : 'SHORT'} @ ${useLeverage}x`);
      io.emit('copyTradeStatus', {
        success: true,
        message: `Opened ${positionSize.toFixed(2)} ${coin} ${isLong ? 'LONG' : 'SHORT'} @ ${useLeverage}x`,
        sourceWallet,
        action,
        result
      });
      
    } else if (action === 'close' && copyTradingConfig.copyCloses) {
      // Close position - find matching position by coin AND direction
      const myPosition = myPositions.find(p => p.coin === coin);
      if (myPosition) {
        const myPositionIsLong = parseFloat(myPosition.szi) > 0;
        
        // Verify position direction matches what we're trying to close
        if (myPositionIsLong === isLong) {
          const result = await walletClient.placeOrder({
            coin,
            is_buy: !isLong, // Close is opposite direction
            sz: Math.abs(parseFloat(myPosition.szi)),
            limit_px: null,
            order_type: { limit: { tif: 'Ioc' } },
            reduce_only: true,
            vaultAddress: process.env.MAIN_WALLET_ADDRESS // Trade on behalf of main wallet
          });
          
          console.log(`[${getTimestamp()}] Copy trade executed: Closed ${coin} ${isLong ? 'LONG' : 'SHORT'} position`);
          io.emit('copyTradeStatus', {
            success: true,
            message: `Closed ${coin} ${isLong ? 'LONG' : 'SHORT'} position`,
            sourceWallet,
            action,
            result
          });
        } else {
          console.log(`[${getTimestamp()}] Copy trade skipped: Position direction mismatch (source: ${isLong ? 'LONG' : 'SHORT'}, mine: ${myPositionIsLong ? 'LONG' : 'SHORT'})`);
          io.emit('copyTradeStatus', {
            success: false,
            message: `Cannot close ${coin}: Direction mismatch`,
            sourceWallet,
            action
          });
        }
      } else {
        console.log(`[${getTimestamp()}] Copy trade skipped: No position found for ${coin}`);
        io.emit('copyTradeStatus', {
          success: false,
          message: `No ${coin} position to close`,
          sourceWallet,
          action
        });
      }
    }
    
  } catch (error) {
    console.error(`[${getTimestamp()}] Copy trade failed:`, error.message);
    io.emit('copyTradeStatus', {
      success: false,
      message: `Copy trade failed: ${error.message}`,
      sourceWallet,
      action,
      error: error.message
    });
  }
}

// Parse position data from Hyperliquid message
function parsePositionData(data) {
  try {
    if (data.channel === 'webData2' && data.data && data.data.clearinghouseState) {
      const { user, clearinghouseState } = data.data;
      const { assetPositions } = clearinghouseState;
      
      // Find wallet name by address
      const wallet = WALLETS.find(w => w.address.toLowerCase() === user.toLowerCase());
      if (!wallet) {
        console.log(`[${getTimestamp()}] Unknown wallet address: ${user}`);
        return null;
      }
      
      // Parse positions
      const positions = assetPositions ? assetPositions.map(position => ({
        coin: position.position.coin,
        leverage: {
          value: position.position.leverage.value,
          type: position.position.leverage.type
        },
        szi: position.position.szi,
        entryPx: position.position.entryPx,
        marginUsed: position.position.marginUsed,
        positionValue: position.position.positionValue,
        unrealizedPnl: position.position.unrealizedPnl
      })) : [];
      
      console.log(`[${getTimestamp()}] ${wallet.name}: ${positions.length} position(s)`);
      
      return {
        wallet: wallet.name,
        address: user,
        positions
      };
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] Error parsing position data:`, error.message);
  }
  return null;
}

// Log position changes
function logPositionChange(walletName, positions, broadcast = true) {
  const posKey = walletName;
  const lastPos = lastPositions[posKey];
  
  if (!lastPos) {
    // First time seeing this wallet - just store, don't log/broadcast
    console.log(`[${getTimestamp()}] ${walletName}: Initial load - ${positions.length} position(s)`);
    lastPositions[posKey] = positions;
    initialLoadComplete[posKey] = true;
    return null; // Don't broadcast initial positions
  }
  
  // Only process changes if initial load is complete
  if (!initialLoadComplete[posKey]) {
    lastPositions[posKey] = positions;
    initialLoadComplete[posKey] = true;
    return null;
  }
  
  // Check for changes
  const lastPosMap = new Map(lastPos.map(p => [p.coin, p]));
  const currentPosMap = new Map(positions.map(p => [p.coin, p]));
  
  let hasChanges = false;
  
  // Check for closed positions
  lastPos.forEach(lp => {
    if (!currentPosMap.has(lp.coin)) {
      console.log(`[${getTimestamp()}] ${walletName}: Position closed - ${lp.coin}`);
      hasChanges = true;
      
      // Add to trade history
      const closedTrade = {
        id: `${walletName}-${lp.coin}-${Date.now()}-closed`,
        wallet: walletName,
        action: 'closed',
        coin: lp.coin,
        timestamp: Date.now()
      };
      tradeHistory.unshift(closedTrade);
      
      // Keep history size manageable
      if (tradeHistory.length > MAX_HISTORY_SIZE) {
        tradeHistory.pop();
      }
      
      // Broadcast new trade to all clients
      io.emit('newTrade', closedTrade);
      
      // Trigger copy trade for close
      if (walletName !== 'MY WALLET') {
        const isLong = parseFloat(lp.szi) > 0;
        executeCopyTrade(walletName, 'close', {
          coin: lp.coin,
          isLong,
          leverage: parseFloat(lp.leverage.value)
        });
      }
    }
  });
  
  // Check for new or modified positions
  positions.forEach(cp => {
    const lp = lastPosMap.get(cp.coin);
    if (!lp) {
      const isLong = parseFloat(cp.szi) > 0;
      console.log(`[${getTimestamp()}] ${walletName}: Position opened - ${cp.coin} ${isLong ? 'LONG' : 'SHORT'} ${cp.leverage.value}x @ $${cp.entryPx}`);
      hasChanges = true;
      
      // Add to trade history
      const openedTrade = {
        id: `${walletName}-${cp.coin}-${Date.now()}-opened`,
        wallet: walletName,
        action: 'opened',
        coin: cp.coin,
        direction: isLong ? 'LONG' : 'SHORT',
        timestamp: Date.now(),
        details: `${cp.leverage.value}x @ ${parseFloat(cp.entryPx).toFixed(2)}`
      };
      tradeHistory.unshift(openedTrade);
      
      // Keep history size manageable
      if (tradeHistory.length > MAX_HISTORY_SIZE) {
        tradeHistory.pop();
      }
      
      // Broadcast new trade to all clients
      io.emit('newTrade', openedTrade);
      
      // Trigger copy trade for new position
      if (walletName !== 'MY WALLET') {
        executeCopyTrade(walletName, 'open', {
          coin: cp.coin,
          isLong,
          leverage: parseFloat(cp.leverage.value),
          entryPx: parseFloat(cp.entryPx)
        });
      }
    } else if (lp.szi !== cp.szi || lp.leverage.value !== cp.leverage.value) {
      console.log(`[${getTimestamp()}] ${walletName}: Position modified - ${cp.coin} (Size: ${cp.szi}, Leverage: ${cp.leverage.value}x)`);
      hasChanges = true;
      
      // Add to trade history
      const isLong = parseFloat(cp.szi) > 0;
      const modifiedTrade = {
        id: `${walletName}-${cp.coin}-${Date.now()}-modified`,
        wallet: walletName,
        action: 'modified',
        coin: cp.coin,
        direction: isLong ? 'LONG' : 'SHORT',
        timestamp: Date.now(),
        details: `Size: ${Math.abs(parseFloat(cp.szi)).toFixed(4)} | ${cp.leverage.value}x`
      };
      tradeHistory.unshift(modifiedTrade);
      
      // Keep history size manageable
      if (tradeHistory.length > MAX_HISTORY_SIZE) {
        tradeHistory.pop();
      }
      
      // Broadcast new trade to all clients
      io.emit('newTrade', modifiedTrade);
      
      // Trigger copy trade for modification
      if (walletName !== 'MY WALLET') {
        const isLong = parseFloat(cp.szi) > 0;
        executeCopyTrade(walletName, 'modify', {
          coin: cp.coin,
          isLong,
          leverage: parseFloat(cp.leverage.value),
          newSize: cp.szi,
          oldSize: lp.szi
        });
      }
    }
  });
  
  // Update last positions
  lastPositions[posKey] = positions;
  
  return hasChanges ? positions : null;
}

// Connect to Hyperliquid WebSocket
function connectToHyperliquid() {
  if (hyperliquidWs) {
    hyperliquidWs.removeAllListeners();
    if (hyperliquidWs.readyState === WebSocket.OPEN) {
      hyperliquidWs.close();
    }
  }
  
  console.log(`[${getTimestamp()}] Connecting to Hyperliquid WebSocket...`);
  
  hyperliquidWs = new WebSocket(HYPERLIQUID_WS_URL);
  
  hyperliquidWs.on('open', () => {
    console.log(`[${getTimestamp()}] Connected to Hyperliquid WebSocket`);
    isConnected = true;
    reconnectAttempts = 0;
    
    // Broadcast connection status to all clients
    io.emit('connectionStatus', { connected: true });
    
    // Subscribe to all wallets
    WALLETS.forEach(wallet => {
      const subscription = {
        method: 'subscribe',
        subscription: {
          type: 'webData2',
          user: wallet.address
        }
      };
      
      hyperliquidWs.send(JSON.stringify(subscription));
      console.log(`[${getTimestamp()}] Subscribed to ${wallet.name} (${wallet.address})`);
    });
    
    // Start heartbeat
    startHeartbeat();
  });
  
  hyperliquidWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Parse position data
      const positionData = parsePositionData(message);
      
      if (positionData) {
        // Log changes and get positions to broadcast (null if no real changes)
        const positionsToBroadcast = logPositionChange(positionData.wallet, positionData.positions);
        
        // Only broadcast if there are actual changes (not initial load)
        if (positionsToBroadcast !== null) {
          io.emit('positionUpdate', {
            wallet: positionData.wallet,
            positions: positionData.positions
          });
        } else if (!initialLoadComplete[positionData.wallet]) {
          // For initial load, send positions but mark as initial
          io.emit('positionUpdate', {
            wallet: positionData.wallet,
            positions: positionData.positions,
            isInitial: true
          });
        } else {
          // Even if no structural changes, broadcast for P&L updates
          io.emit('positionUpdate', {
            wallet: positionData.wallet,
            positions: positionData.positions,
            isPnLUpdate: true // Mark as P&L-only update (no notifications)
          });
        }
      }
    } catch (error) {
      console.error(`[${getTimestamp()}] Error processing message:`, error.message);
    }
  });
  
  hyperliquidWs.on('error', (error) => {
    console.error(`[${getTimestamp()}] WebSocket error:`, error.message);
  });
  
  hyperliquidWs.on('close', () => {
    console.log(`[${getTimestamp()}] Disconnected from Hyperliquid WebSocket`);
    isConnected = false;
    stopHeartbeat();
    
    // Broadcast disconnection status
    io.emit('connectionStatus', { connected: false });
    
    // Attempt reconnection with exponential backoff
    scheduleReconnect();
  });
}

// Schedule reconnection with exponential backoff
function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  const delayIndex = Math.min(reconnectAttempts, BACKOFF_DELAYS.length - 1);
  const delay = BACKOFF_DELAYS[delayIndex];
  
  console.log(`[${getTimestamp()}] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts + 1})...`);
  
  reconnectTimeout = setTimeout(() => {
    reconnectAttempts++;
    connectToHyperliquid();
  }, delay);
}

// Heartbeat mechanism to detect stale connections
function startHeartbeat() {
  stopHeartbeat();
  
  heartbeatInterval = setInterval(() => {
    if (hyperliquidWs && hyperliquidWs.readyState === WebSocket.OPEN) {
      try {
        hyperliquidWs.ping();
      } catch (error) {
        console.error(`[${getTimestamp()}] Heartbeat failed:`, error.message);
        hyperliquidWs.close();
      }
    }
  }, 30000); // Ping every 30 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[${getTimestamp()}] Frontend client connected: ${socket.id}`);
  
  // Send current connection status
  socket.emit('connectionStatus', { connected: isConnected });
  
  // Send current copy trading configuration
  socket.emit('copyTradingConfig', copyTradingConfig);
  
  // Send trade history
  socket.emit('tradeHistory', tradeHistory);
  
  // Send current copy trading configuration
  socket.emit('copyTradingConfig', copyTradingConfig);
  
  // Send current positions for all wallets (without creating notifications)
  Object.keys(lastPositions).forEach(walletName => {
    socket.emit('positionUpdate', {
      wallet: walletName,
      positions: lastPositions[walletName],
      isInitial: true // Mark as initial load so frontend doesn't create notifications
    });
  });
  
  // Handle copy trading configuration updates
  socket.on('updateCopyConfig', (config) => {
    console.log(`[${getTimestamp()}] Copy trading config updated:`, config);
    
    // Validate and update configuration
    if (config.hasOwnProperty('enabled')) {
      copyTradingConfig.enabled = Boolean(config.enabled);
    }
    if (config.hasOwnProperty('copyFrom')) {
      copyTradingConfig.copyFrom = config.copyFrom;
    }
    if (config.hasOwnProperty('positionSizeType')) {
      copyTradingConfig.positionSizeType = config.positionSizeType;
    }
    if (config.hasOwnProperty('positionSizeValue')) {
      copyTradingConfig.positionSizeValue = Number(config.positionSizeValue);
    }
    if (config.hasOwnProperty('leverageMode')) {
      copyTradingConfig.leverageMode = config.leverageMode;
    }
    if (config.hasOwnProperty('fixedLeverage')) {
      copyTradingConfig.fixedLeverage = Number(config.fixedLeverage);
    }
    if (config.hasOwnProperty('maxPositionSize')) {
      copyTradingConfig.maxPositionSize = Number(config.maxPositionSize);
    }
    if (config.hasOwnProperty('maxOpenPositions')) {
      copyTradingConfig.maxOpenPositions = Number(config.maxOpenPositions);
    }
    if (config.hasOwnProperty('copyCloses')) {
      copyTradingConfig.copyCloses = Boolean(config.copyCloses);
    }
    
    // Broadcast updated config to all clients
    io.emit('copyTradingConfig', copyTradingConfig);
    
    if (copyTradingConfig.enabled) {
      console.log(`[${getTimestamp()}] Copy trading ENABLED - copying from ${copyTradingConfig.copyFrom}`);
    } else {
      console.log(`[${getTimestamp()}] Copy trading DISABLED`);
    }
  });
  
  // Handle emergency stop/close all
  socket.on('emergencyStopAll', async () => {
    console.log(`[${getTimestamp()}] EMERGENCY STOP ALL TRIGGERED`);
    
    if (!walletClient) {
      socket.emit('copyTradeStatus', {
        success: false,
        message: 'Wallet client not initialized'
      });
      return;
    }
    
    try {
      // Disable copy trading
      copyTradingConfig.enabled = false;
      io.emit('copyTradingConfig', copyTradingConfig);
      
      // Close all positions
      const myPositions = lastPositions['MY WALLET'] || [];
      for (const position of myPositions) {
        const isLong = parseFloat(position.szi) > 0;
        await walletClient.placeOrder({
          coin: position.coin,
          is_buy: !isLong, // Close is opposite direction
          sz: Math.abs(parseFloat(position.szi)),
          limit_px: null,
          order_type: { limit: { tif: 'Ioc' } },
          reduce_only: true,
          vaultAddress: process.env.MAIN_WALLET_ADDRESS // Trade on behalf of main wallet
        });
        console.log(`[${getTimestamp()}] Emergency closed ${position.coin} position`);
      }
      
      socket.emit('copyTradeStatus', {
        success: true,
        message: `Emergency stop complete - closed ${myPositions.length} position(s)`
      });
      
    } catch (error) {
      console.error(`[${getTimestamp()}] Emergency stop failed:`, error.message);
      socket.emit('copyTradeStatus', {
        success: false,
        message: `Emergency stop failed: ${error.message}`,
        error: error.message
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`[${getTimestamp()}] Frontend client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connected: isConnected,
    timestamp: getTimestamp()
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`[${getTimestamp()}] Server running on port ${PORT}`);
  console.log(`[${getTimestamp()}] Tracking ${WALLETS.length} wallets`);
  
  // Connect to Hyperliquid
  connectToHyperliquid();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${getTimestamp()}] SIGTERM received, shutting down gracefully...`);
  
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  stopHeartbeat();
  
  if (hyperliquidWs) {
    hyperliquidWs.close();
  }
  
  server.close(() => {
    console.log(`[${getTimestamp()}] Server closed`);
    process.exit(0);
  });
});

