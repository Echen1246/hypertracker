import { useState, useEffect } from 'react';
import './WalletCard.css';

const WalletCard = ({ walletName, positions, isConnected, onUpdate }) => {
  const [isFlashing, setIsFlashing] = useState(false);

  // Trigger flash animation when positions update
  useEffect(() => {
    if (positions && positions.length > 0) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [positions]);

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPnL = (pnl) => {
    const num = parseFloat(pnl);
    const sign = num >= 0 ? '+' : '';
    return `${sign}$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSize = (szi, coin) => {
    const num = Math.abs(parseFloat(szi));
    return `${num.toFixed(4)} ${coin}`;
  };

  const hasPosition = positions && positions.length > 0;

  return (
    <div className={`wallet-card ${isFlashing ? 'flashing' : ''}`}>
      <div className="wallet-header">
        <h3 className="wallet-name">{walletName}</h3>
      </div>
      
      {!isConnected ? (
        <div className="no-position">Reconnecting...</div>
      ) : !hasPosition ? (
        <div className="no-position">No active position</div>
      ) : (
        <div className="positions">
          {positions.map((position, index) => {
            const isLong = parseFloat(position.szi) > 0;
            const direction = isLong ? 'LONG' : 'SHORT';
            const directionClass = isLong ? 'long' : 'short';
            
            return (
              <div key={index} className="position">
                <div className="position-header">
                  <span className="coin">{position.coin}</span>
                  <span className={`direction ${directionClass}`}>{direction}</span>
                  <span className="leverage">{position.leverage.value}x</span>
                </div>
                
                <div className="position-details">
                  <div className="detail-row">
                    <span className="label">Entry</span>
                    <span className="value">{formatPrice(position.entryPx)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Size</span>
                    <span className="value">{formatSize(position.szi, position.coin)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">P&L</span>
                    <span className={`value pnl ${parseFloat(position.unrealizedPnl) >= 0 ? 'positive' : 'negative'}`}>
                      {formatPnL(position.unrealizedPnl)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WalletCard;

