import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Map, { Marker, Popup } from 'react-map-gl';
import { useAssets } from '../contexts/AssetContext';
import { refreshAllMACCounts, updateMACWithRealCounts } from '../utils/macCalculations';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, BuildingOfficeIcon, UsersIcon, TruckIcon, ComputerDesktopIcon, MapIcon, ArrowsPointingOutIcon, MapPinIcon } from '@heroicons/react/24/outline';
import FloatingActionButton from '../components/FloatingActionButton';
import AddDepartmentModal from '../components/modals/AddDepartmentModal';
import ViewDepartmentModal from '../components/ViewDepartmentModal';
import EditMACModal from '../components/EditMACModal';
import DeleteMACModal from '../components/DeleteMACModal';
import SuccessConfirmationDialog from '../components/SuccessConfirmationDialog';
import { useAuth } from '../contexts/AuthContext';
import { isDepartmentAdmin } from '../utils/departmentFilter';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Department {
  id: string;
  name: string;
  code: string;
  type: 'ministry' | 'agency' | 'bureau' | 'commission' | 'authority';
  headOfDepartment: string;
  email: string;
  phone: string;
  address: string;
  budget: number;
  status: 'active' | 'inactive' | 'restructuring';
  employeeCount: number;
  vehicleCount: number;
  facilityCount: number;
  equipmentCount: number;
  establishedDate: string;
}

interface DepartmentFacility {
  id: string;
  name: string;
  type: 'ministry' | 'hospital' | 'school' | 'police_station' | 'military_base' | 'warehouse';
  department: string;
  departmentId: string;
  address: string;
  coordinates: [number, number];
  status: 'operational' | 'maintenance' | 'under_construction' | 'closed';
  capacity?: number;
  contactPerson: string;
  phone: string;
}

