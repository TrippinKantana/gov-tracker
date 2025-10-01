import { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOfficeIcon, UsersIcon, TruckIcon, ComputerDesktopIcon, MapPinIcon, CalendarIcon, CurrencyDollarIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Department, departmentService, DepartmentAssets } from '../../services/departmentService';

interface ViewDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
}

const ViewDepartmentModal = ({ isOpen, onClose, department }: ViewDepartmentModalProps) => {
  const [assets, setAssets] = useState<DepartmentAssets | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    if (isOpen && department) {
      fetchAssets();
    }
  }, [isOpen, department]);

  const fetchAssets = async () => {
    if (!department) return;
    
    setLoadingAssets(true);
    try {
      const assetData = await departmentService.getDepartmentAssets(department.id);
      setAssets(assetData);
    } catch (error) {
      console.error('Error fetching department assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'restructuring': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ministry': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'agency': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'bureau': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'commission': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'authority': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen || !department) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {department.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Department Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Header Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getTypeColor(department.type)}`}>
                {department.type.charAt(0).toUpperCase() + department.type.slice(1)}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(department.status)}`}>
                {department.status.charAt(0).toUpperCase() + department.status.slice(1)}
              </span>
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 rounded-full border border-gray-200 dark:border-gray-500">
                Code: {department.code}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Established:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(department.establishedDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Annual Budget:</span>
                <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(department.budget)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Department Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Head of Department
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {department.headOfDepartment.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{department.headOfDepartment}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Department Head</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Contact Information
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`mailto:${department.email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {department.email}
                        </a>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`tel:${department.phone}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {department.phone}
                        </a>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-900 dark:text-white">{department.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Asset Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asset Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <UsersIcon className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{department.employeeCount}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Employees</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <TruckIcon className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{department.vehicleCount}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vehicles</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <BuildingOfficeIcon className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{department.facilityCount}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Facilities</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <ComputerDesktopIcon className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{department.equipmentCount}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Equipment</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Asset Breakdown */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Asset Breakdown</h3>
                
                {loadingAssets ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : assets ? (
                  <div className="space-y-4">
                    {/* Employees Breakdown */}
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="h-5 w-5 text-blue-500" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Employees</h4>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{assets.employees.total}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Active</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{assets.employees.active}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Inactive</span>
                          <span className="text-gray-600 dark:text-gray-400 font-medium">{assets.employees.inactive}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicles Breakdown */}
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <TruckIcon className="h-5 w-5 text-green-500" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Vehicles</h4>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{assets.vehicles.total}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Active</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{assets.vehicles.active}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">In Maintenance</span>
                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">{assets.vehicles.maintenance}</span>
                        </div>
                      </div>
                    </div>

                    {/* Facilities Breakdown */}
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <BuildingOfficeIcon className="h-5 w-5 text-purple-500" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Facilities</h4>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{assets.facilities.total}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Operational</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{assets.facilities.operational}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Maintenance</span>
                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">{assets.facilities.maintenance}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Breakdown */}
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <ComputerDesktopIcon className="h-5 w-5 text-orange-500" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Equipment</h4>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{assets.equipment.total}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Active</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">{assets.equipment.active}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Available</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{assets.equipment.available}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Maintenance</span>
                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">{assets.equipment.maintenance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Failed to load asset details
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDepartmentModal;
