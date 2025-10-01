import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  SunIcon, 
  MoonIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  TruckIcon,
  ComputerDesktopIcon,
  BuildingOfficeIcon,
  UsersIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import NotificationCenter from './NotificationCenter';
import AuthStatus from './auth/Auth0Status';
import MobileNav from './MobileNav';

interface SearchResult {
  id: string;
  name: string;
  type: 'vehicle' | 'equipment' | 'facility' | 'employee';
  category: string;
  department?: string;
  location?: string;
  status?: string;
  plateNumber?: string;
  serialNumber?: string;
}

const AppHeader = () => {
  const { isDarkMode, toggleDarkMode } = useApp();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!query) return;
    
    setIsSearching(true);
    try {
      // Use the new global search API
      const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}&limit=15`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.results);
          setShowSearchResults(data.results.length > 0);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } else {
        console.error('Search API error:', response.status);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    // Navigate to appropriate page based on result type
    switch (result.type) {
      case 'vehicle':
        navigate('/vehicles');
        break;
      case 'equipment':
        navigate('/equipments');
        break;
      case 'facility':
        navigate('/facilities');
        break;
      case 'employee':
        navigate('/employees');
        break;
    }
    
    setSearchQuery('');
    setShowSearchResults(false);
    
    // Could also trigger opening the specific detail modal
    // This would require additional props/context to communicate with the page components
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'vehicle': return <TruckIcon className="h-5 w-5 text-green-600" />;
      case 'equipment': return <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />;
      case 'facility': return <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />;
      case 'employee': return <UsersIcon className="h-5 w-5 text-orange-600" />;
      default: return <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'operational':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
      case 'maintenance':
      case 'under_construction':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'retired':
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Left side - Search */}
          <div className="flex-1 max-w-2xl relative ml-2 lg:ml-0" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search vehicles, equipment, facilities, employees..."
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Searching...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center">
                  <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                    >
                      <div className="flex-shrink-0">
                        {getResultIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.name}
                          </h4>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                            {result.category}
                          </span>
                          {result.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(result.status)}`}>
                              {result.status}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          {result.department && <span>{result.department}</span>}
                          {result.location && <span>{result.location}</span>}
                          {result.plateNumber && <span>Plate: {result.plateNumber}</span>}
                          {result.serialNumber && <span>SN: {result.serialNumber}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {searchResults.length >= 10 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing first 10 results. Use more specific terms to narrow your search.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Notification Center */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
          </button>

          {/* Authentication Status */}
          <AuthStatus />
        </div>
      </div>

      {/* Search Results Overlay for Mobile */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 max-h-80 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Search Results ({searchResults.length})
            </h3>
            <div className="space-y-2">
              {searchResults.slice(0, 5).map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getResultIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {result.name}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {result.category} • {result.department}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      </header>

      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
    </>
  );
};

export default AppHeader;
