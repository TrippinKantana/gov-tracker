import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, BuildingOfficeIcon, MapPinIcon, EllipsisVerticalIcon, EyeIcon, PencilIcon, TrashIcon, MapIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FloatingActionButton from '../components/FloatingActionButton';
import AddFacilityModal from '../components/modals/AddFacilityModal';
import ViewFacilityModal from '../components/ViewFacilityModal';
import EditFacilityModal from '../components/EditFacilityModal';
import DeleteFacilityModal from '../components/DeleteFacilityModal';
import SuccessConfirmationDialog from '../components/SuccessConfirmationDialog';
import { useAssets } from '../contexts/AssetContext';
import { useAuth } from '../contexts/AuthContext';
import { filterByDepartment, getEmptyStateMessage, hasValidMACAssignment, isDepartmentAdmin } from '../utils/departmentFilter';

interface Facility {
  id: string;
  name: string;
  type: 'ministry' | 'hospital' | 'school' | 'police_station' | 'military_base' | 'warehouse';
  address: string;
  department: string;
  capacity?: number;
  status: 'operational' | 'maintenance' | 'under_construction' | 'closed';
  securityLevel: 'low' | 'medium' | 'high' | 'restricted';
  contactPerson: string;
  phone: string;
  coordinates: [number, number];
  lastInspection: string;
}

