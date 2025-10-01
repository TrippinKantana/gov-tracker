import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, MapIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface ViewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
  onEdit?: (employeeId: string) => void;
  onDelete?: (employeeId: string) => void;
  onViewOnMap?: (employeeId: string) => void;
}

interface EmployeeDetails {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  username?: string;
  email: string;
  role: string;
  department: string;
  departmentId?: string;
  badgeNumber: string;
  position?: string;
  phone?: string;
  isActive: boolean;
  assignedAssets?: {
    vehicles: number;
    equipment: number;
    total: number;
  };
  hireDate?: string;
  lastSeen?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt?: string;
}

const ViewEmployeeModal = ({ isOpen, onClose, employeeId, onEdit, onDelete, onViewOnMap }: ViewEmployeeModalProps) => {
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'contact' | 'history'>('overview');

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchEmployeeDetails();
      setActiveTab('overview'); // Reset to overview when opening
    }
  }, [isOpen, employeeId]);

  const fetchEmployeeDetails = async () => {
    if (!employeeId) return;
    
    setIsLoading(true);
    setError('');
    try {
      // Mock employee data - replace with real API call
      const mockEmployee: EmployeeDetails = {
        id: employeeId,
        fullName: employeeId === 'EMP001' ? 'Dr. Sarah Johnson' : 'General Robert Smith',
        email: employeeId === 'EMP001' ? 'sarah.johnson@health.gov.lr' : 'robert.smith@defense.gov.lr',
        role: employeeId === 'EMP001' ? 'Administrator' : 'Manager',
        department: employeeId === 'EMP001' ? 'Ministry of Health' : 'Ministry of Defense',
        badgeNumber: employeeId === 'EMP001' ? 'GSA-001' : 'GSA-008',
        position: employeeId === 'EMP001' ? 'Health Administrator' : 'Defense Administrator',
        phone: employeeId === 'EMP001' ? '+231-123-4567' : '+231-123-8901',
        isActive: true,
        assignedAssets: {
          vehicles: employeeId === 'EMP001' ? 1 : 2,
          equipment: employeeId === 'EMP001' ? 3 : 1,
          total: employeeId === 'EMP001' ? 4 : 3
        },
        hireDate: employeeId === 'EMP001' ? '2020-01-15' : '2019-06-10',
        lastSeen: new Date().toISOString(),
        emergencyContact: employeeId === 'EMP001' ? 'John Johnson' : 'Mary Smith',
        emergencyPhone: employeeId === 'EMP001' ? '+231-555-0101' : '+231-555-0102',
        createdAt: '2023-01-01'
      };
      
      setEmployee(mockEmployee);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      setError('Failed to load employee details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
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
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Employee Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Government personnel information</p>
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
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading employee details...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {employee && (
              <>
                {/* Employee Header Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {employee.fullName.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{employee.fullName}</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{employee.position || 'Government Employee'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Badge: {employee.badgeNumber} • {employee.department}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(employee.isActive)}`}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {employee.role}
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
                      onClick={() => setActiveTab('assignments')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'assignments'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Asset Assignments
                    </button>
                    <button
                      onClick={() => setActiveTab('contact')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'contact'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Contact & Emergency
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'history'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Employment History
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
                        {/* Personal Information */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{employee.fullName}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{employee.position || 'Government Employee'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{employee.department}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Badge Number</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white font-mono">{employee.badgeNumber}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{employee.role}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(employee.isActive)}`}>
                                    {employee.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                      <div className="space-y-6">
                        {/* Asset Assignments */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asset Assignments</h3>
                          {employee.assignedAssets ? (
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {employee.assignedAssets.vehicles}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Vehicles</p>
                              </div>

                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {employee.assignedAssets.equipment}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Equipment</p>
                              </div>

                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  {employee.assignedAssets.total}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">No Asset Assignments</h4>
                              <p className="text-gray-600 dark:text-gray-400">This employee has no assets currently assigned</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === 'contact' && (
                      <div className="space-y-6">
                        {/* Primary Contact */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primary Contact</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <label className="text-sm font-medium text-blue-700 dark:text-blue-300">Email Address</label>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">{employee.email}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <label className="text-sm font-medium text-blue-700 dark:text-blue-300">Phone Number</label>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">{employee.phone || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        {(employee.emergencyContact || employee.emergencyPhone) && (
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h3>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                              <div className="grid grid-cols-2 gap-4">
                                {employee.emergencyContact && (
                                  <div>
                                    <label className="text-sm font-medium text-red-700 dark:text-red-300">Contact Person</label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{employee.emergencyContact}</p>
                                  </div>
                                )}
                                {employee.emergencyPhone && (
                                  <div>
                                    <label className="text-sm font-medium text-red-700 dark:text-red-300">Emergency Phone</label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{employee.emergencyPhone}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                      <div className="space-y-6">
                        {/* Employment History */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employment History</h3>
                          <div className="space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Hire Date</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Unknown'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Years of Service</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {employee.hireDate 
                                    ? Math.floor((Date.now() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)
                                    : 'Unknown'
                                  } years
                                </span>
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Last Seen</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {employee.lastSeen ? new Date(employee.lastSeen).toLocaleDateString() : 'Unknown'}
                                </span>
                              </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Employee ID</span>
                                <span className="font-semibold text-gray-900 dark:text-white font-mono">{employee.id}</span>
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
                            if (onViewOnMap) onViewOnMap(employee.id);
                            onClose();
                          }}
                          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <MapIcon className="h-5 w-5" />
                          <span>View MACs</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onEdit) onEdit(employee.id);
                            onClose();
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <WrenchScrewdriverIcon className="h-5 w-5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onDelete) onDelete(employee.id);
                            onClose();
                          }}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <XMarkIcon className="h-5 w-5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Status */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Overview</h3>
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(employee.isActive)}`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Employment Status</p>
                        </div>

                        <div className="text-center">
                          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {employee.role}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Role</p>
                        </div>

                        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{employee.assignedAssets?.total || 0}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Assets</p>
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

export default ViewEmployeeModal;
