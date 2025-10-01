import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, ComputerDesktopIcon, RectangleGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FloatingActionButton from '../components/FloatingActionButton';
import AddEquipmentModal from '../components/AddEquipmentModal';
import AddFurnitureModal from '../components/AddFurnitureModal';
import ViewEquipmentModal from '../components/equipment/ViewEquipmentModal';
import EditEquipmentModal from '../components/equipment/EditEquipmentModal';
import DeleteEquipmentModal from '../components/equipment/DeleteEquipmentModal';
import SuccessConfirmationDialog from '../components/SuccessConfirmationDialog';
import { Equipment } from '../services/equipmentService';
import { useAssets } from '../contexts/AssetContext';
import { useAuth } from '../contexts/AuthContext';
import { filterByDepartment, getEmptyStateMessage, hasValidMACAssignment, isDepartmentAdmin } from '../utils/departmentFilter';

const Equipments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAllData } = useAssets();
  const { user } = useAuth();
  
  // Check URL parameter for initial tab
  const urlParams = new URLSearchParams(location.search);
  const tabFromUrl = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState<'furniture' | 'equipment'>(
    tabFromUrl === 'furniture' ? 'furniture' : 'equipment'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddFurnitureModalOpen, setIsAddFurnitureModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedEquipmentForDelete, setSelectedEquipmentForDelete] = useState<{
    id: string;
    name: string;
    serialNumber: string;
    department: string;
  } | null>(null);
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
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Mock equipment data with furniture and equipment separation
  const mockEquipments: Equipment[] = [
    // Office Equipment
    {
      id: 'EQ001',
      name: 'Dell Latitude 7420',
      type: 'laptop',
      category: 'equipment',
      brand: 'Dell',
      model: 'Latitude 7420',
      serialNumber: 'DL7420-001',
      department: 'Ministry of Health',
      assignedTo: 'Dr. Sarah Johnson',
      status: 'active',
      condition: 'excellent',
      purchaseDate: '2023-03-15',
      purchasePrice: 1200,
      warrantyExpiry: '2026-03-15',
      lastMaintenance: '2024-01-10',
      location: 'Health Ministry - Room 201',
      usefulLife: 4, // years
      salvageValue: 200
    },
    {
      id: 'EQ002',
      name: 'HP LaserJet Pro M404',
      type: 'printer',
      category: 'equipment',
      brand: 'HP',
      model: 'LaserJet Pro M404',
      serialNumber: 'HP404-002',
      department: 'General Services Agency',
      status: 'available',
      condition: 'good',
      purchaseDate: '2022-08-20',
      purchasePrice: 450,
      warrantyExpiry: '2024-08-20',
      lastMaintenance: '2024-01-05',
      location: 'GSA Central Office',
      usefulLife: 5, // years
      salvageValue: 50
    },
    {
      id: 'EQ003',
      name: 'Cisco IP Phone 8861',
      type: 'phone',
      category: 'equipment',
      brand: 'Cisco',
      model: 'IP Phone 8861',
      serialNumber: 'CS8861-003',
      department: 'Ministry of Defense',
      assignedTo: 'General Robert Smith',
      status: 'active',
      condition: 'excellent',
      purchaseDate: '2023-06-10',
      purchasePrice: 320,
      warrantyExpiry: '2026-06-10',
      location: 'Defense Ministry - Office 301',
      usefulLife: 5, // years
      salvageValue: 30
    },
    // Office Furniture
    {
      id: 'FU001',
      name: 'Executive Office Desk',
      type: 'desk',
      category: 'furniture',
      brand: 'Steelcase',
      model: 'Series 9000',
      serialNumber: 'SC9000-001',
      department: 'Ministry of Health',
      assignedTo: 'Dr. Sarah Johnson',
      status: 'active',
      condition: 'good',
      purchaseDate: '2022-01-15',
      purchasePrice: 850,
      location: 'Health Ministry - Office 205',
      usefulLife: 10, // years (furniture typically lasts longer)
      salvageValue: 100,
      notes: 'L-shaped executive desk with built-in cable management'
    },
    {
      id: 'FU002',
      name: 'Ergonomic Office Chair',
      type: 'chair',
      category: 'furniture',
      brand: 'Herman Miller',
      model: 'Aeron Size B',
      serialNumber: 'HM-AERON-002',
      department: 'Ministry of Health',
      assignedTo: 'Dr. Sarah Johnson',
      status: 'active',
      condition: 'excellent',
      purchaseDate: '2022-01-15',
      purchasePrice: 650,
      location: 'Health Ministry - Office 205',
      usefulLife: 10, // years
      salvageValue: 50
    },
    {
      id: 'FU003',
      name: 'Conference Table',
      type: 'table',
      category: 'furniture',
      brand: 'Global Furniture',
      model: 'Executive Conference',
      serialNumber: 'GF-CONF-003',
      department: 'Ministry of Defense',
      status: 'active',
      condition: 'good',
      purchaseDate: '2021-11-20',
      purchasePrice: 2400,
      location: 'Defense Ministry - Conference Room A',
      usefulLife: 15, // years (conference tables last longer)
      salvageValue: 300,
      notes: '12-person capacity with integrated power outlets'
    },
    {
      id: 'FU004',
      name: 'Filing Cabinet',
      type: 'storage',
      category: 'furniture',
      brand: 'Steelcase',
      model: '4-Drawer Vertical',
      serialNumber: 'SC-FILE-004',
      department: 'General Services Agency',
      status: 'active',
      condition: 'fair',
      purchaseDate: '2020-05-10',
      purchasePrice: 320,
      location: 'GSA Central Office - Archive Room',
      usefulLife: 12, // years (filing cabinets are durable)
      salvageValue: 40
    }
  ];

  // Dropdown functionality removed - using clickable rows instead

  // Fetch equipment data
  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch real equipment data from API
      const response = await fetch('http://localhost:5000/api/equipment');
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Fetched equipment from API:', result.equipment);
        setEquipments(result.equipment);
      } else {
        throw new Error(result.message || 'Failed to fetch equipment');
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setError('Failed to load equipment data');
      // Fallback to mock data if API fails
      setEquipments(mockEquipments);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter by department first for MAC admin role restrictions
  const departmentFilteredEquipments = filterByDepartment(equipments, user);
  
  // Filter equipment based on active tab and filters
  const currentCategoryEquipments = departmentFilteredEquipments.filter(equipment => {
    const categoryMatch = equipment.category === activeTab || (!equipment.category && activeTab === 'equipment');
    console.log(`Equipment ${equipment.name}: category=${equipment.category}, activeTab=${activeTab}, matches=${categoryMatch}`);
    return categoryMatch;
  });

  const filteredEquipments = currentCategoryEquipments.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (equipment.assignedTo && equipment.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || equipment.type === filterType;
    const matchesStatus = filterStatus === 'all' || equipment.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get category-specific stats
  const categoryStats = {
    furniture: {
      total: departmentFilteredEquipments.filter(eq => eq.category === 'furniture').length,
      active: departmentFilteredEquipments.filter(eq => eq.category === 'furniture' && eq.status === 'active').length,
      maintenance: departmentFilteredEquipments.filter(eq => eq.category === 'furniture' && eq.status === 'maintenance').length,
      retired: departmentFilteredEquipments.filter(eq => eq.category === 'furniture' && eq.status === 'retired').length
    },
    equipment: {
      total: departmentFilteredEquipments.filter(eq => eq.category === 'equipment' || !eq.category).length,
      active: departmentFilteredEquipments.filter(eq => (eq.category === 'equipment' || !eq.category) && eq.status === 'active').length,
      maintenance: departmentFilteredEquipments.filter(eq => (eq.category === 'equipment' || !eq.category) && eq.status === 'maintenance').length,
      retired: departmentFilteredEquipments.filter(eq => (eq.category === 'equipment' || !eq.category) && eq.status === 'retired').length
    }
  };

  const currentStats = categoryStats[activeTab];

  // Depreciation calculation function
  const calculateDepreciation = (asset: Equipment) => {
    if (!asset.purchasePrice || !asset.purchaseDate || !asset.usefulLife) {
      return { currentValue: 0, depreciationRate: 0, totalDepreciation: 0, depreciationPerYear: 0, yearsElapsed: 0 };
    }

    const purchaseDate = new Date(asset.purchaseDate);
    const currentDate = new Date();
    const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    const cost = asset.purchasePrice;
    const salvageValue = asset.salvageValue || 0;
    const usefulLife = asset.usefulLife;
    
    // Straight-line depreciation (standard for government)
    const depreciationPerYear = (cost - salvageValue) / usefulLife;
    const totalDepreciation = Math.min(depreciationPerYear * yearsElapsed, cost - salvageValue);
    const currentValue = Math.max(cost - totalDepreciation, salvageValue);
    const depreciationRate = (totalDepreciation / cost) * 100;

    return {
      currentValue: Math.round(currentValue),
      depreciationRate: Math.round(depreciationRate),
      totalDepreciation: Math.round(totalDepreciation),
      depreciationPerYear: Math.round(depreciationPerYear),
      yearsElapsed: Math.round(yearsElapsed * 100) / 100
    };
  };

  // Calculate financial stats for current category
  const financialStats = currentCategoryEquipments.reduce((acc, asset) => {
    const depreciation = calculateDepreciation(asset);
    
    return {
      totalOriginalValue: acc.totalOriginalValue + (asset.purchasePrice || 0),
      totalCurrentValue: acc.totalCurrentValue + depreciation.currentValue,
      totalDepreciation: acc.totalDepreciation + depreciation.totalDepreciation,
      averageAge: acc.averageAge + (depreciation.yearsElapsed || 0)
    };
  }, { totalOriginalValue: 0, totalCurrentValue: 0, totalDepreciation: 0, averageAge: 0 });

  // Calculate averages
  if (currentCategoryEquipments.length > 0) {
    financialStats.averageAge = financialStats.averageAge / currentCategoryEquipments.length;
  }

  // Handle tab change with URL update
  const handleTabChange = (tab: 'furniture' | 'equipment') => {
    setActiveTab(tab);
    // Update URL without page reload
    const newUrl = tab === 'furniture' ? '/equipments?tab=furniture' : '/equipments';
    window.history.pushState({}, '', newUrl);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'available': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'retired': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'lost': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // handleAction removed - using clickable rows instead

  // Click to view handler
  const handleRowClick = (equipmentId: string) => {
    console.log(`Opening equipment details for ${equipmentId}`);
    setSelectedEquipmentId(equipmentId);
    setIsViewModalOpen(true);
  };

  const handleModalSuccess = (equipmentData?: any) => {
    console.log('Asset added successfully!', equipmentData);
    
    const isNewFurniture = equipmentData?.category === 'furniture';
    
    // Store the new equipment ID for the View button
    if (equipmentData?.id) {
      setSelectedEquipmentId(equipmentData.id);
    }
    
    // Set success dialog data
    setSuccessData({
      title: `${isNewFurniture ? 'Furniture' : 'Equipment'} Added Successfully`,
      message: `The new ${isNewFurniture ? 'furniture item' : 'equipment'} has been registered and is ready for assignment.`,
      details: equipmentData ? [
        { label: `${isNewFurniture ? 'Furniture' : 'Equipment'} Name`, value: equipmentData.name },
        { label: 'Type', value: equipmentData.type },
        { label: 'Brand', value: equipmentData.brand },
        { label: 'Model', value: equipmentData.model },
        { label: 'Serial Number', value: equipmentData.serialNumber },
        { label: 'Department', value: equipmentData.department },
        { label: 'Purchase Price', value: equipmentData.purchasePrice ? `$${equipmentData.purchasePrice.toLocaleString()}` : 'Not specified' },
        { label: 'Location', value: equipmentData.location || 'To be assigned' }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
    fetchEquipments(); // Refresh the data
    refreshAllData(); // Refresh all components globally
    
    // Switch to the appropriate tab if adding furniture
    if (isNewFurniture && activeTab !== 'furniture') {
      handleTabChange('furniture');
    }
  };

  // Handle equipment actions from modal
  const handleEditEquipment = (equipmentId: string) => {
    console.log(`Opening edit modal for equipment ${equipmentId}`);
    setSelectedEquipmentId(equipmentId);
    setIsEditModalOpen(true);
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    console.log(`Opening delete modal for equipment ${equipmentId}`);
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (equipment) {
      setSelectedEquipmentForDelete({
        id: equipment.id,
        name: equipment.name,
        serialNumber: equipment.serialNumber,
        department: equipment.department
      });
      setIsDeleteModalOpen(true);
    }
  };

  const handleViewOnMap = (equipmentId: string) => {
    console.log(`Viewing equipment ${equipmentId} exact location on facility map`);
    
    // Find the equipment and its facility assignment
    const equipment = equipments.find(eq => eq.id === equipmentId);
    if (equipment && equipment.facility) {
      console.log(`Equipment ${equipmentId} is stored at facility: ${equipment.facility.name} - ${equipment.facility.room || 'General area'}`);
      console.log(`Equipment location details: ${equipment.location}`);
      
      // Navigate to departments map with precise facility focus
      navigate('/departments', { 
        state: { 
          activeTab: 'map',
          focusFacility: equipment.facility.id,
          highlightEquipment: equipmentId,
          equipmentLocation: equipment.location,
          autoFullscreen: true // Request fullscreen for precise viewing
        } 
      });
    } else {
      // If no facility assignment, show alert with guidance
      console.log(`Equipment ${equipmentId} has no facility assignment`);
      alert(`Equipment ${equipment?.name || equipmentId} is not assigned to a specific facility. Please edit the equipment to assign it to a facility for precise location tracking.`);
    }
  };

  // Handle edit success
  const handleEditSuccess = (equipmentData?: any) => {
    console.log('Equipment updated successfully!', equipmentData);
    
    setSuccessData({
      title: 'Equipment Updated Successfully',
      message: 'The equipment information has been updated in the government asset tracking system.',
      details: equipmentData ? [
        { label: 'Equipment Name', value: equipmentData.name },
        { label: 'Serial Number', value: equipmentData.serialNumber },
        { label: 'Status', value: equipmentData.status },
        { label: 'Location', value: equipmentData.location }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
    fetchEquipments(); // Refresh the data
    refreshAllData(); // Refresh all components globally
  };

  // Check if department admin has no MAC assignment
  if (isDepartmentAdmin(user) && !hasValidMACAssignment(user)) {
    const emptyState = getEmptyStateMessage(user, 'Equipment');
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

  // ActionDropdown removed - using clickable rows instead

  return (
    <div className="space-y-4 p-4 lg:space-y-6 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Fixed Assets Management
            {isDepartmentAdmin(user) && hasValidMACAssignment(user) && (
              <span className="ml-3 text-sm font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full">
                View Only - {user?.department}
              </span>
            )}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
            {isDepartmentAdmin(user) && hasValidMACAssignment(user)
              ? `View ${activeTab} assigned to ${user?.department || 'your department'}`
              : 'Track and manage government office furniture and equipment'
            }
          </p>
        </div>
        {!(isDepartmentAdmin(user) && hasValidMACAssignment(user)) && (
          <FloatingActionButton
            onClick={() => {
              if (activeTab === 'furniture') {
                setIsAddFurnitureModalOpen(true);
              } else {
                setIsAddModalOpen(true);
              }
            }}
            label={`Add ${activeTab === 'furniture' ? 'Furniture' : 'Equipment'}`}
            icon={PlusIcon}
          />
        )}
      </div>

      {/* Category Tabs - Responsive */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('equipment')}
            className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm flex items-center justify-center sm:justify-start space-x-2 ${
              activeTab === 'equipment'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <ComputerDesktopIcon className="h-5 w-5" />
            <span>Office Equipment</span>
          </button>
          <button
            onClick={() => handleTabChange('furniture')}
            className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm flex items-center justify-center sm:justify-start space-x-2 ${
              activeTab === 'furniture'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <RectangleGroupIcon className="h-5 w-5" />
            <span>Office Furniture</span>
          </button>
        </nav>
      </div>

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-2 sm:p-3">
              <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Total {activeTab === 'furniture' ? 'Furniture' : 'Equipment'}
              </p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : currentStats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-2 sm:p-3">
              <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Active</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : currentStats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-2 sm:p-3">
              <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">In Maintenance</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : currentStats.maintenance}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-2 sm:p-3">
              <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Retired</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : currentStats.retired}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary & Depreciation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Financial Summary - {activeTab === 'furniture' ? 'Office Furniture' : 'Office Equipment'}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Original Value</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${financialStats.totalOriginalValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Purchase cost</p>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${financialStats.totalCurrentValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">After depreciation</p>
          </div>

          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Depreciation</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${financialStats.totalDepreciation.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {financialStats.totalOriginalValue > 0 
                ? `${Math.round((financialStats.totalDepreciation / financialStats.totalOriginalValue) * 100)}% of original`
                : '0%'
              }
            </p>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Age</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {financialStats.averageAge.toFixed(1)} yrs
            </p>
            <p className="text-xs text-gray-500 mt-1">Since purchase</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Depreciation Method:</span>
            <span className="font-medium text-gray-900 dark:text-white">Straight-line (Government Standard)</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-400">Useful Life:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {activeTab === 'furniture' ? '10 years (Furniture)' : '4-5 years (Equipment)'}
            </span>
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
                placeholder={`Search ${activeTab === 'furniture' ? 'furniture' : 'equipment'} by name, serial number, brand, department...`}
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
                {activeTab === 'equipment' ? (
                  <>
                    <option value="laptop">Laptops</option>
                    <option value="desktop">Desktops</option>
                    <option value="tablet">Tablets</option>
                    <option value="phone">Phones</option>
                    <option value="printer">Printers</option>
                    <option value="projector">Projectors</option>
                    <option value="server">Servers</option>
                    <option value="radio">Radios</option>
                    <option value="camera">Cameras</option>
                  </>
                ) : (
                  <>
                    <option value="desk">Desks</option>
                    <option value="chair">Chairs</option>
                    <option value="table">Tables</option>
                    <option value="storage">Storage/Filing</option>
                    <option value="bookshelf">Bookshelves</option>
                    <option value="cabinet">Cabinets</option>
                    <option value="sofa">Sofas/Seating</option>
                    <option value="other">Other Furniture</option>
                  </>
                )}
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
              <option value="retired">Retired</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading equipment...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchEquipments}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Equipment Table */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {activeTab === 'furniture' ? 'Furniture' : 'Equipment'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Original Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Depreciation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEquipments.map((equipment) => {
                  const depreciation = calculateDepreciation(equipment);
                  return (
                    <tr 
                      key={equipment.id} 
                      onClick={() => handleRowClick(equipment.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{equipment.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {equipment.brand} {equipment.model} • S/N: {equipment.serialNumber}
                            </div>
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              Category: {equipment.category || 'none'} • Tab: {activeTab}
                            </div>
                            {equipment.assignedTo && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Assigned to: {equipment.assignedTo}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {equipment.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(equipment.status)}`}>
                            {equipment.status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(equipment.condition)}`}>
                            {equipment.condition}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="text-right">
                          <div className="font-medium">${equipment.purchasePrice?.toLocaleString() || 'N/A'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {equipment.purchaseDate ? new Date(equipment.purchaseDate).getFullYear() : 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="text-right">
                          <div className="font-medium text-green-600 dark:text-green-400">
                            ${depreciation.currentValue.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {depreciation.yearsElapsed.toFixed(1)} yrs old
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="text-right">
                          <div className="font-medium text-red-600 dark:text-red-400">
                            ${depreciation.totalDepreciation.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {depreciation.depreciationRate}% depreciated
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {equipment.location}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredEquipments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No {activeTab === 'furniture' ? 'furniture' : 'equipment'} found matching your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <AddFurnitureModal
        isOpen={isAddFurnitureModalOpen}
        onClose={() => setIsAddFurnitureModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      
      <ViewEquipmentModal
      isOpen={isViewModalOpen}
      onClose={() => setIsViewModalOpen(false)}
      equipmentId={selectedEquipmentId}
        onEdit={handleEditEquipment}
          onDelete={handleDeleteEquipment}
          onViewOnMap={handleViewOnMap}
        />
      
      <EditEquipmentModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      onSuccess={handleEditSuccess}
      equipmentId={selectedEquipmentId}
      />
      
      <DeleteEquipmentModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onSuccess={() => {
        fetchEquipments();
        refreshAllData(); // Refresh all components
        }}
        equipment={selectedEquipmentForDelete}
        />
        
        {/* Success Confirmation Dialog */}
        <SuccessConfirmationDialog
          isOpen={isSuccessDialogOpen}
          onClose={() => setIsSuccessDialogOpen(false)}
          title={successData.title}
          message={successData.message}
          details={successData.details}
          actionLabel={`View ${successData.title.includes('Furniture') ? 'Furniture' : 'Equipment'}`}
          onAction={() => {
            // Open the equipment details modal for the newly created item
            if (selectedEquipmentId) {
              console.log('Opening equipment details for newly created item:', selectedEquipmentId);
              setIsViewModalOpen(true);
            }
          }}
        />
    </div>
  );
};

export default Equipments;
