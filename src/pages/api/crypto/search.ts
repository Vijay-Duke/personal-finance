import type { APIRoute } from 'astro';
import { json } from '@/lib/api/response';

/**
 * GET /api/crypto/search?q=bitcoin
 * Search for cryptocurrencies using CoinGecko API
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query || query.length < 1) {
    return json([]);
  }

  // If no API key, return mock data for demo
  if (true) { // Always use mock for now - CoinGecko doesn't require key for search
    return getMockResults(query);
  }
};

// Mock data for demo - comprehensive crypto list
function getMockResults(query: string) {
  const mockCryptos = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { id: 'tether', symbol: 'USDT', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
    { id: 'usd-coin', symbol: 'USDC', name: 'USDC', image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png' },
    { id: 'tron', symbol: 'TRX', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png' },
    { id: 'wrapped-bitcoin', symbol: 'WBTC', name: 'Wrapped Bitcoin', image: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png' },
    { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png' },
    { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png' },
    { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', image: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png' },
    { id: 'stellar', symbol: 'XLM', name: 'Stellar', image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png' },
    { id: 'monero', symbol: 'XMR', name: 'Monero', image: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png' },
    { id: 'ethereum-classic', symbol: 'ETC', name: 'Ethereum Classic', image: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png' },
    { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos Hub', image: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png' },
    { id: 'okb', symbol: 'OKB', name: 'OKB', image: 'https://assets.coingecko.com/coins/images/4463/large/okb_token.png' },
    { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png' },
    { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', image: 'https://assets.coingecko.com/coins/images/3688/large/hbar.png' },
    { id: 'aptos', symbol: 'APT', name: 'Aptos', image: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png' },
    { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', image: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg' },
    { id: 'optimism', symbol: 'OP', name: 'Optimism', image: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png' },
    { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', image: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg' },
    { id: 'vechain', symbol: 'VET', name: 'VeChain', image: 'https://assets.coingecko.com/coins/images/1167/large/VeChain-Logo-768x768.png' },
    { id: 'quant-network', symbol: 'QNT', name: 'Quant', image: 'https://assets.coingecko.com/coins/images/3370/large/5ZOu7brX_400x400.jpg' },
    { id: 'aave', symbol: 'AAVE', name: 'Aave', image: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png' },
    { id: 'algorand', symbol: 'ALGO', name: 'Algorand', image: 'https://assets.coingecko.com/coins/images/4380/large/download.png' },
    { id: 'fantom', symbol: 'FTM', name: 'Fantom', image: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png' },
    { id: 'eos', symbol: 'EOS', name: 'EOS', image: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png' },
    { id: 'tezos', symbol: 'XTZ', name: 'Tezos', image: 'https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png' },
    { id: 'the-graph', symbol: 'GRT', name: 'The Graph', image: 'https://assets.coingecko.com/coins/images/13371/large/Graph_Token.png' },
    { id: 'elrond-erd-2', symbol: 'EGLD', name: 'MultiversX', image: 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png' },
    { id: 'sui', symbol: 'SUI', name: 'Sui', image: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg' },
    { id: 'render-token', symbol: 'RNDR', name: 'Render', image: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png' },
    { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', image: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png' },
    { id: 'pepe', symbol: 'PEPE', name: 'Pepe', image: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg' },
    { id: 'bonk', symbol: 'BONK', name: 'Bonk', image: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg' },
    { id: 'pyth-network', symbol: 'PYTH', name: 'Pyth Network', image: 'https://assets.coingecko.com/coins/images/31924/large/pyth.png' },
    { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', image: 'https://assets.coingecko.com/coins/images/28750/large/JUP.png' },
  ];

  const lowerQuery = query.toLowerCase();
  const results = mockCryptos.filter(
    crypto =>
      crypto.symbol.toLowerCase().includes(lowerQuery) ||
      crypto.name.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);

  return json(results);
}
