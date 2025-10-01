import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import {
    HomeIcon,
    MapIcon,
    UsersIcon,
    TruckIcon,
    BuildingOfficeIcon,
    ComputerDesktopIcon,
    BuildingLibraryIcon,
    BellIcon,
    DocumentArrowDownIcon,
    CubeIcon,
    Bars3Icon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
    const location = useLocation();
    const { isSidebarCollapsed, toggleSidebar } = useApp();
    const { user } = useAuth();
    
    // Temporary fallback count until notification system is fully integrated
    const unreadCount = 2;

    const isActive = (path: string) => location.pathname === path;

    // Check user roles
    const isSuperAdmin = user?.roles.includes('super_admin') || user?.roles.includes('admin')
    const isITAdmin = user?.roles.includes('it_admin') || user?.roles.includes('system_admin')
    const isDepartmentAdmin = user?.roles.includes('department_admin') || user?.roles.includes('mac_admin')

    // Different menu items based on role
    const superAdminMenuItems = [
        { path: '/', label: 'Dashboard', icon: HomeIcon },
        { path: '/map', label: 'Live Map', icon: MapIcon },
        { path: '/notifications', label: 'Notifications', icon: BellIcon, count: unreadCount },
        { path: '/reports', label: 'Reports', icon: DocumentArrowDownIcon },
        { path: '/stock', label: 'Stock Inventory', icon: CubeIcon },
        { path: '/departments', label: 'MACs', icon: BuildingLibraryIcon },
        { path: '/personnel', label: 'Personnel', icon: UsersIcon },
        { path: '/vehicles', label: 'Fleet', icon: TruckIcon },
        { path: '/facilities', label: 'Facilities', icon: BuildingOfficeIcon },
        { path: '/equipments', label: 'Assets', icon: ComputerDesktopIcon },
    ];

    const departmentAdminMenuItems = [
        { path: '/', label: 'Dashboard', icon: HomeIcon },
        { path: '/map', label: 'Department Map', icon: MapIcon },
        { path: '/notifications', label: 'Notifications', icon: BellIcon, count: unreadCount },
        { path: '/reports', label: 'Reports', icon: DocumentArrowDownIcon },
        { path: '/personnel', label: 'Department Personnel', icon: UsersIcon },
        { path: '/vehicles', label: 'Department Fleet', icon: TruckIcon },
        { path: '/facilities', label: 'Department Facilities', icon: BuildingOfficeIcon },
        { path: '/equipments', label: 'Department Assets', icon: ComputerDesktopIcon },
    ];

    // Select menu items based on role
    const menuItems = (isSuperAdmin || isITAdmin) ? superAdminMenuItems :
        isDepartmentAdmin ? departmentAdminMenuItems :
            superAdminMenuItems; // fallback

    return (
        <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'
            } hidden lg:flex fixed left-0 top-0 transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col h-screen z-40`}>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                {!isSidebarCollapsed && (
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">GSA</h1>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                            {isDepartmentAdmin ?
                                (user?.department ? `${user.department} Admin` : 'Department Admin') :
                                'General Services Agency'
                            }
                        </span>
                    </div>
                )}

                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {isSidebarCollapsed ? (
                        <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                        <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`relative flex items-center transition-colors rounded-lg ${isSidebarCollapsed
                                    ? 'justify-center px-3 py-3'
                                    : 'justify-between px-3 py-2'
                                } ${isActive(item.path)
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                                <IconComponent className="h-5 w-5 flex-shrink-0" />
                                {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
                            </div>

                            {/* Count badge - Only for notifications */}
                            {item.count !== undefined && item.path === '/notifications' && !isSidebarCollapsed && (
                                <span className="h-6 w-auto px-2 text-xs bg-red-500 text-white rounded-full flex items-center justify-center font-medium">
                                    {item.count}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {!isSidebarCollapsed && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        <p className="font-medium">Liberia Government</p>
                        <p>Asset Tracking System</p>
                        <p className="mt-2 text-blue-600 dark:text-blue-400">Version 1.0</p>
                    </div>
                )}

                {isSidebarCollapsed && (
                    <div className="text-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg mx-auto flex items-center justify-center">
                            <span className="text-white text-xs font-bold">LR</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
