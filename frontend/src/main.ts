import './styles/main.css';
import { WebSocketClient } from './lib/websocket';
import { TRACKED_WALLETS } from './lib/types';
import { renderWalletList } from './components/walletList';
import { renderPositions } from './components/positions';

const BACKEND_URL = 'http://localhost:3001';

class HyperTrackerApp {
  private ws: WebSocketClient;
  private walletsData: Map<string, any[]> = new Map();
  private selectedWallet: string = 'MY WALLET';
  private copyTradingEnabled: boolean = false;

  constructor() {
    this.ws = new WebSocketClient(BACKEND_URL);
    this.setupWebSocket();
    this.setupUI();
    this.render();
  }

  private setupWebSocket() {
    this.ws.on('connected', () => {
      this.updateStatus(true);
      console.log('Connected to backend');
    });

    this.ws.on('disconnected', () => {
      this.updateStatus(false);
      console.log('Disconnected from backend');
    });

    this.ws.on('positionUpdate', (data: any) => {
      console.log('Position update:', data);
      if (data.wallet && data.positions) {
        this.walletsData.set(data.wallet, data.positions);
        this.render();
      }
    });

    this.ws.on('copyTradingConfig', (data: any) => {
      console.log('Copy trading config:', data);
      this.copyTradingEnabled = data.enabled;
      this.updateCopyTradingUI(data);
    });
  }

  private setupUI() {
    // Copy trading toggle
    const toggleEl = document.getElementById('copy-trading-toggle') as HTMLInputElement;
    toggleEl?.addEventListener('change', () => {
      this.copyTradingEnabled = toggleEl.checked;
      const configEl = document.getElementById('copy-trading-config');
      if (configEl) {
        configEl.style.display = toggleEl.checked ? 'grid' : 'none';
      }
    });

    // Save configuration button
    const saveBtn = document.getElementById('save-config-btn');
    saveBtn?.addEventListener('click', () => this.saveCopyTradingConfig());

    // Populate copy-from select
    const select = document.getElementById('copy-from-select') as HTMLSelectElement;
    if (select) {
      TRACKED_WALLETS.forEach(wallet => {
        const option = document.createElement('option');
        option.value = wallet.name;
        option.textContent = wallet.name;
        select.appendChild(option);
      });
    }
  }

  private updateStatus(connected: boolean) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    
    if (dot) {
      dot.className = `status-dot ${connected ? 'connected' : ''}`;
    }
    if (text) {
      text.textContent = connected ? 'Live' : 'Offline';
      text.style.color = connected ? 'var(--color-success)' : 'var(--color-text-muted)';
    }
  }

  private render() {
    // Render wallet list
    const sidebarEl = document.getElementById('wallet-list');
    if (sidebarEl) {
      renderWalletList(sidebarEl, this.walletsData, this.selectedWallet, (name) => {
        this.selectedWallet = name;
        this.render();
      });
    }

    // Render selected wallet positions
    const nameEl = document.getElementById('selected-wallet-name');
    if (nameEl) {
      nameEl.textContent = this.selectedWallet;
    }

    const positions = this.walletsData.get(this.selectedWallet) || [];
    const totalPnl = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealizedPnl || '0'), 0);

    // Update total PnL badge
    const pnlBadge = document.getElementById('total-pnl-badge');
    if (pnlBadge) {
      if (totalPnl !== 0) {
        pnlBadge.textContent = `Total P&L: ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`;
        pnlBadge.className = `pnl-badge ${totalPnl >= 0 ? 'positive' : 'negative'}`;
        pnlBadge.style.display = 'block';
      } else {
        pnlBadge.style.display = 'none';
      }
    }

    // Render positions
    const positionsEl = document.getElementById('positions-grid');
    if (positionsEl) {
      renderPositions(positionsEl, positions);
    }
  }

  private updateCopyTradingUI(config: any) {
    const toggleEl = document.getElementById('copy-trading-toggle') as HTMLInputElement;
    const selectEl = document.getElementById('copy-from-select') as HTMLSelectElement;
    const sizeEl = document.getElementById('position-size-input') as HTMLInputElement;
    const configEl = document.getElementById('copy-trading-config');

    if (toggleEl) toggleEl.checked = config.enabled;
    if (selectEl && config.copyFrom) selectEl.value = config.copyFrom;
    if (sizeEl) sizeEl.value = config.positionSizeValue;
    if (configEl) configEl.style.display = config.enabled ? 'grid' : 'none';
  }

  private saveCopyTradingConfig() {
    const selectEl = document.getElementById('copy-from-select') as HTMLSelectElement;
    const sizeEl = document.getElementById('position-size-input') as HTMLInputElement;

    const config = {
      enabled: this.copyTradingEnabled,
      copyFrom: selectEl.value || null,
      positionSizeType: 'percentage',
      positionSizeValue: parseFloat(sizeEl.value) || 10,
      leverageMode: 'match',
      fixedLeverage: 2,
      maxPositionSize: 1000,
      maxOpenPositions: 3,
      copyCloses: true,
    };

    // Send directly to socket, not through WebSocketClient wrapper
    (this.ws as any).socket.emit('updateCopyConfig', config);
    console.log('Saved copy trading config:', config);
  }
}

// Initialize app
new HyperTrackerApp();

