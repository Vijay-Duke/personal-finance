import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CryptoSymbol {
  id: string;
  symbol: string;
  name: string;
  image: string;
}

interface CryptoProfile {
  name: string;
  symbol: string;
  image: string;
  coingeckoId: string;
}

interface CryptoQuote {
  currentPrice: number;
  change: number;
  changePercent: number;
}

interface CryptoAutocompleteProps {
  value: string;
  onChange: (symbol: string) => void;
  onSelectCrypto: (crypto: {
    symbol: string;
    name: string;
    coingeckoId: string;
    logo?: string;
    currentPrice?: number;
  }) => void;
  placeholder?: string;
}

export function CryptoAutocomplete({
  value,
  onChange,
  onSelectCrypto,
  placeholder = 'Search crypto...',
}: CryptoAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for cryptocurrencies
  const { data: searchResults, isLoading: isSearching } = useQuery<CryptoSymbol[]>({
    queryKey: ['crypto-search', query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      const res = await fetch(`/api/crypto/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: query.length >= 1 && !selectedId,
    staleTime: 60000,
  });

  // Fetch profile when crypto is selected
  const { data: profile, isLoading: isLoadingProfile } = useQuery<CryptoProfile>({
    queryKey: ['crypto-profile', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await fetch(`/api/crypto/profile?id=${encodeURIComponent(selectedId)}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!selectedId,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Fetch current price
  const { data: quote } = useQuery<CryptoQuote>({
    queryKey: ['crypto-quote', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await fetch(`/api/crypto/quote?id=${encodeURIComponent(selectedId)}`);
      if (!res.ok) throw new Error('Failed to fetch quote');
      return res.json();
    },
    enabled: !!selectedId,
    staleTime: 60000,
  });

  // Handle profile and quote data
  useEffect(() => {
    if (profile && selectedId) {
      onSelectCrypto({
        symbol: profile.symbol,
        name: profile.name,
        coingeckoId: profile.coingeckoId,
        logo: profile.image,
        currentPrice: quote?.currentPrice,
      });
    }
  }, [profile, quote, selectedId, onSelectCrypto]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setQuery(newValue);
    onChange(newValue);
    setSelectedId('');
    setIsOpen(true);
  };

  const handleSelectCrypto = (crypto: CryptoSymbol) => {
    setQuery(crypto.symbol);
    setSelectedId(crypto.id);
    onChange(crypto.symbol);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 1 && setIsOpen(true)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen && searchResults && searchResults.length > 0}
          aria-controls="crypto-autocomplete-listbox"
          aria-autocomplete="list"
          className={cn(
            'w-full h-10 pl-10 pr-10 rounded-md border border-input bg-background',
            'text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'placeholder:text-text-muted'
          )}
          autoComplete="off"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-text-muted" />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && searchResults && searchResults.length > 0 && (
        <div
          id="crypto-autocomplete-listbox"
          role="listbox"
          aria-label="Cryptocurrency search results"
          className="absolute z-50 w-full mt-1 bg-bg-elevated border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {searchResults.map((result) => (
            <button
              key={result.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handleSelectCrypto(result)}
              className="w-full px-4 py-3 text-left hover:bg-bg-surface transition-colors flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center overflow-hidden">
                {result.image ? (
                  <img
                    src={result.image}
                    alt={result.symbol}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs font-bold text-primary-500">{result.symbol.slice(0, 2)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {result.name}
                </p>
                <p className="text-xs text-text-muted">
                  {result.symbol}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Crypto Preview */}
      {profile && selectedId && (
        <div className="mt-3 p-3 bg-bg-surface rounded-lg border border-border">
          <div className="flex items-center gap-3">
            {profile.image ? (
              <img
                src={profile.image}
                alt={profile.symbol}
                className="w-10 h-10 rounded-lg object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-500">{profile.symbol.slice(0, 2)}</span>
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-text-primary">{profile.name}</p>
              <p className="text-xs text-text-muted">{profile.symbol}</p>
            </div>
            {quote && (
              <div className="text-right">
                <p className="font-semibold text-text-primary">${quote.currentPrice.toLocaleString()}</p>
                <p className={cn(
                  'text-xs',
                  quote.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
