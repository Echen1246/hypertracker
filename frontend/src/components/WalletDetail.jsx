import './WalletDetail.css';

const WalletDetail = ({ walletName, positions, isConnected }) => {
  const formatPrice = (price) => {
    const num = parseFloat(price);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPnL = (pnl) => {
    const num = parseFloat(pnl);
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSize = (szi) => {
    const num = Math.abs(parseFloat(szi));
    return num.toFixed(4);
  };

  const hasPosition = positions && positions.length > 0;

  return (
    <div className="wallet-detail">
      <div className="wallet-detail-header">
        <h2 className="wallet-detail-name">{walletName}</h2>
        <div className="wallet-detail-meta">
          <span className="position-count">
            {hasPosition ? `${positions.length} Position${positions.length > 1 ? 's' : ''}` : 'No Positions'}
          </span>
        </div>
      </div>
      
      {!isConnected ? (
        <div className="wallet-detail-empty">Connecting to exchange...</div>
      ) : !hasPosition ? (
        <div className="wallet-detail-empty">No open positions</div>
      ) : (
        <div className="order-book">
          <div className="order-book-header">
            <div className="column-header symbol">Symbol</div>
            <div className="column-header side">Side</div>
            <div className="column-header size">Size</div>
            <div className="column-header entry-price">Entry Price</div>
            <div className="column-header mark-price">Mark Price</div>
            <div className="column-header leverage">Leverage</div>
            <div className="column-header margin">Margin</div>
            <div className="column-header pnl">Unrealized PnL</div>
          </div>
          
          <div className="order-book-rows">
            {positions.map((position, index) => {
              const isLong = parseFloat(position.szi) > 0;
              const sideClass = isLong ? 'long' : 'short';
              const pnlNum = parseFloat(position.unrealizedPnl);
              const pnlClass = pnlNum >= 0 ? 'positive' : 'negative';
              const markPrice = parseFloat(position.entryPx) + (pnlNum / parseFloat(position.szi));
              
              return (
                <div key={index} className={`order-book-row ${sideClass}`}>
                  <div className="column symbol mono">{position.coin}/USDT</div>
                  <div className={`column side ${sideClass}`}>
                    {isLong ? 'LONG' : 'SHORT'}
                  </div>
                  <div className="column size mono">{formatSize(position.szi)}</div>
                  <div className="column entry-price mono">{formatPrice(position.entryPx)}</div>
                  <div className="column mark-price mono">{formatPrice(markPrice)}</div>
                  <div className="column leverage mono">{position.leverage.value}x</div>
                  <div className="column margin mono">{formatPrice(position.marginUsed)}</div>
                  <div className={`column pnl mono ${pnlClass}`}>{formatPnL(position.unrealizedPnl)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDetail;
