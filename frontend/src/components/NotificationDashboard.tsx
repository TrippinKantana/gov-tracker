import { useState, useEffect } from 'react';
import { 
  BellIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  TruckIcon,
  ComputerDesktopIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { filterByDepartment, getEmptyStateMessage, isDepartmentAdmin, hasValidMACAssignment } from '../utils/departmentFilter';

interface Notification {
  id: string;
  type: 'security' | 'maintenance' | 'system' | 'assignment' | 'compliance';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
  // Additional properties used in the component
  isRead?: boolean;
  createdAt?: Date;
  category?: 'vehicle' | 'equipment' | 'facility' | 'system';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  assetName?: string;
  department?: string;
  metadata?: {
    daysOverdue?: number;
  };
}

interface NotificationSettings {
  enableSound: boolean;
  enableEmail: boolean;
  enableDesktop: boolean;
  soundVolume: number;
  emailRecipients: string[];
  maintenanceThresholds: {
    vehicleMaintenanceDays: number;
    equipmentMaintenanceDays: number;
    facilityInspectionDays: number;
    vehicleMileageInterval: number;
  };
}

const NotificationDashboard = () => {
  const { user } = useAuth();
  const { notifications: contextNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState<NotificationSettings>({
    enableSound: true,
    enableEmail: true,
    enableDesktop: true,
    soundVolume: 0.7,
    emailRecipients: [],
    maintenanceThresholds: {
      vehicleMaintenanceDays: 90,
      equipmentMaintenanceDays: 180,
      facilityInspectionDays: 365,
      vehicleMileageInterval: 5000
    }
  });

  // Mock notification service
  const notificationService = {
    updateSettings: (newSettings: NotificationSettings) => {
      console.log('Settings updated:', newSettings);
      // In a real app, this would save to backend
    },
    createTestNotification: (type: string) => {
      console.log(`Creating test ${type} notification`);
      // In a real app, this would create a test notification
    },
    getNotifications: () => contextNotifications,
    getSettings: () => settings,
    markAsRead: (id: string) => {
      markAsRead(id);
    },
    dismissNotification: (id: string) => {
      console.log('Dismissing notification:', id);
      // In a real app, this would dismiss the notification
    }
  };

  // First filter by user's department/MAC access
  const departmentFilteredNotifications = filterByDepartment(contextNotifications, user);
  
  const filteredNotifications = departmentFilteredNotifications.filter(notification => {
    if (activeFilter === 'unread') return !notification.read;
    if (activeFilter === 'critical') return notification.priority === 'urgent';
    return true;
  });

  const stats = {
    total: departmentFilteredNotifications.length,
    unread: departmentFilteredNotifications.filter(n => !n.read).length,
    critical: departmentFilteredNotifications.filter(n => n.priority === 'urgent').length,
    vehicles: departmentFilteredNotifications.filter(n => n.type === 'security').length,
    equipment: departmentFilteredNotifications.filter(n => n.type === 'maintenance').length,
    facilities: departmentFilteredNotifications.filter(n => n.type === 'system').length
  };

  const handleSettingsUpdate = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    notificationService.updateSettings(updatedSettings);
  };

  const addEmailRecipient = () => {
    if (emailRecipient && emailRecipient.includes('@')) {
      const newRecipients = [...settings.emailRecipients, emailRecipient];
      handleSettingsUpdate({ emailRecipients: newRecipients });
      setEmailRecipient('');
    }
  };

  const removeEmailRecipient = (email: string) => {
    const newRecipients = settings.emailRecipients.filter(e => e !== email);
    handleSettingsUpdate({ emailRecipients: newRecipients });
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300';
      case 'low': return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300';
      default: return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300';
    }
  };

  // Check if department admin has no MAC assignment
  if (isDepartmentAdmin(user) && !hasValidMACAssignment(user)) {
    const emptyState = getEmptyStateMessage(user, 'Notifications');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-yellow-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{emptyState.title}</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">{emptyState.message}</p>
          {emptyState.showContactAdmin && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>Contact your Super Admin</strong> to get assigned to your MAC.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {isDepartmentAdmin(user) ? `${user?.department} Notifications` : 'Notification Center'}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Manage maintenance alerts and system notifications</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              showFilters 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              showSettings 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Notifications</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Filter Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Type</label>
                <div className="space-y-2">
                  {[
                    { key: 'all', label: 'All Notifications' },
                    { key: 'unread', label: 'Unread Only' },
                    { key: 'critical', label: 'Critical Only' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="radio"
                        name="filterType"
                        value={key}
                        checked={activeFilter === key}
                        onChange={() => setActiveFilter(key as any)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">All Categories</option>
                  <option value="vehicle">Vehicle Alerts</option>
                  <option value="facility">Facility Alerts</option>
                  <option value="equipment">Equipment Alerts</option>
                  <option value="system">System Alerts</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Severity Level</label>
                <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">All Severities</option>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setActiveFilter('all')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel - Positioned above statistics */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Settings</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <div>
                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">General Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Sound Alerts</span>
                    <input
                      type="checkbox"
                      checked={settings.enableSound}
                      onChange={(e) => handleSettingsUpdate({ enableSound: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.enableEmail}
                      onChange={(e) => handleSettingsUpdate({ enableEmail: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Desktop Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.enableDesktop}
                      onChange={(e) => handleSettingsUpdate({ enableDesktop: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Sound Volume: {Math.round(settings.soundVolume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.soundVolume}
                      onChange={(e) => handleSettingsUpdate({ soundVolume: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Government Email Recipients */}
              <div>
                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Government Email Recipients</h4>
                
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    <strong>Government Email Configuration:</strong> Currently in mock mode. Configure government SMTP server in production environment.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="Enter government email address (e.g., admin@gov.lr)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={addEmailRecipient}
                      disabled={!emailRecipient || !emailRecipient.includes('@')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {settings.emailRecipients.map((email) => (
                      <div key={email} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <EnvelopeIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{email}</span>
                        </div>
                        <button
                          onClick={() => removeEmailRecipient(email)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    
                    {settings.emailRecipients.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No email recipients configured
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Thresholds */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Maintenance Alert Thresholds</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Maintenance (days)
                  </label>
                  <input
                    type="number"
                    value={settings.maintenanceThresholds.vehicleMaintenanceDays}
                    onChange={(e) => handleSettingsUpdate({
                      maintenanceThresholds: {
                        ...settings.maintenanceThresholds,
                        vehicleMaintenanceDays: parseInt(e.target.value) || 90
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Equipment Maintenance (days)
                  </label>
                  <input
                    type="number"
                    value={settings.maintenanceThresholds.equipmentMaintenanceDays}
                    onChange={(e) => handleSettingsUpdate({
                      maintenanceThresholds: {
                        ...settings.maintenanceThresholds,
                        equipmentMaintenanceDays: parseInt(e.target.value) || 180
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Facility Inspections (days)
                  </label>
                  <input
                    type="number"
                    value={settings.maintenanceThresholds.facilityInspectionDays}
                    onChange={(e) => handleSettingsUpdate({
                      maintenanceThresholds: {
                        ...settings.maintenanceThresholds,
                        facilityInspectionDays: parseInt(e.target.value) || 365
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Mileage (km)
                  </label>
                  <input
                    type="number"
                    value={settings.maintenanceThresholds.vehicleMileageInterval}
                    onChange={(e) => handleSettingsUpdate({
                      maintenanceThresholds: {
                        ...settings.maintenanceThresholds,
                        vehicleMileageInterval: parseInt(e.target.value) || 5000
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Test Notifications */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Test Notification System</h4>
              <div className="flex flex-wrap gap-3 mb-3">
                <button
                  onClick={() => notificationService.createTestNotification('vehicle')}
                  className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Test Vehicle Alert
                </button>
                <button
                  onClick={() => notificationService.createTestNotification('equipment')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Test Equipment Alert
                </button>
                <button
                  onClick={() => notificationService.createTestNotification('facility')}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Test Facility Alert
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    localStorage.removeItem('notifications');
                    window.location.reload();
                  }}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Clear All Notifications
                </button>
                <button
                  onClick={() => {
                    console.log('Current notifications:', notificationService.getNotifications());
                    console.log('Settings:', notificationService.getSettings());
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Debug Info
                </button>
              </div>
            </div>

            {/* Settings Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <BellIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.unread}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vehicles</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.vehicles}</p>
            </div>
            <TruckIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Equipment</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.equipment}</p>
            </div>
            <ComputerDesktopIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Facilities</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.facilities}</p>
            </div>
            <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>



      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">All Clear!</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeFilter === 'all' ? 'No notifications to display' :
               activeFilter === 'unread' ? 'No unread notifications' :
               'No critical alerts'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div
              key={notification.id}
              className={`p-4 lg:p-6 ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
              >
              <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0">
              {notification.category === 'vehicle' && <TruckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />}
              {notification.category === 'equipment' && <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />}
              {notification.category === 'facility' && <BuildingOfficeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />}
              </div>

              {/* Content */}
              <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {notification.title}
              </h3>
              <div className="flex items-center space-x-2">
              <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full border ${getSeverityColor(notification.severity)}`}>
                  {notification.severity.toUpperCase()}
                </span>
              {!notification.isRead && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                  )}
                       </div>
                     </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      
                      <span className="font-medium text-gray-900 dark:text-white">
                        {notification.assetName}
                      </span>
                      
                      {notification.department && (
                        <span>{notification.department}</span>
                      )}
                      
                      {notification.metadata?.daysOverdue && (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {notification.metadata.daysOverdue} days overdue
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions - Responsive */}
                  <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  {!notification.isRead && (
                  <button
                  onClick={() => notificationService.markAsRead(notification.id)}
                  className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
                  >
                  Mark Read
                  </button>
                  )}
                  
                  <button
                  onClick={() => notificationService.dismissNotification(notification.id)}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
                  >
                  Dismiss
                  </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDashboard;
