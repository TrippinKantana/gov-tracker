import { useState, useEffect } from 'react';
import {
    TruckIcon,
    ComputerDesktopIcon,
    BuildingOfficeIcon,
    UsersIcon,
    CubeIcon,
    BuildingLibraryIcon,
    ExclamationTriangleIcon,
    BellIcon,
    ChartBarIcon,
    MapIcon,
    ClockIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
    totalVehicles: number;
    activeVehicles: number;
    totalEquipment: number;
    totalFurniture: number;
    totalFacilities: number;
    totalPersonnel: number;
    totalStock: number;
    lowStockItems: number;
    totalMACs: number;
    activeAlerts: number;
    maintenanceDue: number;
    gpsDevicesActive: number;
}

interface RecentActivity {
    id: string;
    type: 'vehicle' | 'equipment' | 'facility' | 'stock' | 'alert';
    message: string;
    timestamp: string;
    icon: any;
    color: string;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalVehicles: 0,
        activeVehicles: 0,
        totalEquipment: 0,
        totalFurniture: 0,
        totalFacilities: 0,
        totalPersonnel: 0,
        totalStock: 0,
        lowStockItems: 0,
        totalMACs: 0,
        activeAlerts: 0,
        maintenanceDue: 0,
        gpsDevicesActive: 0
    });

    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const buildActivityFeed = (vehicles: any[], equipment: any[], facilities: any[], personnel: any[], stock: any[], lowStock: number) => {
        const activities: RecentActivity[] = [];

        // Vehicle activities
        vehicles.slice(0, 3).forEach((v: any) => {
            activities.push({
                id: `vehicle-${v.id}`,
                type: 'vehicle',
                message: `Vehicle ${v.plateNumber} ${v.status === 'Active' ? 'activated' : 'updated'}`,
                timestamp: v.updatedAt || v.createdAt,
                icon: TruckIcon,
                color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
            });
        });

        // Equipment activities
        equipment.slice(0, 2).forEach((e: any) => {
            activities.push({
                id: `equipment-${e.id}`,
                type: 'equipment',
                message: `${e.name} registered in ${e.department}`,
                timestamp: e.createdAt,
                icon: ComputerDesktopIcon,
                color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
            });
        });

        // Facility activities
        facilities.slice(0, 1).forEach((f: any) => {
            activities.push({
                id: `facility-${f.id}`,
                type: 'facility',
                message: `Facility ${f.name} updated`,
                timestamp: f.updatedAt || f.createdAt,
                icon: BuildingOfficeIcon,
                color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
            });
        });

        // Stock activities
        stock.slice(0, 1).forEach((s: any) => {
            activities.push({
                id: `stock-${s.id}`,
                type: 'stock',
                message: `${s.name} added to warehouse`,
                timestamp: s.createdAt || new Date().toISOString(),
                icon: CubeIcon,
                color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400'
            });
        });

        // Low stock alerts
        if (lowStock > 0) {
            activities.push({
                id: 'alert-low-stock',
                type: 'alert',
                message: `${lowStock} items below minimum stock level`,
                timestamp: new Date().toISOString(),
                icon: ExclamationTriangleIcon,
                color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
            });
        }

        // Sort by timestamp and limit
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivity(activities.slice(0, 15));
    };

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch real data from all APIs
            const [vehiclesRes, equipmentRes, facilitiesRes, personnelRes, stockRes, deptRes] = await Promise.all([
                fetch('/api/vehicles'),
                fetch('/api/equipment'),
                fetch('/api/facilities'),
                fetch('/api/personnel'),
                fetch('/api/stock/inventory'),
                fetch('/api/departments')
            ]);

            const vehicles = vehiclesRes.ok ? (await vehiclesRes.json()).vehicles || [] : [];
            const equipment = equipmentRes.ok ? (await equipmentRes.json()).equipment || [] : [];
            const facilities = facilitiesRes.ok ? (await facilitiesRes.json()).facilities || [] : [];
            const personnel = personnelRes.ok ? (await personnelRes.json()).personnel || [] : [];
            const stock = stockRes.ok ? (await stockRes.json()).stock || [] : [];
            const departments = deptRes.ok ? (await deptRes.json()).departments || [] : [];

            // Calculate statistics
            const activeVehicles = vehicles.filter((v: any) => v.status === 'Active' || v.status === 'active').length;
            const furnitureItems = equipment.filter((e: any) => e.category === 'furniture').length;
            const equipmentItems = equipment.length - furnitureItems;
            const lowStock = stock.filter((s: any) => s.quantity < s.minimumLevel).length;
            const vehiclesWithGPS = vehicles.filter((v: any) => v.gpsTracker).length;

            setStats({
                totalVehicles: vehicles.length,
                activeVehicles,
                totalEquipment: equipmentItems,
                totalFurniture: furnitureItems,
                totalFacilities: facilities.length,
                totalPersonnel: personnel.length,
                totalStock: stock.length,
                lowStockItems: lowStock,
                totalMACs: departments.length,
                activeAlerts: lowStock + 0, // Add other alert types
                maintenanceDue: 0, // TODO: Calculate from maintenance schedules
                gpsDevicesActive: vehiclesWithGPS
            });

            // Fetch comprehensive activity log from audit trail API
            try {
                const activityRes = await fetch('http://localhost:5000/api/activity/recent?limit=15');
                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    if (activityData.success && activityData.activities) {
                        setRecentActivity(activityData.activities);
                    } else {
                        // Fallback to building from other data
                        buildActivityFeed(vehicles, equipment, facilities, personnel, stock, lowStock);
                    }
                } else {
                    buildActivityFeed(vehicles, equipment, facilities, personnel, stock, lowStock);
                }
            } catch (error) {
                console.error('Error loading activity log:', error);
                buildActivityFeed(vehicles, equipment, facilities, personnel, stock, lowStock);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, onClick, subtitle }: {
        title: string;
        value: number | string;
        icon: any;
        color: string;
        onClick?: () => void;
        subtitle?: string;
    }) => (
        <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className={`${color} rounded-lg p-3`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fixed Government Asset Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Real-time overview of Liberia government assets & operations
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-4 w-4 inline mr-1" />
                        Last updated: {new Date().toLocaleTimeString()}
                    </div>
                    <button
                        onClick={() => navigate('/map')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <MapIcon className="h-5 w-5" />
                        <span>Live Map</span>
                    </button>
                </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Assets"
                    value={stats.totalVehicles + stats.totalEquipment + stats.totalFurniture}
                    icon={BuildingOfficeIcon}
                    color="bg-blue-500"
                    subtitle={`Across ${stats.totalMACs} MACs`}
                />
                <StatCard
                    title="Fleet with GPS"
                    value={`${stats.gpsDevicesActive}/${stats.totalVehicles}`}
                    icon={MapIcon}
                    color="bg-green-500"
                    onClick={() => navigate('/map')}
                    subtitle="Real-time tracking active"
                />
                <StatCard
                    title="Facilities"
                    value={stats.totalFacilities}
                    icon={BuildingOfficeIcon}
                    color="bg-purple-500"
                    onClick={() => navigate('/facilities')}
                    subtitle="Government locations"
                />
                <StatCard
                    title="Stock Alerts"
                    value={stats.lowStockItems}
                    icon={ExclamationTriangleIcon}
                    color={stats.lowStockItems > 0 ? "bg-red-500" : "bg-gray-400"}
                    onClick={() => navigate('/stock')}
                    subtitle={stats.lowStockItems > 0 ? "Items need reorder" : "All stock healthy"}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/map')}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
                >
                    <MapIcon className="h-8 w-8 mb-2" />
                    <h3 className="font-bold text-lg mb-1">Track Fleet</h3>
                    <p className="text-sm text-blue-100">Live GPS monitoring</p>
                </button>
                <button
                    onClick={() => navigate('/reports')}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
                >
                    <ChartBarIcon className="h-8 w-8 mb-2" />
                    <h3 className="font-bold text-lg mb-1">Reports</h3>
                    <p className="text-sm text-purple-100">Export data & analytics</p>
                </button>
                <button
                    onClick={() => navigate('/stock')}
                    className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
                >
                    <CubeIcon className="h-8 w-8 mb-2" />
                    <h3 className="font-bold text-lg mb-1">Warehouse</h3>
                    <p className="text-sm text-amber-100">Inventory & releases</p>
                </button>
                <button
                    onClick={() => navigate('/notifications')}
                    className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
                >
                    <BellIcon className="h-8 w-8 mb-2" />
                    <h3 className="font-bold text-lg mb-1">Alerts</h3>
                    <p className="text-sm text-red-100">{stats.activeAlerts} active</p>
                </button>
            </div>

            {/* Asset Categories Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Asset Categories</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div
                            onClick={() => navigate('/vehicles')}
                            className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                            <TruckIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalVehicles}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Vehicles</p>
                        </div>
                        <div
                            onClick={() => navigate('/equipments')}
                            className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <ComputerDesktopIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalEquipment}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Equipment</p>
                        </div>
                        <div
                            onClick={() => navigate('/equipments')}
                            className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                            <CubeIcon className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalFurniture}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Furniture</p>
                        </div>
                        <div
                            onClick={() => navigate('/facilities')}
                            className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                        >
                            <BuildingOfficeIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalFacilities}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Facilities</p>
                        </div>
                        <div
                            onClick={() => navigate('/personnel')}
                            className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                        >
                            <UsersIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalPersonnel}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Personnel</p>
                        </div>
                        <div
                            onClick={() => navigate('/departments')}
                            className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                            <BuildingLibraryIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalMACs}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">MACs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity - 2 columns */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                                <ChartBarIcon className="h-6 w-6" />
                                <span>Audit Trail - Recent Activity</span>
                            </h2>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {recentActivity.length} activities
                                </span>
                                <button
                                    onClick={loadDashboardData}
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p>No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.map((activity) => {
                                    const IconComponent = activity.icon;
                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <div className={`${activity.color} rounded-full p-2`}>
                                                <IconComponent className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.message}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* System Status - 1 column */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Status</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">GPS Tracking</span>
                            <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-3 py-1 rounded-full font-medium">
                                ✓ Online
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                            <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-3 py-1 rounded-full font-medium">
                                ✓ Online
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Lantern SOS</span>
                            <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-3 py-1 rounded-full font-medium">
                                ✓ Connected
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Active GPS Devices</span>
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-3 py-1 rounded-full font-medium">
                                {stats.gpsDevicesActive} / {stats.totalVehicles}
                            </span>
                        </div>

                        {/* Quick Actions */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => navigate('/map')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    📍 View Live Map
                                </button>
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    📊 Generate Report
                                </button>
                                <button
                                    onClick={() => navigate('/notifications')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    🔔 View Alerts ({stats.activeAlerts})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fleet Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <TruckIcon className="h-6 w-6" />
                            <span>Fleet Overview</span>
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeVehicles}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalVehicles - stats.activeVehicles}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Parked/Maintenance</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.gpsDevicesActive}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">GPS Tracked</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.totalVehicles - stats.gpsDevicesActive}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">No GPS</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/vehicles')}
                            className="mt-4 w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            View All Vehicles →
                        </button>
                    </div>
                </div>

                {/* Assets Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <ComputerDesktopIcon className="h-6 w-6" />
                            <span>Assets Overview</span>
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Office Equipment</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalEquipment}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Office Furniture</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalFurniture}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock Items</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalStock}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">Low Stock Alert</span>
                                <span className="text-lg font-bold text-red-600 dark:text-red-400">{stats.lowStockItems}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/equipments')}
                            className="mt-4 w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Manage Assets →
                        </button>
                    </div>
                </div>
            </div>

            {/* MAC Distribution & Stock Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* MAC Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <BuildingLibraryIcon className="h-6 w-6" />
                            <span>MAC Distribution</span>
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total MACs/Departments</span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMACs}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Personnel</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalPersonnel}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Assets per MAC</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {stats.totalMACs > 0 ? Math.round((stats.totalVehicles + stats.totalEquipment + stats.totalFurniture) / stats.totalMACs) : 0}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/departments')}
                            className="mt-6 w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            View MACs →
                        </button>
                    </div>
                </div>

                {/* Stock & Warehouse Status */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <CubeIcon className="h-6 w-6" />
                            <span>Stock & Warehouse</span>
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Stock Items</span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStock}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">⚠️ Low Stock</span>
                                <span className="text-lg font-bold text-red-600 dark:text-red-400">{stats.lowStockItems}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">✓ Available</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.totalStock - stats.lowStockItems}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/stock')}
                            className="mt-6 w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Manage Stock →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
