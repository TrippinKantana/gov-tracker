import { Link, useLocation } from 'react-router-dom';
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
    XMarkIcon
} from '@heroicons/react/24/outline';

interface MobileNavProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
    const location = useLocation();
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

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
                onClick={onClose}
            />

            {/* Mobile Nav */}
            <div className="fixed left-0 top-0 w-64 h-full bg-white dark:bg-gray-800 z-[60] lg:hidden transform transition-transform duration-300 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">GSA</h1>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                            {isDepartmentAdmin ?
                                (user?.department ? `${user.department} Admin` : 'Department Admin') :
                                'General Services Agency'
                            }
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={onClose}
                                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.path)
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.count !== undefined && item.path === '/notifications' && (
                                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">
                                            {item.count}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </>
    );
};

export default MobileNav;
