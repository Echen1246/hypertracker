import './styles/main.css';
import { WebSocketClient } from './lib/websocket';
import { TRACKED_WALLETS } from './lib/types';
import { renderWalletList } from './components/walletList';
import { renderPositions } from './components/positions';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://hypertracker.onrender.com';
console.log('🔗 Connecting to backend:', BACKEND_URL);

class HyperTrackerApp {
  private ws: WebSocketClient;
  private walletsData: Map<string, any[]> = new Map();
  private tradeHistory: any[] = [];
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

    this.ws.on('tradeHistory', (history: any[]) => {
      console.log('Trade history received:', history);
      this.tradeHistory = history || [];
    });

    this.ws.on('newTrade', (trade: any) => {
      console.log('New trade:', trade);
      this.tradeHistory.unshift(trade);
      // Keep last 100
      if (this.tradeHistory.length > 100) {
        this.tradeHistory.pop();
      }
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

    // Trade log modal
    const showLogBtn = document.getElementById('show-log-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('trade-log-modal');

    showLogBtn?.addEventListener('click', () => {
      this.showTradeLog();
    });

    closeModalBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
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

  private showTradeLog() {
    const modal = document.getElementById('trade-log-modal');
    const modalWalletName = document.getElementById('modal-wallet-name');
    const tradeLogBody = document.getElementById('trade-log-body');

    if (!modal || !tradeLogBody) return;

    // Update modal title
    if (modalWalletName) {
      modalWalletName.textContent = `${this.selectedWallet} - Trade Log`;
    }

    // Filter trades for selected wallet
    const walletTrades = this.tradeHistory.filter(trade => trade.wallet === this.selectedWallet);

    if (walletTrades.length === 0) {
      tradeLogBody.innerHTML = '<div class="trade-log-empty">No trades found for this wallet</div>';
    } else {
      tradeLogBody.innerHTML = walletTrades.map(trade => {
        const date = new Date(trade.timestamp);
        const timeStr = date.toLocaleString();
        const actionClass = trade.action || 'modified';
        
        return `
          <div class="trade-log-item">
            <div class="trade-log-header">
              <span class="trade-log-action ${actionClass}">${trade.action || 'unknown'}</span>
              <span class="trade-log-time">${timeStr}</span>
            </div>
            <div class="trade-log-details">
              <span class="trade-log-coin">${trade.coin}</span>
              ${trade.direction ? `<span class="trade-log-direction ${trade.direction.toLowerCase()}">${trade.direction}</span>` : ''}
              ${trade.details ? `<span>${trade.details}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    modal.classList.remove('hidden');
  }
}

// Initialize app
new HyperTrackerApp();

