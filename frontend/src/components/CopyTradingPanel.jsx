import { useState, useEffect } from 'react';
import './CopyTradingPanel.css';

const WALLET_OPTIONS = ['GPT', 'Gemini', 'Claude', 'Grok', 'Deepseek', 'Qwen']; // Exclude MY WALLET from copy options

const CopyTradingPanel = ({ socket, isConnected }) => {
  const [config, setConfig] = useState({
    enabled: false,
    copyFrom: null,
    positionSizeType: 'percentage',
    positionSizeValue: 10,
    leverageMode: 'match',
    fixedLeverage: 2,
    maxPositionSize: 1000,
    maxOpenPositions: 3,
    copyCloses: true
  });
  
  const [copyTradeStatus, setCopyTradeStatus] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for config updates from server (immediately update state)
    const handleConfigUpdate = (serverConfig) => {
      console.log('Received copy trading config from server:', serverConfig);
      setConfig(serverConfig);
    };
    
    socket.on('copyTradingConfig', handleConfigUpdate);

    // Listen for copy trade status updates
    socket.on('copyTradeStatus', (status) => {
      setCopyTradeStatus(status);
      
      // Clear status after 5 seconds
      setTimeout(() => setCopyTradeStatus(null), 5000);
    });

    return () => {
      socket.off('copyTradingConfig', handleConfigUpdate);
      socket.off('copyTradeStatus');
    };
  }, [socket]);

  const updateConfig = (updates) => {
    if (!socket) return;
    
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    socket.emit('updateCopyConfig', updates);
  };

  const handleEmergencyStop = () => {
    if (!socket) return;
    
    if (window.confirm('EMERGENCY STOP: This will disable copy trading and close ALL your positions. Continue?')) {
      socket.emit('emergencyStopAll');
    }
  };

  return (
    <div className="copy-trading-panel">
      <div className="panel-header">
        <h2 className="panel-title">Copy Trading</h2>
        <div className={`status-indicator ${config.enabled && config.copyFrom ? 'active' : 'inactive'}`}>
          {config.enabled && config.copyFrom ? `Copying ${config.copyFrom}` : 'Disabled'}
        </div>
      </div>

      {copyTradeStatus && (
        <div className={`trade-status ${copyTradeStatus.success ? 'success' : 'error'}`}>
          {copyTradeStatus.message}
        </div>
      )}

      {/* Main Enable/Disable Toggle */}
      <div className="control-group">
        <label className="control-label">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            disabled={!isConnected}
          />
          Enable Copy Trading
        </label>
      </div>

      {/* Wallet Selection */}
      <div className="control-group">
        <label className="control-label">Copy From</label>
        <div className="wallet-selector">
          {WALLET_OPTIONS.map(wallet => (
            <button
              key={wallet}
              className={`wallet-option ${config.copyFrom === wallet ? 'selected' : ''}`}
              onClick={() => updateConfig({ copyFrom: wallet })}
              disabled={!isConnected}
            >
              {wallet}
            </button>
          ))}
        </div>
      </div>

      {/* Position Size */}
      <div className="control-group">
        <label className="control-label">Position Size</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={config.positionSizeType === 'percentage'}
              onChange={() => updateConfig({ positionSizeType: 'percentage' })}
              disabled={!isConnected}
            />
            % of Account
          </label>
          <label>
            <input
              type="radio"
              checked={config.positionSizeType === 'fixed'}
              onChange={() => updateConfig({ positionSizeType: 'fixed' })}
              disabled={!isConnected}
            />
            Fixed USD
          </label>
        </div>
        <div className="slider-group">
          <input
            type="range"
            min={config.positionSizeType === 'percentage' ? 1 : 10}
            max={config.positionSizeType === 'percentage' ? 100 : 10000}
            step={config.positionSizeType === 'percentage' ? 1 : 10}
            value={config.positionSizeValue}
            onChange={(e) => updateConfig({ positionSizeValue: parseFloat(e.target.value) })}
            disabled={!isConnected}
          />
          <span className="slider-value">
            {config.positionSizeType === 'percentage' 
              ? `${config.positionSizeValue}%` 
              : `$${config.positionSizeValue}`}
          </span>
        </div>
      </div>

      {/* Leverage Mode */}
      <div className="control-group">
        <label className="control-label">Leverage</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              checked={config.leverageMode === 'match'}
              onChange={() => updateConfig({ leverageMode: 'match' })}
              disabled={!isConnected}
            />
            Match Their Leverage
          </label>
          <label>
            <input
              type="radio"
              checked={config.leverageMode === 'fixed'}
              onChange={() => updateConfig({ leverageMode: 'fixed' })}
              disabled={!isConnected}
            />
            Use Fixed
          </label>
        </div>
        {config.leverageMode === 'fixed' && (
          <div className="slider-group">
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={config.fixedLeverage}
              onChange={(e) => updateConfig({ fixedLeverage: parseFloat(e.target.value) })}
              disabled={!isConnected}
            />
            <span className="slider-value">{config.fixedLeverage}x</span>
          </div>
        )}
      </div>

      {/* Safety Limits */}
      <div className="control-group">
        <label className="control-label">Max Position Size</label>
        <div className="slider-group">
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={config.maxPositionSize}
            onChange={(e) => updateConfig({ maxPositionSize: parseFloat(e.target.value) })}
            disabled={!isConnected}
          />
          <span className="slider-value">${config.maxPositionSize}</span>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">Max Open Positions</label>
        <div className="slider-group">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={config.maxOpenPositions}
            onChange={(e) => updateConfig({ maxOpenPositions: parseInt(e.target.value) })}
            disabled={!isConnected}
          />
          <span className="slider-value">{config.maxOpenPositions}</span>
        </div>
      </div>

      {/* Copy Closes */}
      <div className="control-group">
        <label className="control-label">
          <input
            type="checkbox"
            checked={config.copyCloses}
            onChange={(e) => updateConfig({ copyCloses: e.target.checked })}
            disabled={!isConnected}
          />
          Copy Position Closes
        </label>
      </div>

      {/* Emergency Stop */}
      <div className="control-group emergency-section">
        <button
          className="emergency-stop-btn"
          onClick={handleEmergencyStop}
          disabled={!isConnected || !config.enabled}
        >
          EMERGENCY STOP & CLOSE ALL
        </button>
        <p className="emergency-note">
          Disables copy trading and closes all your positions immediately
        </p>
      </div>
    </div>
  );
};

export default CopyTradingPanel;