const Departments = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { refreshCounts } = useAssets();

  // Block MAC admins from accessing all MACs overview
  if (isDepartmentAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto">
          <BuildingOfficeIcon className="mx-auto h-24 w-24 text-red-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">MACs Overview Restricted</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            MAC administrators cannot view all government departments. You only have access to resources within your assigned MAC.
          </p>
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Your MAC:</strong> {user?.department || 'Not Assigned'}<br/>
              <strong>Access:</strong> Department Fleet, Facilities, and Assets only
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  const [activeTab, setActiveTab] = useState<'overview'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
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
  const handleModalSuccess = (departmentData?: any) => {
    console.log('Department added successfully!', departmentData);
    
    // Add new department to the list if provided
    if (departmentData) {
      const newDepartment: Department = {
        ...departmentData,
        id: `DEPT${Date.now()}`, // Generate unique ID
        employeeCount: 0, // Will be calculated from real data
        vehicleCount: 0,
        facilityCount: 0,
        equipmentCount: 0
      };
      setDepartments(prev => [...prev, newDepartment]);
    }
    
    // Update sidebar counts
    refreshCounts();
    
    // Set success dialog data
    setSuccessData({
      title: 'Department Created Successfully',
      message: 'The new department has been created and is ready for asset assignment.',
      details: departmentData ? [
        { label: 'Department Name', value: departmentData.name },
        { label: 'Department Code', value: departmentData.code },
        { label: 'Type', value: departmentData.type },
        { label: 'Head of Department', value: departmentData.headOfDepartment },
        { label: 'Email', value: departmentData.email },
        { label: 'Budget', value: departmentData.budget ? `$${departmentData.budget.toLocaleString()}` : 'Not specified' }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
  };
  
  // Map-specific states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<DepartmentFacility | null>(null);
  const [mapSearchTerm, setMapSearchTerm] = useState('');
  const [mapFilterDepartment, setMapFilterDepartment] = useState('all');
  const [mapFilterType, setMapFilterType] = useState('all');
  const mapRef = useRef<any>();

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'demo-token';

  // Navigation useEffect will be moved after data declaration



  // Initial sample department data
  const initialDepartments: Department[] = [
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
      employeeCount: 45,
      vehicleCount: 12,
      facilityCount: 8,
      equipmentCount: 89,
      establishedDate: '1847-07-26'
    },
    {
      id: 'DEPT002',
      name: 'Ministry of Agriculture',
      code: 'MOA',
      type: 'ministry',
      headOfDepartment: 'John Doe',
      email: 'info@agriculture.gov.lr',
      phone: '+231-555-0102',
      address: 'Sinkor, Monrovia',
      budget: 18000000,
      status: 'active',
      employeeCount: 38,
      vehicleCount: 15,
      facilityCount: 12,
      equipmentCount: 67,
      establishedDate: '1847-07-26'
    },
    {
      id: 'DEPT003',
      name: 'General Services Agency',
      code: 'GSA',
      type: 'agency',
      headOfDepartment: 'Mary Williams',
      email: 'info@gsa.gov.lr',
      phone: '+231-555-0103',
      address: 'Broad Street, Monrovia',
      budget: 35000000,
      status: 'active',
      employeeCount: 125,
      vehicleCount: 45,
      facilityCount: 3,
      equipmentCount: 156,
      establishedDate: '1972-04-15'
    },
    {
      id: 'DEPT004',
      name: 'Ministry of Defense',
      code: 'MOD',
      type: 'ministry',
      headOfDepartment: 'General Robert Smith',
      email: 'info@defense.gov.lr',
      phone: '+231-555-0104',
      address: 'Camp Johnson Road, Monrovia',
      budget: 45000000,
      status: 'active',
      employeeCount: 89,
      vehicleCount: 25,
      facilityCount: 15,
      equipmentCount: 234,
      establishedDate: '1847-07-26'
    },
    {
      id: 'DEPT005',
      name: 'Ministry of Education',
      code: 'MOE',
      type: 'ministry',
      headOfDepartment: 'Prof. Alice Brown',
      email: 'info@education.gov.lr',
      phone: '+231-555-0105',
      address: 'Sinkor, Monrovia',
      budget: 22000000,
      status: 'restructuring',
      employeeCount: 67,
      vehicleCount: 8,
      facilityCount: 45,
      equipmentCount: 123,
      establishedDate: '1847-07-26'
    }
  ];

  // Department state with localStorage persistence
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('government-departments');
    if (saved) {
      console.log('📄 Loading saved departments from localStorage');
      return JSON.parse(saved);
    }
    console.log('📄 Using initial sample departments');
    return initialDepartments;
  });

  // Load departments and calculate real asset counts
  useEffect(() => {
    const loadDepartmentsWithRealCounts = async () => {
      try {
        console.log('🔄 Loading departments and calculating real asset counts...');
        
        // Fetch departments and all asset types in parallel
        const [deptResponse, vehiclesResponse, facilitiesResponse, equipmentResponse, personnelResponse] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/vehicles'),
          fetch('/api/facilities'), 
          fetch('/api/equipment'),
          fetch('/api/personnel')
        ]);

        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          if (deptData.success && deptData.departments) {
            
            // Get all asset data
            const vehiclesData = vehiclesResponse.ok ? await vehiclesResponse.json() : { vehicles: [] };
            const facilitiesData = facilitiesResponse.ok ? await facilitiesResponse.json() : { facilities: [] };
            const equipmentData = equipmentResponse.ok ? await equipmentResponse.json() : { equipment: [] };
            const personnelData = personnelResponse.ok ? await personnelResponse.json() : { personnel: [] };

            // Calculate real counts for each MAC
            const departmentsWithRealCounts = deptData.departments.map((dept: any) => {
              const vehicleCount = (vehiclesData.vehicles || []).filter((v: any) => v.department === dept.name).length;
              const facilityCount = (facilitiesData.facilities || []).filter((f: any) => f.department === dept.name).length;
              const equipmentCount = (equipmentData.equipment || []).filter((e: any) => e.department === dept.name).length;
              const employeeCount = (personnelData.personnel || []).filter((p: any) => p.department === dept.name).length;

              console.log(`📊 Real counts for ${dept.name}:`, {
                vehicles: vehicleCount,
                facilities: facilityCount, 
                equipment: equipmentCount,
                employees: employeeCount
              });

              return {
                ...dept,
                vehicleCount,
                facilityCount,
                equipmentCount,
                employeeCount
              };
            });

            setDepartments(departmentsWithRealCounts);
            console.log('✅ Loaded departments with real asset counts');
          }
        } else {
          console.log('⚠️ Departments API not available, using local data');
        }
      } catch (error) {
        console.error('❌ Error loading departments with real counts:', error);
      }
    };

    loadDepartmentsWithRealCounts();
  }, []);

  // Real facilities data from API
  const [departmentFacilities, setDepartmentFacilities] = useState<DepartmentFacility[]>([]);

  // Load real facilities from API
  useEffect(() => {
    const loadRealFacilities = async () => {
      console.log('🏢 Loading real facilities from API...');
      
      try {
        const response = await fetch('/api/facilities');
        if (response.ok) {
          const facilitiesData = await response.json();
          console.log('🏢 Raw facilities API response:', facilitiesData);
          
          // Transform API data to match our interface
          const transformedFacilities: DepartmentFacility[] = facilitiesData.facilities?.map((facility: any) => ({
            id: facility.id,
            name: facility.name,
            type: facility.type || 'ministry',
            department: facility.department,
            departmentId: facility.departmentId,
            address: facility.address,
            coordinates: facility.coordinates ? [facility.coordinates[0], facility.coordinates[1]] : [-10.7800, 6.2800],
            status: facility.status || 'operational',
            capacity: facility.capacity || 0,
            contactPerson: facility.contactPerson || 'N/A',
            phone: facility.phone || 'N/A'
          })) || [];
          
          setDepartmentFacilities(transformedFacilities);
          console.log(`🏢 Loaded ${transformedFacilities.length} real facilities for map`);
        } else {
          console.log('🏢 No facilities found, map will be empty');
          setDepartmentFacilities([]);
        }
      } catch (error) {
        console.error('❌ Error loading facilities:', error);
        setDepartmentFacilities([]);
      }
    };

    loadRealFacilities();
  }, []);

  // Check for navigation state and handle intelligent navigation
  useEffect(() => {
    if (location.state?.activeTab === 'map') {
      console.log('Auto-switching to map tab');
      setActiveTab('map');
    }
    
    // Auto-focus on specific facility (enhanced with debugging)
    if (location.state?.focusFacility) {
      const facilityId = location.state.focusFacility;
      const facilityName = location.state?.facilityName;
      const facilityCoordinates = location.state?.facilityCoordinates;
      
      console.log(`🎯 DEPARTMENTS PAGE - AUTO-FOCUSING ON FACILITY:`, {
        id: facilityId,
        name: facilityName,
        providedCoordinates: facilityCoordinates,
        timestamp: location.state?.timestamp,
        debugInfo: location.state?.debugInfo,
        availableFacilities: departmentFacilities.map(f => ({ id: f.id, name: f.name }))
      });
      
      setActiveTab('map');
      
      // Auto-open fullscreen if requested for precise location viewing
      if (location.state?.autoFullscreen) {
        console.log('Auto-opening fullscreen map for precise location viewing');
        setIsFullScreen(true);
      }
      
      // Find the facility and navigate to it
      const facility = departmentFacilities.find(f => f.id === facilityId);
      if (facility) {
        console.log(`✅ Found facility in data:`, facility);
        setSelectedFacility(facility);
        
        // Auto-focus after map loads
        setTimeout(() => {
          if (mapRef.current) {
            console.log(`🚁 Flying to facility: ${facility.name} at coordinates ${facility.coordinates}`);
            mapRef.current.flyTo({
              center: facility.coordinates,
              zoom: location.state?.autoFullscreen ? 18 : 16, // Higher zoom for equipment location precision
              duration: 2000
            });
          }
        }, 1000);
        
        // If highlighting specific equipment, show detailed info
        if (location.state?.highlightEquipment) {
          const equipmentId = location.state.highlightEquipment;
          const equipmentLocation = location.state?.equipmentLocation;
          console.log(`🎯 EQUIPMENT LOCATION: Equipment ${equipmentId} is stored at ${facility.name}`);
          if (equipmentLocation) {
            console.log(`📍 Exact location: ${equipmentLocation}`);
          }
        }
      } else {
        console.error(`❌ Facility ${facilityId} not found in departmentFacilities data`);
        console.log('Available facilities:', departmentFacilities.map(f => ({ id: f.id, name: f.name })));
      }
    }
    
    // Auto-focus on department facilities (when viewing employee's department)
    if (location.state?.focusDepartment) {
      const departmentName = location.state.focusDepartment;
      console.log(`Auto-focusing on department: ${departmentName}`);
      
      setActiveTab('map');
      
      // Find facilities belonging to this department
      const departmentFacilitiesFiltered = departmentFacilities.filter(f => f.department === departmentName);
      console.log(`Found ${departmentFacilitiesFiltered.length} facilities for ${departmentName}`);
      
      if (departmentFacilitiesFiltered.length > 0) {
        // Focus on the first facility of the department
        const primaryFacility = departmentFacilitiesFiltered[0];
        setSelectedFacility(primaryFacility);
        
        // Auto-filter to show only this department's facilities
        setMapFilterDepartment('all'); // Reset filter first
        
        setTimeout(() => {
          if (mapRef.current) {
            console.log(`Flying to department facility: ${primaryFacility.name} at ${primaryFacility.coordinates}`);
            mapRef.current.flyTo({
              center: primaryFacility.coordinates,
              zoom: 14, // Slightly wider view to show multiple facilities
              duration: 2000
            });
          }
        }, 1000);
        
        // If highlighting specific employee, show additional info
        if (location.state?.highlightEmployee) {
          console.log(`Highlighting employee ${location.state.highlightEmployee} working at ${departmentName}`);
        }
      }
    }
  }, [location.state]);

  const filteredDepartments = departments.filter(department => {
    const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         department.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         department.headOfDepartment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || department.type === filterType;
    const matchesStatus = filterStatus === 'all' || department.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filter facilities for map
  const filteredFacilities = departmentFacilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(mapSearchTerm.toLowerCase()) ||
                         facility.address.toLowerCase().includes(mapSearchTerm.toLowerCase()) ||
                         facility.department.toLowerCase().includes(mapSearchTerm.toLowerCase());
    const matchesDepartment = mapFilterDepartment === 'all' || facility.departmentId === mapFilterDepartment;
    const matchesType = mapFilterType === 'all' || facility.type === mapFilterType;
    
    return matchesSearch && matchesDepartment && matchesType;
  });

  // Navigate to facility on map
  const navigateToFacility = (facility: DepartmentFacility) => {
    setSelectedFacility(facility);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: facility.coordinates,
        zoom: 15,
        duration: 2000
      });
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

  // Click to view handler for department cards
  const handleCardClick = (departmentId: string) => {
    console.log(`Opening department details for ${departmentId}`);
    setSelectedDepartmentId(departmentId);
    setIsViewModalOpen(true);
  };

  const handleAction = (action: string, departmentId: string) => {
    console.log(`Action clicked: ${action} for department ${departmentId}`);
    setActiveDropdown(null);
    
    switch (action) {
      case 'view':
        console.log(`Opening view modal for department ${departmentId}`);
        setSelectedDepartmentId(departmentId);
        setIsViewModalOpen(true);
        break;
      case 'edit':
        console.log(`Opening edit modal for department ${departmentId}`);
        alert(`Edit Department ${departmentId} - Edit modal will open here.`);
        break;
      case 'delete':
        console.log(`Opening delete modal for department ${departmentId}`);
        alert(`Delete Department ${departmentId} - Confirmation modal will open here.`);
        break;
    }
  };

  // Handle department actions from modal
  const handleEditDepartment = (departmentId: string) => {
    const departmentFound = departments.find(d => d.id === departmentId);
    if (departmentFound) {
      setDepartmentToEdit(departmentFound);
      setIsEditModalOpen(true);
      setIsViewModalOpen(false);
      console.log(`Opening edit modal for MAC: ${departmentFound.name}`);
    }
  };

  const handleSaveEditedDepartment = async (updatedDepartment: Department) => {
    try {
      console.log(`💾 Updating MAC via API: ${updatedDepartment.name}`);
      
      // Update via API
      const response = await fetch(`/api/departments/${updatedDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedDepartment.name,
          code: updatedDepartment.code,
          type: updatedDepartment.type,
          headOfDepartment: updatedDepartment.headOfDepartment,
          email: updatedDepartment.email,
          phone: updatedDepartment.phone,
          address: updatedDepartment.address,
          budget: updatedDepartment.budget,
          status: updatedDepartment.status,
          establishedDate: updatedDepartment.establishedDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state with API response
        setDepartments(prevDepts => 
          prevDepts.map(d => d.id === updatedDepartment.id ? data.department : d)
        );
        
        // Update sidebar counts
        refreshCounts();
        
        // Show success message
        setSuccessData({
          title: 'MAC Updated Successfully',
          message: `${updatedDepartment.name} has been updated with the new information.`,
          details: [
            { label: 'MAC Name', value: updatedDepartment.name },
            { label: 'MAC Code', value: updatedDepartment.code },
            { label: 'Head of MAC', value: updatedDepartment.headOfDepartment },
            { label: 'Status', value: updatedDepartment.status }
          ]
        });
        setIsSuccessDialogOpen(true);
        
        console.log(`✅ Updated MAC: ${updatedDepartment.name}`);
      } else {
        const errorData = await response.json();
        console.error('❌ Update failed:', errorData.message);
        alert(`Update failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('❌ Error updating department:', error);
      alert('Error updating MAC. Please try again.');
    }
    
    // Close edit modal
    setIsEditModalOpen(false);
    setDepartmentToEdit(null);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    const departmentFound = departments.find(d => d.id === departmentId);
    if (departmentFound) {
      setDepartmentToDelete(departmentFound);
      setIsDeleteModalOpen(true);
      setIsViewModalOpen(false);
    }
  };

  const confirmDeleteDepartment = async () => {
    if (departmentToDelete) {
      console.log(`🗑️ Deleting MAC: ${departmentToDelete.name}`);
      
      try {
        // Delete via API
        const response = await fetch(`/api/departments/${departmentToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          // Remove from local state
          setDepartments(prevDepts => prevDepts.filter(d => d.id !== departmentToDelete.id));
          
          // Update sidebar counts
          refreshCounts();
          
          // Show success message
          setSuccessData({
            title: 'MAC Deleted Successfully',
            message: `${departmentToDelete.name} has been permanently removed.`,
            details: [
              { label: 'Status', value: 'MAC deleted from database' },
              { label: 'Assets', value: 'All linked assets reassigned' },
              { label: 'MAC Code', value: 'Available for reuse' }
            ]
          });
          setIsSuccessDialogOpen(true);
          
          console.log(`✅ Successfully deleted MAC: ${departmentToDelete.name}`);
        } else {
          const errorData = await response.json();
          console.error('❌ Delete failed:', errorData.message);
          alert(`Delete failed: ${errorData.message}`);
        }
      } catch (error) {
        console.error('❌ Error deleting department:', error);
        alert('Error deleting MAC. Please try again.');
      }
      
      // Close modals
      setIsDeleteModalOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const handleViewDepartmentOnMap = (departmentId: string) => {
    console.log(`Redirecting to Live Map to view MAC ${departmentId} facilities`);
    setIsViewModalOpen(false);
    
    // Redirect to Live Map with facility filtering
    window.location.href = '/map';
  };



  // Fullscreen map component
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black w-screen h-screen">
        {/* Fullscreen Controls */}
        <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Department Facilities Map</h2>
          
          {/* Fullscreen Filters */}
          <div className="space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={mapSearchTerm}
                onChange={(e) => setMapSearchTerm(e.target.value)}
                className="pl-9 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={mapFilterDepartment}
                onChange={(e) => setMapFilterDepartment(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All MACs</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.code}</option>
                ))}
              </select>
              
              <select
                value={mapFilterType}
                onChange={(e) => setMapFilterType(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="ministry">Ministry</option>
                <option value="hospital">Hospital</option>
                <option value="school">School</option>
                <option value="warehouse">Warehouse</option>
                <option value="military_base">Military Base</option>
              </select>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsFullScreen(false)}
          className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Exit Fullscreen"
        >
          <ArrowsPointingOutIcon className="h-5 w-5 text-gray-900 dark:text-white" />
        </button>

        {/* Facilities List in Fullscreen */}
        <div className="absolute top-4 right-20 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto w-80">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Facilities ({filteredFacilities.length})</h3>
          <div className="space-y-2">
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                onClick={() => navigateToFacility(facility)}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{facility.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{facility.department}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(facility.status)}`}>
                    {facility.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-full">
          {MAPBOX_TOKEN !== 'demo-token' && MAPBOX_TOKEN?.startsWith('pk.') ? (
            <Map
              ref={mapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{
                longitude: -10.7969,
                latitude: 6.2907,
                zoom: 11
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
            >
              {filteredFacilities.map((facility) => (
                <Marker
                  key={facility.id}
                  longitude={facility.coordinates[0]}
                  latitude={facility.coordinates[1]}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedFacility(facility);
                  }}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center">
                    <BuildingOfficeIcon className="h-4 w-4 text-white" />
                  </div>
                </Marker>
              ))}

              {selectedFacility && (
                <Popup
                  longitude={selectedFacility.coordinates[0]}
                  latitude={selectedFacility.coordinates[1]}
                  anchor="top"
                  onClose={() => setSelectedFacility(null)}
                  className="max-w-xs"
                >
                  <div className="p-3">
                    <h3 className="font-semibold text-lg">{selectedFacility.name}</h3>
                    <p className="text-sm text-gray-600">Department: {selectedFacility.department}</p>
                    <p className="text-sm text-gray-600">Type: {selectedFacility.type}</p>
                    <p className="text-sm text-gray-600">Status: {selectedFacility.status}</p>
                    <p className="text-sm text-gray-600">Contact: {selectedFacility.contactPerson}</p>
                  </div>
                </Popup>
              )}
            </Map>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Add Mapbox token to view facilities map</p>
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
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white">MACs Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">Manage MACs and view their facilities</p>
        </div>
        <div className="flex justify-end">
          <FloatingActionButton
            onClick={() => setIsAddModalOpen(true)}
            label="Add MAC"
            icon={PlusIcon}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            MACs Overview
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Overview Content */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total MACs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{departments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {departments.reduce((total, dept) => total + dept.employeeCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vehicles</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {departments.reduce((total, dept) => total + dept.vehicleCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3">
              <ComputerDesktopIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Equipment</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {departments.reduce((total, dept) => total + dept.equipmentCount, 0)}
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
                placeholder="Search MACs by name, code, or head of MAC..."
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
                <option value="ministry">Ministries</option>
                <option value="agency">Agencies</option>
                <option value="bureau">Bureaus</option>
                <option value="commission">Commissions</option>
                <option value="authority">Authorities</option>
              </select>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="restructuring">Restructuring</option>
            </select>
          </div>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div 
            key={department.id} 
            onClick={() => handleCardClick(department.id)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
          >
            {/* Card Header */}
            <div className="relative bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{department.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Code: {department.code}</p>
                  <div className="mt-2 flex space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(department.type)}`}>
                      {department.type}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(department.status)}`}>
                      {department.status}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              {/* Head of Department */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Head of Department</h4>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {department.headOfDepartment ? department.headOfDepartment.split(' ').map(n => n[0]).join('') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{department.headOfDepartment || 'Not Assigned'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{department.email}</p>
                  </div>
                </div>
              </div>

              {/* Asset Overview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Asset Overview</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{department.employeeCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Employees</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <TruckIcon className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{department.vehicleCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Vehicles</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <BuildingOfficeIcon className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{department.facilityCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Facilities</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <ComputerDesktopIcon className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{department.equipmentCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Equipment</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget and Contact */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Annual Budget</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${department.budget.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
                    <p className="text-sm text-gray-900 dark:text-white">{department.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No MACs found matching your filters.</p>
        </div>
      )}
        </>
      )}

      {/* Map Tab Content */}
      {activeTab === 'map' && (
        <>
          {/* Map Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search facilities by name, address, or contact person..."
                    value={mapSearchTerm}
                    onChange={(e) => setMapSearchTerm(e.target.value)}
                    className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={mapFilterDepartment}
                    onChange={(e) => setMapFilterDepartment(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All MACs</option>
                    {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <select
                  value={mapFilterType}
                  onChange={(e) => setMapFilterType(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="ministry">Ministry</option>
                  <option value="hospital">Hospital</option>
                  <option value="school">School</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="military_base">Military Base</option>
                </select>
                
                <button
                  onClick={() => setIsFullScreen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                  <span>Fullscreen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Split View: Map + Facilities List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Facilities List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Facilities ({filteredFacilities.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredFacilities.map((facility) => (
                  <div
                    key={facility.id}
                    onClick={() => navigateToFacility(facility)}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{facility.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{facility.department}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{facility.address}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(facility.status)}`}>
                        {facility.status}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{facility.type}</p>
                    </div>
                  </div>
                ))}
                
                {filteredFacilities.length === 0 && (
                  <div className="text-center py-8">
                    <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No facilities found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <div className="relative h-[600px] rounded-lg overflow-hidden shadow-lg">
                {MAPBOX_TOKEN !== 'demo-token' && MAPBOX_TOKEN?.startsWith('pk.') ? (
                  <Map
                    ref={mapRef}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    initialViewState={{
                      longitude: -10.7969,
                      latitude: 6.2907,
                      zoom: 11
                    }}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                  >
                    {filteredFacilities.map((facility) => (
                      <Marker
                        key={facility.id}
                        longitude={facility.coordinates[0]}
                        latitude={facility.coordinates[1]}
                        anchor="bottom"
                        onClick={(e) => {
                          e.originalEvent.stopPropagation();
                          setSelectedFacility(facility);
                        }}
                      >
                        <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center">
                          <BuildingOfficeIcon className="h-4 w-4 text-white" />
                        </div>
                      </Marker>
                    ))}

                    {selectedFacility && (
                      <Popup
                        longitude={selectedFacility.coordinates[0]}
                        latitude={selectedFacility.coordinates[1]}
                        anchor="top"
                        onClose={() => setSelectedFacility(null)}
                        className="max-w-xs"
                      >
                        <div className="p-3">
                          <h3 className="font-semibold text-lg">{selectedFacility.name}</h3>
                          <p className="text-sm text-gray-600">Department: {selectedFacility.department}</p>
                          <p className="text-sm text-gray-600">Type: {selectedFacility.type}</p>
                          <p className="text-sm text-gray-600">Status: {selectedFacility.status}</p>
                          <p className="text-sm text-gray-600">Contact: {selectedFacility.contactPerson}</p>
                          <div className="mt-2">
                            <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      </Popup>
                    )}
                  </Map>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                    <MapPinIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Department Facilities Map</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      Add your Mapbox access token to view the interactive facilities map
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Department Modal */}
      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* View Department Modal */}
      <ViewDepartmentModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        departmentId={selectedDepartmentId}
        onEdit={handleEditDepartment}
        onDelete={handleDeleteDepartment}
        onViewOnMap={handleViewDepartmentOnMap}
      />

      {/* Edit MAC Modal */}
      <EditMACModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setDepartmentToEdit(null);
        }}
        onSave={handleSaveEditedDepartment}
        department={departmentToEdit}
      />

      {/* Custom Delete MAC Modal */}
      {departmentToDelete && (
        <DeleteMACModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDepartmentToDelete(null);
          }}
          onConfirm={confirmDeleteDepartment}
          macName={departmentToDelete.name}
          macCode={departmentToDelete.code}
          employeeCount={departmentToDelete.employeeCount}
          vehicleCount={departmentToDelete.vehicleCount}
          facilityCount={departmentToDelete.facilityCount}
          equipmentCount={departmentToDelete.equipmentCount}
        />
      )}

      {/* Success Confirmation Dialog */}
      <SuccessConfirmationDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => {
          setIsSuccessDialogOpen(false);
          // Clear success data to prevent stale content
          setSuccessData({ title: '', message: '', details: [] });
        }}
        title={successData.title}
        message={successData.message}
        details={successData.details}
        actionLabel="View Department"
        onAction={() => {
          setActiveTab('overview');
          setIsSuccessDialogOpen(false);
          setSuccessData({ title: '', message: '', details: [] });
        }}
      />
    </div>
  );
};

export default Departments;
