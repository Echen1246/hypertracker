import { Position } from '../lib/types';

export function renderPositions(container: HTMLElement, positions: Position[]) {
  if (positions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M3 3h18v18H3z M3 9h18 M9 3v18"/>
        </svg>
        <p>No open positions</p>
      </div>
    `;
    return;
  }

  const header = `
    <div class="position-card position-header-row">
      <div class="position-header">
        <span class="position-coin">MARKET</span>
        <span class="position-direction">SIDE</span>
        <span class="position-value">LEVERAGE</span>
        <span class="position-value">ENTRY</span>
        <span class="position-value">VALUE</span>
        <span class="position-value">MARGIN</span>
        <span class="position-value">PNL</span>
      </div>
    </div>
  `;

  const rows = positions.map(position => {
    const isLong = parseFloat(position.szi) > 0;
    const pnl = parseFloat(position.unrealizedPnl);
    const posValue = parseFloat(position.positionValue);
    const pnlPercent = posValue > 0 ? (pnl / posValue) * 100 : 0;
    const pnlClass = pnl >= 0 ? 'positive' : 'negative';

    return `
      <div class="position-card">
        <div class="position-header">
          <span class="position-coin">${position.coin}</span>
          <span class="position-direction ${isLong ? 'long' : 'short'}">
            ${isLong ? 'LONG' : 'SHORT'}
          </span>
          <div class="position-details">
            <div class="position-row">
              <span class="position-value">${position.leverage.value}x</span>
            </div>
            <div class="position-row">
              <span class="position-value">$${parseFloat(position.entryPx).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="position-row">
              <span class="position-value">$${posValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="position-row">
              <span class="position-value">$${parseFloat(position.marginUsed).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div class="position-row position-pnl">
              <span class="position-value ${pnlClass}">
                ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = header + rows;
}

