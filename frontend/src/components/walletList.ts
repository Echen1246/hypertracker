import { Wallet, TRACKED_WALLETS } from '../lib/types';

export function renderWalletList(
  container: HTMLElement,
  walletsData: Map<string, any[]>,
  selectedWallet: string,
  onSelectWallet: (name: string) => void
) {
  container.innerHTML = TRACKED_WALLETS.map(wallet => {
    const positions = walletsData.get(wallet.name) || [];
    const pnl = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealizedPnl || '0'), 0);
    const pnlClass = pnl >= 0 ? 'positive' : 'negative';
    const isActive = selectedWallet === wallet.name;

    return `
      <div class="wallet-card ${isActive ? 'active' : ''}" data-wallet="${wallet.name}">
        <div class="wallet-card-name">${wallet.name}</div>
        <div class="wallet-card-stats">
          <span class="wallet-card-positions">${positions.length} position${positions.length !== 1 ? 's' : ''}</span>
          ${pnl !== 0 ? `<span class="wallet-card-pnl ${pnlClass}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  container.querySelectorAll('.wallet-card').forEach(card => {
    card.addEventListener('click', () => {
      const walletName = card.getAttribute('data-wallet');
      if (walletName) {
        onSelectWallet(walletName);
      }
    });
  });
}

