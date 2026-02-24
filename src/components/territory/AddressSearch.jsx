import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { searchAddress } from '../../utils/geocoding';

const AddressSearch = ({ onLocationSelect, className = '' }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const debounceTimer = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (query.length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new timer
        debounceTimer.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const searchResults = await searchAddress(query, {
                    limit: 8,
                    countrycodes: 'ar' // Argentina
                });
                setResults(searchResults);
                setIsOpen(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms debounce

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query]);

    const handleSelect = (result) => {
        setQuery(result.displayName);
        setIsOpen(false);
        onLocationSelect({
            lat: result.lat,
            lon: result.lon,
            displayName: result.displayName,
            boundingBox: result.boundingBox
        });
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar dirección..."
                    className="w-full pl-10 pr-10 py-3 bg-white/90 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-[1000]">
                    {results.map((result, index) => (
                        <button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className={`w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 ${index === selectedIndex ? 'bg-green-50' : ''
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {result.address.road || result.address.city || 'Sin nombre'}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">
                                        {result.displayName}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && query.length >= 3 && results.length === 0 && !isLoading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-2xl p-4 z-[1000]">
                    <p className="text-sm text-gray-600 text-center">
                        No se encontraron resultados
                    </p>
                </div>
            )}
        </div>
    );
};

export default AddressSearch;
