import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, MapIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Gov Asset Tracker</h1>
            <span className="text-blue-200 text-sm">Liberia GSA</span>
          </div>
          
          <div className="flex space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive('/') ? 'bg-blue-800' : 'hover:bg-blue-800'
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/map"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive('/map') ? 'bg-blue-800' : 'hover:bg-blue-800'
              }`}
            >
              <MapIcon className="h-5 w-5" />
              <span>Live Map</span>
            </Link>
            
            <Link
              to="/assets"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActive('/assets') ? 'bg-blue-800' : 'hover:bg-blue-800'
              }`}
            >
              <BuildingOfficeIcon className="h-5 w-5" />
              <span>Assets</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
