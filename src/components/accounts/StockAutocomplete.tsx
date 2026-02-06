import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StockSymbol {
  symbol: string;
  description: string;
  type: string;
  exchange: string;
}

interface CompanyProfile {
  name: string;
  exchange: string;
  finnhubIndustry: string;
  country: string;
  logo: string;
  weburl: string;
}

interface StockQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High
  l: number; // Low
  o: number; // Open
  pc: number; // Previous close
}

interface StockAutocompleteProps {
  value: string;
  onChange: (symbol: string) => void;
  onSelectStock: (stock: {
    symbol: string;
    name: string;
    exchange: string;
    logo?: string;
    currentPrice?: number;
  }) => void;
  placeholder?: string;
  mode?: 'symbol' | 'name';
}

export function StockAutocomplete({
  value,
  onChange,
  onSelectStock,
  placeholder = 'Search ticker...',
  mode = 'symbol',
}: StockAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

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

  // Search for symbols
  const { data: searchResults, isLoading: isSearching } = useQuery<StockSymbol[]>({
    queryKey: ['stock-search', query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: query.length >= 1 && !selectedSymbol,
    staleTime: 60000,
  });

  // Fetch company profile when symbol is selected
  const { data: profile, isLoading: isLoadingProfile } = useQuery<CompanyProfile>({
    queryKey: ['stock-profile', selectedSymbol],
    queryFn: async () => {
      if (!selectedSymbol) return null;
      const res = await fetch(`/api/stocks/profile?symbol=${encodeURIComponent(selectedSymbol)}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!selectedSymbol,
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });

  // Fetch current price
  const { data: quote } = useQuery<StockQuote>({
    queryKey: ['stock-quote', selectedSymbol],
    queryFn: async () => {
      if (!selectedSymbol) return null;
      const res = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(selectedSymbol)}`);
      if (!res.ok) throw new Error('Failed to fetch quote');
      return res.json();
    },
    enabled: !!selectedSymbol,
    staleTime: 60000,
  });

  // Handle profile and quote data
  useEffect(() => {
    if (profile && selectedSymbol) {
      onSelectStock({
        symbol: selectedSymbol,
        name: profile.name,
        exchange: profile.exchange,
        logo: profile.logo,
        currentPrice: quote?.c,
      });
    }
  }, [profile, quote, selectedSymbol, onSelectStock]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = mode === 'symbol' ? e.target.value.toUpperCase() : e.target.value;
    setQuery(nextValue);
    onChange(nextValue);
    setSelectedSymbol('');
    setIsOpen(true);
  };

  const handleSelectSymbol = (symbol: StockSymbol) => {
    const nextValue = mode === 'symbol' ? symbol.symbol : symbol.description;
    setQuery(nextValue);
    setSelectedSymbol(symbol.symbol);
    onChange(nextValue);
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
          aria-controls="stock-autocomplete-listbox"
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
          id="stock-autocomplete-listbox"
          role="listbox"
          aria-label="Stock search results"
          className="absolute z-50 w-full mt-1 bg-bg-elevated border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {searchResults.map((result) => (
            <button
              key={result.symbol}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handleSelectSymbol(result)}
              className="w-full px-4 py-3 text-left hover:bg-bg-surface transition-colors flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-500">{result.symbol}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {result.description}
                </p>
                <p className="text-xs text-text-muted">
                  {result.exchange} • {result.type}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Stock Preview */}
      {profile && selectedSymbol && (
        <div className="mt-3 p-3 bg-bg-surface rounded-lg border border-border">
          <div className="flex items-center gap-3">
            {profile.logo ? (
              <img
                src={profile.logo}
                alt={profile.name}
                className="w-10 h-10 rounded-lg object-contain bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-500" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-text-primary">{profile.name}</p>
              <p className="text-xs text-text-muted">
                {profile.exchange} • {profile.finnhubIndustry}
              </p>
            </div>
            {quote && (
              <div className="text-right">
                <p className="font-semibold text-text-primary">${quote.c.toFixed(2)}</p>
                <p className={cn(
                  'text-xs',
                  quote.dp >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {quote.dp >= 0 ? '+' : ''}{quote.dp.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
