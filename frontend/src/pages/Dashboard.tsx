import { useState, useEffect } from 'react';
import { TruckIcon, ComputerDesktopIcon, BuildingOfficeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  totalAssets: number;
  activeVehicles: number;
  facilities: number;
  alerts: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    activeVehicles: 0,
    facilities: 0,
    alerts: 0
  });

  useEffect(() => {
    // TODO: Fetch real data from API
    setStats({
      totalAssets: 1247,
      activeVehicles: 89,
      facilities: 23,
      alerts: 5
    });
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fixed Government Asset Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time monitoring of Liberia government assets</p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Assets"
          value={stats.totalAssets}
          icon={BuildingOfficeIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Vehicles"
          value={stats.activeVehicles}
          icon={TruckIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Facilities"
          value={stats.facilities}
          icon={BuildingOfficeIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Alerts"
          value={stats.alerts}
          icon={ExclamationTriangleIcon}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="bg-green-100 rounded-full p-1">
                <TruckIcon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Vehicle LBR-001 checked in</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              <div className="bg-blue-100 rounded-full p-1">
                <ComputerDesktopIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">IT Device tablet-034 assigned</p>
                <p className="text-xs text-gray-500">12 minutes ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">GPS Tracking</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lantern SOS</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
