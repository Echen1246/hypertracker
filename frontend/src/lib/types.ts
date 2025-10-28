export interface Position {
  coin: string;
  leverage: { value: string; type: string };
  szi: string;
  entryPx: string;
  marginUsed: string;
  positionValue: string;
  unrealizedPnl: string;
}

export interface Wallet {
  name: string;
  address: string;
  positions: Position[];
}

export interface CopyTradingConfig {
  enabled: boolean;
  copyFrom: string | null;
  positionSizeType: string;
  positionSizeValue: number;
}

export const TRACKED_WALLETS = [
  { name: 'MY WALLET', address: '0x520bb9E1Fe0DaCF4368992c3Ef8764284a69076B' },
  { name: 'GPT', address: '0x67293D914eAFb26878534571add81F6Bd2D9fE06' },
  { name: 'Gemini', address: '0x1b7A7D099a670256207a30dD0AE13D35f278010f' },
  { name: 'Claude', address: '0x59fA085d106541A834017b97060bcBBb0aa82869' },
  { name: 'Grok', address: '0x56D652e62998251b56C8398FB11fcFe464c08F84' },
  { name: 'Deepseek', address: '0xC20aC4Dc4188660cBF555448AF52694CA62b0734' },
  { name: 'Qwen', address: '0x7a8fd8bba33e37361ca6b0cb4518a44681bad2f3' },
];