const Facilities = () => {
  const navigate = useNavigate();
  const { refreshAllData } = useAssets();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [selectedFacilityForDelete, setSelectedFacilityForDelete] = useState<{
    id: string;
    name: string;
    type: string;
    address: string;
    department: string;
    contactPerson: string;
  } | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    title: string;
    message: string;
    details: { label: string; value: string; }[];
  }>({
    title: '',
    message: '',
    details: []
  });
  
  // Data states
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Store created facility for navigation
  const [lastCreatedFacilityId, setLastCreatedFacilityId] = useState<string | null>(null);
  
  // Handler for modal success
  const handleModalSuccess = (facilityData?: any) => {
    console.log('Facility added successfully!', facilityData);
    
    // Store the facility ID for accurate map navigation
    if (facilityData?.id) {
      setLastCreatedFacilityId(facilityData.id);
      console.log(`🎯 Stored facility ID for navigation: ${facilityData.id}`);
    }
    
    // Set success dialog data
    setSuccessData({
      title: 'Facility Registered Successfully',
      message: 'The new facility has been registered with GPS coordinates for mapping and IoT monitoring.',
      details: facilityData ? [
        { label: 'Facility Name', value: facilityData.name },
        { label: 'Type', value: facilityData.type.replace('_', ' ') },
        { label: 'Department', value: facilityData.department },
        { label: 'Address', value: facilityData.address },
        { label: 'GPS Coordinates', value: `${facilityData.location?.[1]}, ${facilityData.location?.[0]}` },
        { label: 'Contact Person', value: facilityData.contactPerson },
        { label: 'Capacity', value: facilityData.capacity ? `${facilityData.capacity} people` : 'Not specified' }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
    fetchFacilities(); // Refresh the facility list
  };

  // Fetch facilities from API
  const fetchFacilities = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/facilities');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setFacilities(result.facilities);
      } else {
        throw new Error(result.message || 'Failed to fetch facilities');
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
      setError('Failed to load facilities');
      // Fallback to mock data if API fails
      setFacilities(mockFacilities);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchFacilities();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mock facilities data (used as fallback)
  const mockFacilities: Facility[] = [
    {
      id: 'FC001',
      name: 'Ministry of Health Headquarters',
      type: 'ministry',
      address: 'Capitol Hill, Monrovia',
      department: 'Ministry of Health',
      capacity: 500,
      status: 'operational',
      securityLevel: 'high',
      contactPerson: 'Dr. Sarah Johnson',
      phone: '+231-XXX-XXXX',
      coordinates: [-10.7800, 6.2800],
      lastInspection: '2024-01-10'
    },
    {
      id: 'FC002',
      name: 'JFK Memorial Medical Center',
      type: 'hospital',
      address: 'Sinkor, Monrovia',
      department: 'Ministry of Health',
      capacity: 300,
      status: 'operational',
      securityLevel: 'medium',
      contactPerson: 'Dr. Michael Brown',
      phone: '+231-XXX-XXXX',
      coordinates: [-10.7850, 6.2950],
      lastInspection: '2024-01-08'
    },
    {
      id: 'FC003',
      name: 'Central Warehouse',
      type: 'warehouse',
      address: 'Bushrod Island, Monrovia',
      department: 'General Services Agency',
      capacity: 1000,
      status: 'operational',
      securityLevel: 'high',
      contactPerson: 'John Wilson',
      phone: '+231-XXX-XXXX',
      coordinates: [-10.7600, 6.3100],
      lastInspection: '2024-01-05'
    },
    {
      id: 'FC004',
      name: 'University of Liberia Campus',
      type: 'school',
      address: 'Capitol Hill, Monrovia',
      department: 'Ministry of Education',
      capacity: 5000,
      status: 'maintenance',
      securityLevel: 'medium',
      contactPerson: 'Prof. Mary Davis',
      phone: '+231-XXX-XXXX',
      coordinates: [-10.7750, 6.2850],
      lastInspection: '2024-01-12'
    }
  ];

  // Filter by department first for MAC admin role restrictions
  const departmentFilteredFacilities = filterByDepartment(facilities, user);
  
  const filteredFacilities = departmentFilteredFacilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || facility.type === filterType;
    const matchesStatus = filterStatus === 'all' || facility.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'under_construction': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'restricted': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Click to view handler
  const handleRowClick = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setIsViewModalOpen(true);
  };

  const handleAction = (action: string, facilityId: string) => {
    console.log(`Action clicked: ${action} for facility ${facilityId}`);
    setActiveDropdown(null);
    
    switch (action) {
      case 'view':
        console.log(`Opening view modal for facility ${facilityId}`);
        setSelectedFacilityId(facilityId);
        setIsViewModalOpen(true);
        break;
      case 'edit':
        console.log(`Opening edit modal for facility ${facilityId}`);
        setSelectedFacilityId(facilityId);
        setIsEditModalOpen(true);
        break;
      case 'delete':
        console.log(`Opening delete modal for facility ${facilityId}`);
        const facility = facilities.find(f => f.id === facilityId);
        if (facility) {
          setSelectedFacilityForDelete({
            id: facility.id,
            name: facility.name,
            type: facility.type,
            address: facility.address,
            department: facility.department,
            contactPerson: facility.contactPerson
          });
          setIsDeleteModalOpen(true);
        }
        break;
    }
  };

  // Handle facility actions from modal
  const handleEditFacility = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setIsEditModalOpen(true);
  };

  const handleDeleteFacility = (facilityId: string) => {
    console.log(`Opening delete modal for facility ${facilityId} from modal`);
    const facility = facilities.find(f => f.id === facilityId);
    if (facility) {
      setSelectedFacilityForDelete({
        id: facility.id,
        name: facility.name,
        type: facility.type,
        address: facility.address,
        department: facility.department,
        contactPerson: facility.contactPerson
      });
      setIsDeleteModalOpen(true);
    }
  };

  const handleViewOnMap = (facilityId?: string) => {
    if (facilityId) {
      // Find the facility to get its details for debugging
      const facility = facilities.find(f => f.id === facilityId);
      console.log(`🗺️ HANDLE VIEW ON MAP - FACILITY LOOKUP:`, {
        requestedId: facilityId,
        foundFacility: facility ? {
          id: facility.id,
          name: facility.name,
          coordinates: (facility as any)?.location || facility?.coordinates,
          department: facility.department
        } : 'NOT FOUND',
        allFacilityIds: facilities.map(f => f.id),
        allFacilityNames: facilities.map(f => f.name)
      });
      
      if (!facility) {
        console.error(`❌ CRITICAL: Facility ${facilityId} not found in facilities array!`);
        console.log('🔍 All available facilities:', facilities);
        return;
      }
      
      // Navigate to Live Map with facility focus
      navigate('/map', { 
        state: { 
          focusFacility: facilityId,
          facilityName: facility.name,
          facilityCoordinates: facility.coordinates,
          timestamp: Date.now(),
          debugInfo: {
            requestedFacility: facilityId,
            foundFacility: facility.name,
            navigationTime: new Date().toISOString()
          }
        } 
      });
    } else {
      console.log('🗺️ Navigating to Live Map');
      navigate('/map');
    }
  };

  // Handle edit success
  const handleEditSuccess = (facilityData?: any) => {
    console.log('Facility updated successfully!', facilityData);
    
    setSuccessData({
      title: 'Facility Updated Successfully',
      message: 'The facility information has been updated in the government asset tracking system.',
      details: facilityData ? [
        { label: 'Facility Name', value: facilityData.name },
        { label: 'Type', value: facilityData.type.replace('_', ' ') },
        { label: 'Department', value: facilityData.department },
        { label: 'Status', value: facilityData.status }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
    fetchFacilities(); // Refresh the facility list
    refreshAllData(); // Refresh all components globally
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    console.log('Facility deleted successfully!');
    
    setSuccessData({
      title: 'Facility Deleted Successfully',
      message: 'The facility has been permanently removed from the government asset tracking system.',
      details: []
    });
    
    setIsSuccessDialogOpen(true);
    fetchFacilities(); // Refresh the facility list
    refreshAllData(); // Refresh all components globally
  };

  const ActionDropdown = ({ facilityId }: { facilityId: string }) => {
    const isOpen = activeDropdown === facilityId;
    
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(isOpen ? null : facilityId);
            console.log(`Dropdown ${isOpen ? 'closed' : 'opened'} for facility ${facilityId}`);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Actions"
        >
          <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`View Details clicked for ${facilityId}`);
                  handleAction('view', facilityId);
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <EyeIcon className="h-4 w-4" />
                <span>View Details</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Edit Facility clicked for ${facilityId}`);
                  handleAction('edit', facilityId);
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit Facility</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Delete Facility clicked for ${facilityId}`);
                  handleAction('delete', facilityId);
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete Facility</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Check if department admin has no MAC assignment
  if (isDepartmentAdmin(user) && !hasValidMACAssignment(user)) {
    const emptyState = getEmptyStateMessage(user, 'Facilities');
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
    <div className="space-y-4 p-4 lg:space-y-6 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Facilities Management
            {isDepartmentAdmin(user) && hasValidMACAssignment(user) && (
              <span className="ml-3 text-sm font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full">
                View Only - {user?.department}
              </span>
            )}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
            {isDepartmentAdmin(user) && hasValidMACAssignment(user)
              ? `View facilities assigned to ${user?.department || 'your department'}`
              : 'Monitor and manage government buildings and infrastructure'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('/map')}
            className="hidden lg:flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <MapIcon className="h-5 w-5" />
            <span>View Facility Map</span>
          </button>
          {!(isDepartmentAdmin(user) && hasValidMACAssignment(user)) && (
            <FloatingActionButton
              onClick={() => setIsAddModalOpen(true)}
              label="Add Facility"
              icon={PlusIcon}
            />
          )}
        </div>
      </div>

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-2 sm:p-3">
              <BuildingOfficeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Facilities</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">{isLoading ? '-' : departmentFilteredFacilities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-2 sm:p-3">
              <BuildingOfficeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Operational</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : departmentFilteredFacilities.filter(f => f.status === 'operational').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-2 sm:p-3">
              <BuildingOfficeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">In Maintenance</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : departmentFilteredFacilities.filter(f => f.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-2 sm:p-3">
              <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Capacity</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : departmentFilteredFacilities.reduce((total, f) => total + (f.capacity || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilities by name, address, MAC, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="ministry">Ministries</option>
                <option value="hospital">Hospitals</option>
                <option value="school">Schools</option>
                <option value="police_station">Police Stations</option>
                <option value="military_base">Military Bases</option>
                <option value="warehouse">Warehouses</option>
              </select>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="under_construction">Under Construction</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading facilities...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchFacilities}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Facilities Table */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Facility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Security Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Inspection
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFacilities.map((facility) => (
                <tr 
                  key={facility.id} 
                  onClick={() => handleRowClick(facility.id)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{facility.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{facility.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {facility.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(facility.status)}`}>
                      {facility.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSecurityLevelColor(facility.securityLevel)}`}>
                      {facility.securityLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {facility.capacity ? facility.capacity.toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">{facility.contactPerson}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{facility.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {facility.lastInspection}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionDropdown facilityId={facility.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
          {filteredFacilities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No facilities found matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Facility Modal */}
      <AddFacilityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* View Facility Modal */}
      <ViewFacilityModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        facilityId={selectedFacilityId}
        onEdit={handleEditFacility}
        onDelete={handleDeleteFacility}
        onViewOnMap={handleViewOnMap}
      />

      {/* Edit Facility Modal */}
      <EditFacilityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        facilityId={selectedFacilityId}
      />

      {/* Delete Facility Modal */}
      <DeleteFacilityModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        facility={selectedFacilityForDelete}
      />

      {/* Success Confirmation Dialog */}
      <SuccessConfirmationDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        title={successData.title}
        message={successData.message}
        details={successData.details}
        actionLabel="View on Map"
        onAction={() => {
          console.log(`🗺️ SUCCESS DIALOG: Navigating to newly created facility: ${lastCreatedFacilityId}`);
          console.log('🗺️ Available facilities for lookup:', facilities.map(f => ({ id: f.id, name: f.name })));
          
          if (lastCreatedFacilityId) {
            // Double-check the facility exists in our current data
            const facility = facilities.find(f => f.id === lastCreatedFacilityId);
            if (facility) {
              console.log(`✅ Found facility for navigation:`, facility);
              handleViewOnMap(lastCreatedFacilityId);
            } else {
              console.error(`❌ Facility ${lastCreatedFacilityId} not found in current data - refreshing and retrying`);
              // Refresh data and try again
              fetchFacilities().then(() => {
                const refreshedFacility = facilities.find(f => f.id === lastCreatedFacilityId);
                if (refreshedFacility) {
                  handleViewOnMap(lastCreatedFacilityId);
                } else {
                  navigate('/map');
                }
              });
            }
          } else {
            console.warn('⚠️ No facility ID stored for navigation');
            navigate('/map');
          }
        }}
      />
    </div>
  );
};

export default Facilities;
