import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, TruckIcon, MapPinIcon, EllipsisVerticalIcon, MapIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import FloatingActionButton from '../components/FloatingActionButton';
import { filterByDepartment, getEmptyStateMessage, hasValidMACAssignment, isDepartmentAdmin } from '../utils/departmentFilter';
import AddVehicleModal from '../components/AddVehicleModal';
import ViewVehicleModal from '../components/ViewVehicleModal';
import EditFleetModal from '../components/EditFleetModal';
import DeleteVehicleModal from '../components/DeleteVehicleModal';
import VehicleTransferModal from '../components/VehicleTransferModal';
import SuccessConfirmationDialog from '../components/SuccessConfirmationDialog';

interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  department: string; // Primary assignment to ministry/department
  departmentId?: string;
  currentOperator?: string; // Current person using vehicle (optional)
  status: string;
  fuelLevel?: number;
  mileage?: number;
  lastLocation?: string;
  gpsTrackerId?: string;
  updatedAt?: string;
  color?: string;
  vinNumber?: string;
  // Maintenance tracking
  lastMaintenance?: string;
  nextMaintenance?: string;
  maintenanceInterval?: number; // Days between maintenance
  maintenanceDue?: boolean;
  maintenanceOverdue?: boolean;
}

const Vehicles = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleForTransfer, setSelectedVehicleForTransfer] = useState<any>(null);
  const [selectedVehicleForDelete, setSelectedVehicleForDelete] = useState<{
    id: string;
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    department: string;
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

  // Handler for modal success
  const handleModalSuccess = (vehicleData?: any) => {
    console.log('Vehicle added successfully!', vehicleData);
    
    // Set success dialog data
    setSuccessData({
      title: 'Vehicle Added Successfully',
      message: 'The new vehicle has been added to the government fleet with GPS tracking enabled.',
      details: vehicleData ? [
        { label: 'Vehicle', value: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}` },
        { label: 'Plate Number', value: vehicleData.plateNumber },
        { label: 'Vehicle Type', value: vehicleData.vehicleType },
        { label: 'Department', value: vehicleData.department },
        { label: 'GPS Tracker', value: vehicleData.gpsTrackerId || 'Assigned' },
        { label: 'Status', value: vehicleData.status }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
    fetchVehicles(); // Refresh the vehicle list
  };

  // Handle edit success
  const handleEditSuccess = (vehicleData?: any) => {
    console.log('Vehicle updated successfully!', vehicleData);
    
    // Set success dialog data for edit
    setSuccessData({
      title: 'Vehicle Updated Successfully',
      message: 'The vehicle information has been updated in the government asset tracking system.',
      details: vehicleData ? [
        { label: 'Vehicle', value: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}` },
        { label: 'Plate Number', value: vehicleData.plateNumber },
        { label: 'Status', value: vehicleData.status },
        { label: 'Department', value: vehicleData.department }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
    fetchVehicles(); // Refresh the vehicle list
  };

  // Data states  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch vehicles from API
  const fetchVehicles = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('🔄 Fetching vehicles from API...');
      const response = await fetch('http://localhost:5000/api/vehicles');
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Vehicles fetched from API:', result.vehicles);
        setVehicles(result.vehicles);
      } else {
        throw new Error(result.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('❌ Error fetching vehicles:', error);
      setError('Failed to load vehicles');
      // Fallback to mock data if API fails
      setVehicles(mockVehicles);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);
  
  // Click to view handler
  const handleRowClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setIsViewModalOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dropdown when clicking outside any dropdown
      if (activeDropdown && !(event.target as Element).closest('.relative')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Mock vehicle data (used as fallback)
  const mockVehicles: Vehicle[] = [
    {
      id: 'VH001',
      plateNumber: 'LBR-001-GOV',
      make: 'Toyota',
      model: 'Hilux',
      year: 2023,
      vehicleType: 'truck',
      department: 'Ministry of Health',
      departmentId: 'DEPT001',
      currentOperator: 'Dr. Sarah Johnson',
      status: 'active',
      fuelLevel: 75,
      mileage: 12500,
      lastLocation: 'Ministry of Health HQ',
      gpsTrackerId: 'BW32001',
      updatedAt: '2024-01-15 09:30',
      lastMaintenance: '2024-01-01',
      nextMaintenance: '2024-04-01',
      maintenanceInterval: 90 // 90 days
    },
    {
      id: 'VH002',
      plateNumber: 'LBR-002-GOV',
      make: 'Nissan',
      model: 'Patrol',
      year: 2022,
      vehicleType: 'car',
      department: 'Ministry of Defense',
      departmentId: 'DEPT004',
      currentOperator: 'Security Team Alpha',
      status: 'active',
      fuelLevel: 45,
      mileage: 28500,
      lastLocation: 'Defense Ministry HQ',
      gpsTrackerId: 'BW32002',
      updatedAt: '2024-01-15 08:15',
      lastMaintenance: '2023-12-15',
      nextMaintenance: '2024-03-15',
      maintenanceInterval: 90 // 90 days
    }
  ];

  // First filter by user's department/MAC access
  const departmentFilteredVehicles = filterByDepartment(vehicles, user);
  
  const filteredVehicles = departmentFilteredVehicles.filter(vehicle => {
    const matchesSearch = vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vehicle.currentOperator && vehicle.currentOperator.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || vehicle.vehicleType === filterType;
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'available': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'out_of_service': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getFuelLevelColor = (level: number) => {
    if (level > 50) return 'bg-green-500';
    if (level > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate maintenance status
  const getMaintenanceStatus = (vehicle: Vehicle) => {
    if (!vehicle.nextMaintenance) {
      // Calculate next maintenance based on last maintenance + interval
      if (vehicle.lastMaintenance && vehicle.maintenanceInterval) {
        const lastMaintenanceDate = new Date(vehicle.lastMaintenance);
        const nextMaintenanceDate = new Date(lastMaintenanceDate.getTime() + (vehicle.maintenanceInterval * 24 * 60 * 60 * 1000));
        const today = new Date();
        const daysUntilMaintenance = Math.ceil((nextMaintenanceDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        
        return {
          nextDate: nextMaintenanceDate.toLocaleDateString(),
          daysUntil: daysUntilMaintenance,
          isDue: daysUntilMaintenance <= 7, // Due within 7 days
          isOverdue: daysUntilMaintenance < 0,
          status: daysUntilMaintenance < 0 ? 'overdue' : daysUntilMaintenance <= 7 ? 'due' : 'good'
        };
      }
      return { nextDate: 'Not scheduled', daysUntil: 999, isDue: false, isOverdue: false, status: 'unknown' };
    } else {
      const nextMaintenanceDate = new Date(vehicle.nextMaintenance);
      const today = new Date();
      const daysUntilMaintenance = Math.ceil((nextMaintenanceDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      
      return {
        nextDate: nextMaintenanceDate.toLocaleDateString(),
        daysUntil: daysUntilMaintenance,
        isDue: daysUntilMaintenance <= 7,
        isOverdue: daysUntilMaintenance < 0,
        status: daysUntilMaintenance < 0 ? 'overdue' : daysUntilMaintenance <= 7 ? 'due' : 'good'
      };
    }
  };

  const getMaintenanceColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300';
      case 'due': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'good': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // const getVehicleIcon = (type: string) => {
  //   switch (type) {
  //     case 'car': return '🚗';
  //     case 'truck': return '🚚';
  //     case 'motorcycle': return '🏍️';
  //     case 'bus': return '🚌';
  //     case 'van': return '🚐';
  //     default: return '🚗';
  //   }
  // };

  const handleAction = (action: string, vehicleId: string) => {
    console.log(`Action clicked: ${action} for vehicle ${vehicleId}`);
    setActiveDropdown(null);
    
    switch (action) {
      case 'track':
        console.log(`Tracking vehicle ${vehicleId} - Opening live map with auto-focus`);
        navigate('/map', { 
          state: { 
            focusVehicle: vehicleId,
            openFullscreen: true 
          } 
        });
        break;
      case 'edit':
        console.log(`Opening edit modal for vehicle ${vehicleId}`);
        setSelectedVehicleId(vehicleId);
        setIsEditModalOpen(true);
        break;
      case 'delete':
        console.log(`Opening delete modal for vehicle ${vehicleId}`);
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
          setSelectedVehicleForDelete({
            id: vehicle.id,
            plateNumber: vehicle.plateNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            department: vehicle.department
          });
          setIsDeleteModalOpen(true);
        }
        break;
    }
  };

  // Handle vehicle tracking from modal
  const handleTrackVehicle = (vehicleId: string) => {
    console.log(`Tracking vehicle ${vehicleId} from modal - Opening live map with auto-focus`);
    navigate('/map', { 
      state: { 
        focusVehicle: vehicleId,
        openFullscreen: true 
      } 
    });
  };

  // Handle edit vehicle from modal
  const handleEditVehicle = (vehicleId: string) => {
    console.log('🔧 Edit button clicked for vehicle:', vehicleId);
    console.log('🔧 Setting edit modal open to true');
    setSelectedVehicleId(vehicleId);
    setIsEditModalOpen(true);
    console.log('🔧 Edit modal state set - isEditModalOpen should be true');
  };

  // Handle delete vehicle from modal
  const handleDeleteVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicleForDelete({
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        department: vehicle.department
      });
      setIsDeleteModalOpen(true);
    }
  };

  // Handle transfer vehicle from modal
  const handleTransferVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setSelectedVehicleForTransfer(vehicle);
      setIsTransferModalOpen(true);
    }
  };

  // Handle transfer success
  const handleTransferSuccess = (transferData?: any) => {
    console.log('Vehicle transferred successfully!', transferData);
    
    if (transferData) {
      // Update the vehicle in the list with new MAC and plate number
      setVehicles(prevVehicles => 
        prevVehicles.map(v => 
          v.id === transferData.vehicleId 
            ? { 
                ...v, 
                plateNumber: transferData.newPlateNumber,
                department: transferData.toMAC
              }
            : v
        )
      );
    }
    
    // Set success dialog data
    setSuccessData({
      title: 'Vehicle Transfer Completed',
      message: 'The vehicle has been successfully transferred to the new MAC.',
      details: transferData ? [
        { label: 'Vehicle', value: `${transferData.oldPlateNumber} → ${transferData.newPlateNumber}` },
        { label: 'Transfer', value: `${transferData.fromMAC} → ${transferData.toMAC}` },
        { label: 'Authorized By', value: transferData.authorizedBy },
        { label: 'Effective Date', value: transferData.effectiveDate }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
    setIsTransferModalOpen(false);
    setSelectedVehicleForTransfer(null);
  };

  const ActionDropdown = ({ vehicleId }: { vehicleId: string }) => {
    const isOpen = activeDropdown === vehicleId;
    
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            setActiveDropdown(isOpen ? null : vehicleId);
            console.log(`Dropdown ${isOpen ? 'closed' : 'opened'} for vehicle ${vehicleId}`);
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
                  console.log(`Track Location clicked for ${vehicleId}`);
                  handleAction('track', vehicleId);
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MapIcon className="h-4 w-4" />
                <span>Track Location</span>
              </button>
              {!(isDepartmentAdmin(user) && hasValidMACAssignment(user)) && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Edit Vehicle clicked for ${vehicleId}`);
                      handleAction('edit', vehicleId);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit Vehicle</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Delete Vehicle clicked for ${vehicleId}`);
                      handleAction('delete', vehicleId);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete Vehicle</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // TEMPORARILY DISABLED: Check if department admin has no MAC assignment  
  if (false && isDepartmentAdmin(user) && !hasValidMACAssignment(user)) {
    const emptyState = getEmptyStateMessage(user, 'Vehicles');
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
            Fleet Management
            {isDepartmentAdmin(user) && hasValidMACAssignment(user) && (
              <span className="ml-3 text-sm font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full">
                View Only - {user?.department}
              </span>
            )}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
            {isDepartmentAdmin(user) && hasValidMACAssignment(user)
              ? `View fleet assigned to ${user?.department || 'your department'}`
              : 'Monitor and manage government fleet with GPS tracking'
            }
          </p>
        </div>
        {!(isDepartmentAdmin(user) && hasValidMACAssignment(user)) && (
          <FloatingActionButton
            onClick={() => setIsAddModalOpen(true)}
            label="Add Fleet"
            icon={PlusIcon}
          />
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fleet</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{isLoading ? '-' : vehicles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {vehicles.filter(v => v.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-3">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Maintenance</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {vehicles.filter(v => v.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3">
              <MapPinIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Maintenance Due</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : vehicles.filter(v => {
                  const maintenance = getMaintenanceStatus(v);
                  return maintenance.isDue || maintenance.isOverdue;
                }).length}
              </p>
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
                placeholder="Search fleets by license plate, make, model, MACs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="car">Cars</option>
                <option value="truck">Trucks</option>
                <option value="motorcycle">Motorcycles</option>
                <option value="bus">Buses</option>
                <option value="van">Vans</option>
              </select>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading vehicles...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchVehicles}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Vehicles Table */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fleet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Current Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fuel Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVehicles.map((vehicle) => (
                <tr 
                  key={vehicle.id} 
                  onClick={() => handleRowClick(vehicle.id)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{vehicle.plateNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">{vehicle.department}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Ministry/Department</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.currentOperator || (
                      <span className="text-gray-500 italic">Available for assignment</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const maintenance = getMaintenanceStatus(vehicle);
                      return (
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getMaintenanceColor(maintenance.status)}`}>
                            {maintenance.status === 'overdue' ? 'OVERDUE' : 
                             maintenance.status === 'due' ? 'DUE SOON' : 
                             maintenance.status === 'good' ? 'UP TO DATE' : 'UNKNOWN'}
                          </span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Next: {maintenance.nextDate}
                          </p>
                          {maintenance.isDue && (
                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                              {maintenance.isOverdue ? `${Math.abs(maintenance.daysUntil)} days overdue` : `Due in ${maintenance.daysUntil} days`}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${getFuelLevelColor(vehicle.fuelLevel || 0)}`}
                          style={{ width: `${vehicle.fuelLevel || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{vehicle.fuelLevel || 0}%</span>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
          {filteredVehicles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No vehicles found matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* View Vehicle Modal */}
      <ViewVehicleModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        vehicleId={selectedVehicleId}
        onTrack={handleTrackVehicle}
        onEdit={handleEditVehicle}
        onDelete={handleDeleteVehicle}
        onTransfer={handleTransferVehicle}
      />

      {/* Vehicle Transfer Modal */}
      <VehicleTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedVehicleForTransfer(null);
        }}
        onSuccess={handleTransferSuccess}
        vehicle={selectedVehicleForTransfer}
      />

      {/* Edit Fleet Modal */}
      <EditFleetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        vehicleId={selectedVehicleId}
      />

      {/* Delete Vehicle Modal */}
      <DeleteVehicleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={fetchVehicles}
        vehicle={selectedVehicleForDelete}
      />

      {/* Success Confirmation Dialog */}
      <SuccessConfirmationDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        title={successData.title}
        message={successData.message}
        details={successData.details}
        actionLabel="Track Vehicle"
        onAction={() => {
          navigate('/map');
        }}
      />
    </div>
  );
};

export default Vehicles;
