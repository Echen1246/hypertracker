import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import WalletDetail from './components/WalletDetail';
import NotificationQueue from './components/NotificationQueue';
import CopyTradingPanel from './components/CopyTradingPanel';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function App() {
  const [walletPositions, setWalletPositions] = useState({});
  const [selectedWallet, setSelectedWallet] = useState('MY WALLET');
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mutedWallets, setMutedWallets] = useState({});
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
    };
    
    document.addEventListener('click', initAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', initAudio);
    };
  }, []);

  // Play DING notification sound
  const playDing = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Create a pleasant "ding" sound (like a notification bell)
    oscillator.frequency.value = 800; // Start frequency
    oscillator.type = 'sine';
    
    // Frequency sweep for bell-like sound
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };
  
  const toggleWalletMute = (walletName) => {
    setMutedWallets(prev => ({
      ...prev,
      [walletName]: !prev[walletName]
    }));
  };

  // Create notification from position change
  const createNotification = (wallet, positions, previousPositions) => {
    const notifs = [];
    const now = Date.now();
    
    const prevPosMap = new Map((previousPositions || []).map(p => [p.coin, p]));
    const currentPosMap = new Map(positions.map(p => [p.coin, p]));
    
    // Check for closed positions
    (previousPositions || []).forEach(prevPos => {
      if (!currentPosMap.has(prevPos.coin)) {
        notifs.push({
          id: `${wallet}-${prevPos.coin}-${now}-closed`,
          wallet,
          action: 'closed',
          coin: prevPos.coin,
          timestamp: now,
          details: null
        });
      }
    });
    
    // Check for new or modified positions
    positions.forEach(currentPos => {
      const prevPos = prevPosMap.get(currentPos.coin);
      const isLong = parseFloat(currentPos.szi) > 0;
      const direction = isLong ? 'LONG' : 'SHORT';
      
      if (!prevPos) {
        // New position
        notifs.push({
          id: `${wallet}-${currentPos.coin}-${now}-opened`,
          wallet,
          action: 'opened',
          coin: currentPos.coin,
          direction,
          timestamp: now,
          details: `${currentPos.leverage.value}x @ ${parseFloat(currentPos.entryPx).toFixed(2)}`
        });
      } else if (
        prevPos.szi !== currentPos.szi || 
        prevPos.leverage.value !== currentPos.leverage.value
      ) {
        // Modified position
        notifs.push({
          id: `${wallet}-${currentPos.coin}-${now}-modified`,
          wallet,
          action: 'modified',
          coin: currentPos.coin,
          direction,
          timestamp: now,
          details: `Size: ${Math.abs(parseFloat(currentPos.szi)).toFixed(4)} | ${currentPos.leverage.value}x`
        });
      }
    });
    
    return notifs;
  };

  // Socket.io connection
  useEffect(() => {
    console.log('Connecting to backend:', BACKEND_URL);
    
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Connected to backend');
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setIsConnected(false);
    });
    
    socket.on('connectionStatus', (data) => {
      console.log('Connection status:', data);
      setIsConnected(data.connected);
    });
    
    // Receive trade history from backend on connection
    socket.on('tradeHistory', (history) => {
      console.log('Received trade history:', history.length, 'trades');
      setNotifications(history);
    });
    
    // Listen for new trades from backend
    socket.on('newTrade', (trade) => {
      console.log('New trade received:', trade);
      setNotifications(prev => {
        const updated = [trade, ...prev];
        return updated.slice(0, 50); // Keep last 50 trades
      });
      
      // Play sound if wallet is not muted
      if (!mutedWallets[trade.wallet]) {
        playDing();
      }
    });
    
    socket.on('positionUpdate', (data) => {
      console.log('Position update:', data);
      
      setWalletPositions(prev => {
        const previousPositions = prev[data.wallet];
        const hasChanges = JSON.stringify(previousPositions) !== JSON.stringify(data.positions);
        
        // New trades are now handled by backend broadcasting tradeHistory updates
        // We don't create notifications in the frontend anymore to avoid duplicates
        
        // Always update positions (including P&L updates)
        return { ...prev, [data.wallet]: data.positions };
      });
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [selectedWallet]);

  const handleDismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const selectedPositions = walletPositions[selectedWallet] || [];
  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="app">
      <Sidebar
        selectedWallet={selectedWallet}
        onSelectWallet={setSelectedWallet}
        walletPositions={walletPositions}
        mutedWallets={mutedWallets}
        onToggleMute={toggleWalletMute}
        notifications={notifications}
      />
      
      <div className="main-content">
        <header className="app-header">
          <div className="app-header-left">
            <h1 className="app-title">Hyperliquid Agent Tracker</h1>
            {recentNotifications.length > 0 && (
              <div className="notification-badge" title={`${notifications.length} notifications`}>
                {notifications.length}
              </div>
            )}
          </div>
          <div className="connection-status-container">
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span className="connection-text">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        </header>
        
        <WalletDetail
          walletName={selectedWallet}
          positions={selectedPositions}
          isConnected={isConnected}
        />
      </div>
      
      <CopyTradingPanel
        socket={socketRef.current}
        isConnected={isConnected}
      />
    </div>
  );
}

export default App;
