import './Sidebar.css';

const WALLET_NAMES = ['MY WALLET', 'GPT', 'Gemini', 'Claude', 'Grok', 'Deepseek', 'Qwen'];

const Sidebar = ({ selectedWallet, onSelectWallet, walletPositions, mutedWallets, onToggleMute, notifications }) => {
  const getPositionCount = (walletName) => {
    const positions = walletPositions[walletName] || [];
    return positions.length;
  };

  // Get recent trades (last 15)
  const recentTrades = notifications.slice(0, 15);

  const formatNotification = (notif) => {
    if (notif.action === 'opened') {
      return `${notif.coin} ${notif.direction} ${notif.details}`;
    } else if (notif.action === 'closed') {
      return `${notif.coin} CLOSED`;
    } else if (notif.action === 'modified') {
      return `${notif.coin} ${notif.details}`;
    }
    return notif.action;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Wallets</h2>
      </div>
      
      <div className="wallet-list">
        {WALLET_NAMES.map(walletName => {
          const posCount = getPositionCount(walletName);
          const isSelected = selectedWallet === walletName;
          const isMuted = mutedWallets[walletName];
          
          return (
            <div key={walletName} className="wallet-item-container">
              <button
                className={`wallet-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectWallet(walletName)}
              >
                <span className="wallet-item-name">{walletName}</span>
                {posCount > 0 && (
                  <span className="position-badge">{posCount}</span>
                )}
              </button>
              <button
                className={`mute-button ${isMuted ? 'muted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute(walletName);
                }}
                title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
              >
                {isMuted ? '🔕' : '🔔'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Recents Section */}
      <div className="recents-section">
        <div className="recents-header">
          <h2 className="sidebar-title">Recent Trades</h2>
        </div>
        <div className="recents-list">
          {recentTrades.length === 0 ? (
            <div className="no-recents">No recent trades</div>
          ) : (
            recentTrades.map(notif => {
              const timestamp = new Date(notif.timestamp);
              const timeStr = timestamp.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              });
              
              return (
                <div key={notif.id} className="recent-item">
                  <div className="recent-agent">{notif.wallet}</div>
                  <div className="recent-action">{formatNotification(notif)}</div>
                  <div className="recent-time">{timeStr}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

