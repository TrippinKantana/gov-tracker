import { useState, useEffect } from 'react';
import { XMarkIcon, BuildingLibraryIcon, UsersIcon, TruckIcon, ComputerDesktopIcon, BuildingOfficeIcon, MapIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface ViewDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string | null;
  onEdit?: (departmentId: string) => void;
  onDelete?: (departmentId: string) => void;
  onViewOnMap?: (departmentId: string) => void;
}

interface DepartmentDetails {
  id: string;
  name: string;
  code: string;
  type: string;
  headOfDepartment: string;
  email: string;
  phone: string;
  address: string;
  budget: number;
  status: string;
  establishedDate: string;
  // Dynamic counts from real data
  employeeCount: number;
  vehicleCount: number;
  facilityCount: number;
  equipmentCount: number;
  createdAt?: string;
}

const ViewDepartmentModal = ({ isOpen, onClose, departmentId, onEdit, onDelete, onViewOnMap }: ViewDepartmentModalProps) => {
  const [department, setDepartment] = useState<DepartmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'budget' | 'contact'>('overview');

  useEffect(() => {
    if (isOpen && departmentId) {
      fetchDepartmentDetails();
      setActiveTab('overview'); // Reset to overview when opening
    }
  }, [isOpen, departmentId]);

  const fetchDepartmentDetails = async () => {
    if (!departmentId) return;
    
    setIsLoading(true);
    setError('');
    try {
      // Fetch department details and calculate real asset counts
      const [deptResponse, vehiclesResponse, facilitiesResponse, equipmentResponse, employeesResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/departments/${departmentId}`),
        fetch('http://localhost:5000/api/vehicles'),
        fetch('http://localhost:5000/api/facilities'),
        fetch('http://localhost:5000/api/equipment'),
        fetch('http://localhost:5000/api/employees')
      ]);

      const deptResult = await deptResponse.json();
      const vehiclesResult = await vehiclesResponse.json();
      const facilitiesResult = await facilitiesResponse.json();
      const equipmentResult = await equipmentResponse.json();
      const employeesResult = await employeesResponse.json();

      let departmentData;
      
      if (deptResult.success) {
        departmentData = deptResult.department;
      } else {
        // Fallback to mock data based on departmentId
        const mockDepartments = [
          {
            id: 'DEPT001',
            name: 'Ministry of Health',
            code: 'MOH',
            type: 'ministry',
            headOfDepartment: 'Dr. Sarah Johnson',
            email: 'info@health.gov.lr',
            phone: '+231-555-0101',
            address: 'Capitol Hill, Monrovia',
            budget: 25000000,
            status: 'active',
            establishedDate: '1847-07-26'
          }
        ];
        departmentData = mockDepartments.find(d => d.id === departmentId) || mockDepartments[0];
      }

      // Calculate real asset counts for this department
      const departmentName = departmentData.name;
      
      const vehicleCount = vehiclesResult.success ? 
        vehiclesResult.vehicles?.filter((v: any) => v.department === departmentName).length || 0 : 0;
      
      const facilityCount = facilitiesResult.success ? 
        facilitiesResult.facilities?.filter((f: any) => f.department === departmentName).length || 0 : 0;
      
      const equipmentCount = equipmentResult.success ? 
        equipmentResult.equipment?.filter((e: any) => e.department === departmentName).length || 0 : 0;
      
      const employeeCount = employeesResult.success ? 
        employeesResult.employees?.filter((emp: any) => emp.department === departmentName).length || 0 : 0;

      const departmentWithCounts = {
        ...departmentData,
        employeeCount,
        vehicleCount,
        facilityCount,
        equipmentCount
      };

      console.log(`📊 ${departmentName} real counts:`, {
        employees: employeeCount,
        vehicles: vehicleCount,
        facilities: facilityCount,
        equipment: equipmentCount
      });

      setDepartment(departmentWithCounts);
    } catch (error) {
      console.error('Error fetching department details:', error);
      setError('Failed to load department details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'restructuring': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ministry': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'agency': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'bureau': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <BuildingLibraryIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">MACs Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ministries, Agencies, and Commissions information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading MAC details...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {department && (
              <>
                {/* MAC Header Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                        <BuildingLibraryIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{department.name}</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{department.code} • {department.type}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Head: {department.headOfDepartment}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(department.type)}`}>
                        {department.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(department.status)}`}>
                        {department.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('assets')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'assets'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Assets & Resources
                    </button>
                    <button
                      onClick={() => setActiveTab('budget')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'budget'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Budget & Finance
                    </button>
                    <button
                      onClick={() => setActiveTab('contact')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'contact'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Contact & Location
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Main Content Area */}
                  <div className="lg:col-span-3">
                    
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* MAC Details */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">MAC Information</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">MAC Type</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">{department.type}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">MAC Code</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white font-mono">{department.code}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Head of MAC</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{department.headOfDepartment}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(department.status)}`}>
                                    {department.status}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Established</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                  {department.establishedDate ? new Date(department.establishedDate).getFullYear() : 'Unknown'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Employees</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                  {department.employeeCount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Assets Tab */}
                    {activeTab === 'assets' && (
                    <div className="space-y-6">
                      {/* Asset Summary */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asset Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                        <UsersIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {department.employeeCount}
                      </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                      </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                        <TruckIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {department.vehicleCount}
                      </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Vehicles</p>
                    </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                            <BuildingOfficeIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {department.facilityCount}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Facilities</p>
                            </div>

                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                              <ComputerDesktopIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {department.equipmentCount}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Equipment</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Budget Tab */}
                    {activeTab === 'budget' && (
                      <div className="space-y-6">
                        {/* Budget Information */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget & Finance</h3>
                          <div className="space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">Annual Budget</p>
                              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                ${department.budget.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">Fiscal year allocation</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Budget per Employee</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                  ${department.employeeCount > 0 ? Math.round(department.budget / department.employeeCount).toLocaleString() : '0'}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Budget Status</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">Active</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === 'contact' && (
                      <div className="space-y-6">
                        {/* Contact Information */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                          <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                  <span className="text-gray-900 dark:text-white">{department.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                                  <span className="text-gray-900 dark:text-white">{department.phone}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{department.address}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar with Actions */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (onViewOnMap) onViewOnMap(department.id);
                            onClose();
                          }}
                          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <MapIcon className="h-5 w-5" />
                          <span>View Facilities</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onEdit) onEdit(department.id);
                            onClose();
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <WrenchScrewdriverIcon className="h-5 w-5" />
                          <span>Edit MAC</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onDelete) onDelete(department.id);
                            onClose();
                          }}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <XMarkIcon className="h-5 w-5" />
                          <span>Delete MAC</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Status */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Overview</h3>
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getTypeColor(department.type)}`}>
                            {department.type}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">MAC Type</p>
                        </div>

                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(department.status)}`}>
                            {department.status}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current Status</p>
                        </div>

                        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{department.employeeCount}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDepartmentModal;
