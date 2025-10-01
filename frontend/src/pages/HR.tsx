/**
 * GSA Human Resources Management
 * Internal HR system for GSA employees only
 */

import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  PhoneIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import FloatingActionButton from '../components/FloatingActionButton';
import { useAuth } from '../contexts/AuthContext';
import { isDepartmentAdmin } from '../utils/departmentFilter';

interface GSAEmployee {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string; // Should always be "General Services Agency"
  clearanceLevel: 'standard' | 'confidential' | 'secret' | 'top_secret';
  dateHired: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  supervisor: string;
  officeLocation: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  benefits: {
    healthInsurance: boolean;
    retirement: boolean;
    lifeInsurance: boolean;
  };
  performanceRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
  lastReview: string;
  nextReview: string;
  createdAt: string;
  updatedAt: string;
}

const HR = () => {
  const { user } = useAuth();

  // Block MAC admins from accessing GSA HR
  if (isDepartmentAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto">
          <ShieldCheckIcon className="mx-auto h-24 w-24 text-red-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">GSA HR Access Denied</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            GSA Human Resources is restricted to GSA Super Administrators only. MAC administrators cannot access GSA internal HR records.
          </p>
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300">
              <strong>Your Access:</strong> {user?.department || 'MAC'} Administrator<br/>
              <strong>Required:</strong> GSA Super Administrator
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  const [employees, setEmployees] = useState<GSAEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    loadGSAEmployees();
  }, []);

  const loadGSAEmployees = async () => {
    setIsLoading(true);
    try {
      console.log('📊 Loading GSA employees...');
      
      // TODO: Replace with real GSA HR API
      const mockGSAEmployees: GSAEmployee[] = [
        {
          id: 'GSA001',
          employeeNumber: 'GSA-2024-001',
          fullName: 'Robert Wilson',
          email: 'r.wilson@gsa.gov.lr',
          phone: '+231-555-1001',
          position: 'Director General',
          department: 'General Services Agency',
          clearanceLevel: 'top_secret',
          dateHired: '2018-01-15',
          salary: 85000,
          status: 'active',
          supervisor: 'Minister of Public Works',
          officeLocation: 'GSA HQ - Office 101',
          emergencyContact: {
            name: 'Mary Wilson',
            phone: '+231-555-1002',
            relationship: 'Spouse'
          },
          benefits: {
            healthInsurance: true,
            retirement: true,
            lifeInsurance: true
          },
          performanceRating: 'excellent',
          lastReview: '2024-01-15',
          nextReview: '2025-01-15',
          createdAt: '2018-01-15T00:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'GSA002',
          employeeNumber: 'GSA-2024-002',
          fullName: 'Alice Thompson',
          email: 'a.thompson@gsa.gov.lr',
          phone: '+231-555-1003',
          position: 'HR Manager',
          department: 'General Services Agency',
          clearanceLevel: 'secret',
          dateHired: '2020-06-01',
          salary: 65000,
          status: 'active',
          supervisor: 'Robert Wilson',
          officeLocation: 'GSA HQ - Office 205',
          emergencyContact: {
            name: 'John Thompson',
            phone: '+231-555-1004',
            relationship: 'Spouse'
          },
          benefits: {
            healthInsurance: true,
            retirement: true,
            lifeInsurance: true
          },
          performanceRating: 'good',
          lastReview: '2024-06-01',
          nextReview: '2025-06-01',
          createdAt: '2020-06-01T00:00:00Z',
          updatedAt: new Date().toISOString()
        }
      ];
      
      setEmployees(mockGSAEmployees);
      console.log('✅ Loaded GSA employees:', mockGSAEmployees.length);
    } catch (error) {
      console.error('❌ Error loading GSA employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    const matchesPosition = filterPosition === 'all' || employee.position.toLowerCase().includes(filterPosition.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesPosition;
  });

  // Check if user has access to HR system
  const hasHRAccess = user?.roles.includes('super_admin') || 
                     user?.roles.includes('hr_admin') || 
                     user?.department === 'General Services Agency';

  if (!hasHRAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-yellow-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            The HR system is restricted to GSA administrators and HR personnel only.
          </p>
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>Contact your GSA administrator</strong> for HR system access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleViewEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsViewModalOpen(true);
  };

  const handleEditEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsEditModalOpen(true);
  };

  const getStats = () => {
    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      onLeave: employees.filter(e => e.status === 'on_leave').length,
      pendingReview: employees.filter(e => {
        const nextReview = new Date(e.nextReview);
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        return nextReview <= thirtyDaysFromNow;
      }).length
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GSA Human Resources</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Internal HR management for General Services Agency employees
          </p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <ShieldCheckIcon className="h-4 w-4 mr-1" />
            <span>GSA Personnel Only</span>
          </div>
        </div>
        <FloatingActionButton
          onClick={() => setIsAddModalOpen(true)}
          label="Add GSA Employee"
          icon={PlusIcon}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total GSA Staff</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-3">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On Leave</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.onLeave}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Review Due</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingReview}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search GSA employees by name, employee number, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
            
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Positions</option>
              <option value="director">Director</option>
              <option value="manager">Manager</option>
              <option value="officer">Officer</option>
              <option value="specialist">Specialist</option>
              <option value="admin">Administrative</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading GSA employees...</span>
          </div>
        </div>
      )}

      {/* GSA Employees Table */}
      {!isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Clearance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Next Review
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.map((employee) => (
                  <tr 
                    key={employee.id} 
                    onClick={() => handleViewEmployee(employee.id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {employee.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.employeeNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{employee.position}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{employee.officeLocation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        employee.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        employee.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {employee.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.clearanceLevel === 'top_secret' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                        employee.clearanceLevel === 'secret' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                        employee.clearanceLevel === 'confidential' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {employee.clearanceLevel.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.performanceRating === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        employee.performanceRating === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        employee.performanceRating === 'satisfactory' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {employee.performanceRating.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(employee.nextReview).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No GSA employees found matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* TODO: Add HR Modals */}
      {/* Add GSA Employee Modal */}
      {/* View GSA Employee Modal */}
      {/* Edit GSA Employee Modal */}
    </div>
  );
};

export default HR;
