import type { APIRoute } from 'astro';
import { json, error } from '@/lib/api/response';

/**
 * GET /api/crypto/profile?id=bitcoin
 * Get cryptocurrency details including logo
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return error('Crypto ID is required', 400);
  }

  // Return mock data
  return getMockProfile(id);
};

// Mock profiles for common cryptocurrencies
function getMockProfile(id: string) {
  const mockProfiles: Record<string, any> = {
    bitcoin: { name: 'Bitcoin', symbol: 'BTC', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', coingeckoId: 'bitcoin' },
    ethereum: { name: 'Ethereum', symbol: 'ETH', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', coingeckoId: 'ethereum' },
    tether: { name: 'Tether', symbol: 'USDT', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', coingeckoId: 'tether' },
    binancecoin: { name: 'BNB', symbol: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', coingeckoId: 'binancecoin' },
    solana: { name: 'Solana', symbol: 'SOL', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', coingeckoId: 'solana' },
    ripple: { name: 'XRP', symbol: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', coingeckoId: 'ripple' },
    'usd-coin': { name: 'USDC', symbol: 'USDC', image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png', coingeckoId: 'usd-coin' },
    cardano: { name: 'Cardano', symbol: 'ADA', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', coingeckoId: 'cardano' },
    dogecoin: { name: 'Dogecoin', symbol: 'DOGE', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', coingeckoId: 'dogecoin' },
    'avalanche-2': { name: 'Avalanche', symbol: 'AVAX', image: 'https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png', coingeckoId: 'avalanche-2' },
    tron: { name: 'TRON', symbol: 'TRX', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', coingeckoId: 'tron' },
    chainlink: { name: 'Chainlink', symbol: 'LINK', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', coingeckoId: 'chainlink' },
    polkadot: { name: 'Polkadot', symbol: 'DOT', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', coingeckoId: 'polkadot' },
    polygon: { name: 'Polygon', symbol: 'MATIC', image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png', coingeckoId: 'polygon' },
    litecoin: { name: 'Litecoin', symbol: 'LTC', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', coingeckoId: 'litecoin' },
    'shiba-inu': { name: 'Shiba Inu', symbol: 'SHIB', image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png', coingeckoId: 'shiba-inu' },
    'bitcoin-cash': { name: 'Bitcoin Cash', symbol: 'BCH', image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png', coingeckoId: 'bitcoin-cash' },
    uniswap: { name: 'Uniswap', symbol: 'UNI', image: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png', coingeckoId: 'uniswap' },
    stellar: { name: 'Stellar', symbol: 'XLM', image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png', coingeckoId: 'stellar' },
    monero: { name: 'Monero', symbol: 'XMR', image: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png', coingeckoId: 'monero' },
    cosmos: { name: 'Cosmos Hub', symbol: 'ATOM', image: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png', coingeckoId: 'cosmos' },
    filecoin: { name: 'Filecoin', symbol: 'FIL', image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png', coingeckoId: 'filecoin' },
    aptos: { name: 'Aptos', symbol: 'APT', image: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png', coingeckoId: 'aptos' },
    arbitrum: { name: 'Arbitrum', symbol: 'ARB', image: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg', coingeckoId: 'arbitrum' },
    optimism: { name: 'Optimism', symbol: 'OP', image: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png', coingeckoId: 'optimism' },
    near: { name: 'NEAR Protocol', symbol: 'NEAR', image: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg', coingeckoId: 'near' },
    aave: { name: 'Aave', symbol: 'AAVE', image: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png', coingeckoId: 'aave' },
    sui: { name: 'Sui', symbol: 'SUI', image: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg', coingeckoId: 'sui' },
  };

  const profile = mockProfiles[id.toLowerCase()] || {
    name: id.charAt(0).toUpperCase() + id.slice(1),
    symbol: id.toUpperCase(),
    image: `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`,
    coingeckoId: id.toLowerCase(),
  };

  return json(profile);
}
