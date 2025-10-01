/**
 * Personnel Management System
 * Manage government staff for asset assignment (not system users)
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
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import FloatingActionButton from '../components/FloatingActionButton';
import ViewPersonnelModal from '../components/ViewPersonnelModal';
import EditPersonnelModal from '../components/EditPersonnelModal';
import DeletePersonnelModal from '../components/DeletePersonnelModal';
import PersonnelSuccessModal from '../components/PersonnelSuccessModal';
import { useAuth } from '../contexts/AuthContext';
import { useAssets } from '../contexts/AssetContext';
import { filterByDepartment, getEmptyStateMessage, hasValidMACAssignment, isDepartmentAdmin } from '../utils/departmentFilter';

interface Personnel {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  badgeNumber: string;
  department: string;
  position: string;
  clearanceLevel: 'standard' | 'confidential' | 'secret' | 'top_secret';
  dateHired: string;
  facilityAssignment?: string;
  status: 'active' | 'inactive' | 'on_leave';
  vehicleAssignments?: string[];
  equipmentAssignments?: string[];
  createdAt: string;
}

const PersonnelManagement = () => {
  const { user } = useAuth();
  const { refreshCounts } = useAssets();

  // Check if MAC admin has view-only access
  const isViewOnly = isDepartmentAdmin(user) && hasValidMACAssignment(user);
  console.log('👤 Personnel page - User:', user?.roles, 'Department:', user?.department, 'IsViewOnly:', isViewOnly, 'HasValidMAC:', hasValidMACAssignment(user));
  const [activeTab, setActiveTab] = useState<'personnel' | 'assignments'>('personnel');
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string | null>(null);
  const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(null);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);
  const [showPersonnelDetails, setShowPersonnelDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreatePersonnel, setShowCreatePersonnel] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPersonnel, setCreatedPersonnel] = useState<Personnel | null>(null);

  useEffect(() => {
    loadPersonnelData();
  }, []);

  // TEMPORARILY DISABLED: Refresh sidebar counts whenever personnel changes
  // useEffect(() => {
  //   // Only refresh if we have loaded data (not on initial empty state)
  //   if (!isLoading) {
  //     refreshCounts();
  //   }
  // }, [personnel, isLoading, refreshCounts]);

  const loadPersonnelData = async () => {
    console.log('📊 Loading personnel data from API...');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/personnel');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.personnel) {
          setPersonnel(data.personnel);
          console.log(`✅ Loaded ${data.personnel.length} personnel records from API`);
        } else {
          console.log('📄 No personnel data from API, using existing data');
        }
      } else {
        console.log('📄 Personnel API not available, using existing data');
      }
    } catch (error) {
      console.error('❌ Error loading personnel from API:', error);
      console.log('📄 Using existing localStorage data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter by department first for MAC admin role restrictions  
  const departmentFilteredPersonnel = filterByDepartment(personnel, user);
  
  const filteredPersonnel = departmentFilteredPersonnel.filter(person => {
    if (!searchTerm) return true;
    return person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           person.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           person.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
           person.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getStats = () => {
    return {
      totalPersonnel: departmentFilteredPersonnel.length,
      activePersonnel: departmentFilteredPersonnel.filter(p => p.status === 'active').length,
      withVehicles: departmentFilteredPersonnel.filter(p => p.vehicleAssignments && p.vehicleAssignments.length > 0).length,
      withEquipment: departmentFilteredPersonnel.filter(p => p.equipmentAssignments && p.equipmentAssignments.length > 0).length
    };
  };

  const stats = getStats();

  const getClearanceColor = (level: string) => {
    switch (level) {
      case 'top_secret': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'secret': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'confidential': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getInitials = (fullName: string | undefined) => {
    if (!fullName) return 'N/A';
    return fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  // Check if department admin has no MAC assignment
  if (isDepartmentAdmin(user) && !hasValidMACAssignment(user)) {
    const emptyState = getEmptyStateMessage(user, 'Personnel');
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 lg:space-y-6 lg:p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading personnel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:space-y-6 lg:p-6">
      {/* Clean Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Personnel
            {isViewOnly && (
              <span className="ml-3 text-sm font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full">
                View Only - {user?.department}
              </span>
            )}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
            {isViewOnly 
              ? `View personnel from ${user?.department || 'your department'}`
              : 'Government staff and asset assignments'
            }
          </p>
        </div>
        {!isViewOnly && (
          <FloatingActionButton
            onClick={() => {
              console.log('Opening personnel creation modal');
              setShowCreatePersonnel(true);
            }}
            label="Add Personnel"
            icon={PlusIcon}
          />
        )}
      </div>

      {/* Personnel Stats - Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 text-center">
          <UsersIcon className="h-6 lg:h-8 w-6 lg:w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPersonnel}</p>
          <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Total Personnel</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 text-center">
          <UserIcon className="h-6 lg:h-8 w-6 lg:w-8 text-green-600 mx-auto mb-2" />
          <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.activePersonnel}</p>
          <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Active Staff</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 text-center">
          <ClipboardDocumentCheckIcon className="h-6 lg:h-8 w-6 lg:w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.withVehicles}</p>
          <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Vehicle Assigned</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 text-center">
          <ComputerDesktopIcon className="h-6 lg:h-8 w-6 lg:w-8 text-orange-600 mx-auto mb-2" />
          <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.withEquipment}</p>
          <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Equipment Assigned</p>
        </div>
      </div>

      {/* Personnel Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('personnel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personnel'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Government Personnel ({departmentFilteredPersonnel.length})
          </button>
          
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assignments'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Asset Assignments
          </button>
        </nav>
      </div>

      {/* Personnel Tab */}
      {activeTab === 'personnel' && (
        <div className="space-y-4 lg:space-y-6">
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search personnel by name, badge, department, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Personnel List - Responsive */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {filteredPersonnel.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Personnel Found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No personnel match your search criteria' : 'No personnel have been added yet'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPersonnel.map((person) => (
                    <div key={person.id} className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {getInitials(person.fullName)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {person.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {person.position} • {person.badgeNumber}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Department:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{person.department}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Status:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(person.status)}`}>
                            {person.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Clearance:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClearanceColor(person.clearanceLevel)}`}>
                            {person.clearanceLevel.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Assignments:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {(person.vehicleAssignments?.length || 0) + (person.equipmentAssignments?.length || 0)} assets
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedPersonnelId(person.id);
                          setShowPersonnelDetails(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <table className="hidden lg:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Personnel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Department & Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Status & Clearance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Asset Assignments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPersonnel.map((person) => (
                      <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {person.fullName.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {person.fullName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {person.badgeNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{person.department}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{person.position}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(person.status)}`}>
                              {person.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <br />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClearanceColor(person.clearanceLevel)}`}>
                              {person.clearanceLevel.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {person.vehicleAssignments?.length || 0} vehicles
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {person.equipmentAssignments?.length || 0} equipment
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedPersonnelId(person.id);
                              setShowPersonnelDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asset Assignment Overview</h3>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage which personnel are assigned to which vehicles and equipment.
          </p>
          {/* TODO: Implement asset assignment interface */}
        </div>
      )}

      {/* Personnel Details Modal */}
      {showPersonnelDetails && selectedPersonnel && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPersonnelDetails(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personnel Details</h3>
                <button
                  onClick={() => setShowPersonnelDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedPersonnel.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Badge Number</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedPersonnel.badgeNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedPersonnel.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedPersonnel.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Clearance Level</label>
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getClearanceColor(selectedPersonnel.clearanceLevel)}`}>
                    {selectedPersonnel.clearanceLevel.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedPersonnel.status)}`}>
                    {selectedPersonnel.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {selectedPersonnel.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedPersonnel.email}</p>
                  </div>
                )}
                {selectedPersonnel.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedPersonnel.phone}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Asset Assignments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Assignments</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedPersonnel.vehicleAssignments?.length || 0} vehicles assigned
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Equipment Assignments</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedPersonnel.equipmentAssignments?.length || 0} equipment assigned
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPersonnelDetails(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // TODO: Open edit personnel modal
                    console.log('Edit personnel:', selectedPersonnel.id);
                    alert('Edit personnel functionality would open here');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Personnel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Personnel Details Modal */}
      <ViewPersonnelModal
        isOpen={showPersonnelDetails}
        onClose={() => {
          setShowPersonnelDetails(false);
          setSelectedPersonnelId(null);
        }}
        personnelId={selectedPersonnelId}
        onEdit={(personnelId) => {
          const person = personnel.find(p => p.id === personnelId);
          if (person) {
            setPersonnelToEdit(person);
            setShowEditModal(true);
          }
        }}
        onDelete={(personnelId) => {
          const person = personnel.find(p => p.id === personnelId);
          if (person) {
            setPersonnelToDelete(person);
            setShowDeleteModal(true);
          }
        }}
        onViewOnMap={(personnelId) => {
          const person = personnel.find(p => p.id === personnelId);
          if (person && person.facilityAssignment) {
            console.log(`Viewing ${person.fullName} on facility map`);
            // Navigate to departments map with facility focus
            window.location.href = '/departments?tab=map';
          }
        }}
      />

      {/* Add Personnel Modal */}
      {showCreatePersonnel && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCreatePersonnel(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Personnel</h3>
                <button
                  onClick={() => setShowCreatePersonnel(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const newPersonnel: Personnel = {
                  id: `PERS${Date.now()}`,
                  fullName: formData.get('fullName') as string,
                  email: formData.get('email') as string || undefined,
                  phone: formData.get('phone') as string || undefined,
                  badgeNumber: formData.get('badgeNumber') as string,
                  department: formData.get('department') as string,
                  position: formData.get('position') as string,
                  clearanceLevel: formData.get('clearanceLevel') as any,
                  dateHired: formData.get('dateHired') as string,
                  facilityAssignment: formData.get('facilityAssignment') as string || undefined,
                  status: 'active',
                  vehicleAssignments: [],
                  equipmentAssignments: [],
                  createdAt: new Date().toISOString()
                };
                
                try {
                  console.log('💾 Saving personnel to database:', newPersonnel);
                  
                  // Save to database via API
                  const response = await fetch('/api/personnel', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newPersonnel)
                  });

                  if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                      // Add to local state
                      setPersonnel(prev => [...prev, result.personnel || newPersonnel]);
                      console.log('✅ Personnel saved to database successfully');
                      
                      // Show custom success dialog
                      setCreatedPersonnel(result.personnel || newPersonnel);
                      setShowCreatePersonnel(false);
                      setShowSuccessModal(true);
                      
                      // Refresh data and sidebar counts
                      loadPersonnelData();
                      refreshCounts();
                    } else {
                      throw new Error(result.message || 'Failed to save personnel');
                    }
                  } else {
                    throw new Error(`HTTP ${response.status}: Failed to save personnel`);
                  }
                } catch (error) {
                  console.error('❌ Error saving personnel to database:', error);
                  alert(`Error saving personnel: ${error.message || 'Unknown error'}. Please try again.`);
                }
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                    <input name="fullName" type="text" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input name="email" type="email" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input name="phone" type="tel" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Badge Number *</label>
                    <input name="badgeNumber" type="text" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department/MAC *</label>
                    <select name="department" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select Department</option>
                      <option value="Ministry of Health">Ministry of Health</option>
                      <option value="Ministry of Agriculture">Ministry of Agriculture</option>
                      <option value="Ministry of Defense">Ministry of Defense</option>
                      <option value="Ministry of Education">Ministry of Education</option>
                      <option value="General Services Agency">General Services Agency</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position *</label>
                    <input name="position" type="text" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clearance Level</label>
                    <select name="clearanceLevel" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                      <option value="standard">Standard</option>
                      <option value="confidential">Confidential</option>
                      <option value="secret">Secret</option>
                      <option value="top_secret">Top Secret</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Hired</label>
                    <input name="dateHired" type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facility Assignment</label>
                    <select name="facilityAssignment" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                      <option value="">No Facility Assignment</option>
                      <option value="Ministry of Health HQ">Ministry of Health HQ</option>
                      <option value="Central Hospital">Central Hospital</option>
                      <option value="Agriculture Research Center">Agriculture Research Center</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreatePersonnel(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Personnel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Personnel Modal */}
      <EditPersonnelModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setPersonnelToEdit(null);
        }}
        onSave={async (updatedPersonnel) => {
          try {
            console.log('💾 Updating personnel in database:', updatedPersonnel);
            
            // Update in database via API
            const response = await fetch(`/api/personnel/${updatedPersonnel.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatedPersonnel)
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success) {
                // Update local state
                setPersonnel(prev => 
                  prev.map(p => p.id === updatedPersonnel.id ? updatedPersonnel : p)
                );
                setShowEditModal(false);
                setPersonnelToEdit(null);
                console.log('✅ Personnel updated in database successfully');
                
                // Refresh data and sidebar counts
                loadPersonnelData();
                refreshCounts();
              } else {
                throw new Error(result.message || 'Failed to update personnel');
              }
            } else {
              throw new Error(`HTTP ${response.status}: Failed to update personnel`);
            }
          } catch (error) {
            console.error('❌ Error updating personnel in database:', error);
            alert(`Error updating personnel: ${error.message || 'Unknown error'}. Please try again.`);
          }
        }}
        personnel={personnelToEdit}
      />

      {/* Delete Personnel Modal */}
      {personnelToDelete && (
        <DeletePersonnelModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPersonnelToDelete(null);
          }}
          onConfirm={async () => {
            if (personnelToDelete) {
              try {
                console.log('💾 Deleting personnel from database:', personnelToDelete.id);
                
                // Delete from database via API
                const response = await fetch(`/api/personnel/${personnelToDelete.id}`, {
                  method: 'DELETE'
                });

                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                    // Remove from local state
                    setPersonnel(prev => prev.filter(p => p.id !== personnelToDelete.id));
                    setShowDeleteModal(false);
                    setPersonnelToDelete(null);
                    console.log('✅ Personnel deleted from database successfully');
                    
                    // Refresh data and sidebar counts
                    loadPersonnelData();
                    refreshCounts();
                  } else {
                    throw new Error(result.message || 'Failed to delete personnel');
                  }
                } else {
                  throw new Error(`HTTP ${response.status}: Failed to delete personnel`);
                }
              } catch (error) {
                console.error('❌ Error deleting personnel from database:', error);
                alert(`Error deleting personnel: ${error.message || 'Unknown error'}. Please try again.`);
              }
            }
          }}
          personnelName={personnelToDelete.fullName}
          badgeNumber={personnelToDelete.badgeNumber}
          department={personnelToDelete.department}
          vehicleAssignments={personnelToDelete.vehicleAssignments?.length || 0}
          equipmentAssignments={personnelToDelete.equipmentAssignments?.length || 0}
        />
      )}

      {/* Personnel Success Modal */}
      <PersonnelSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setCreatedPersonnel(null);
        }}
        personnel={createdPersonnel}
      />
    </div>
  );
};

export default PersonnelManagement;
