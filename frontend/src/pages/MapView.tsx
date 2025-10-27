import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl';
import { ArrowsPointingOutIcon, MapPinIcon, FunnelIcon, MagnifyingGlassIcon, TruckIcon, BuildingOfficeIcon, ComputerDesktopIcon, GlobeAltIcon, CubeIcon, ExclamationTriangleIcon, ShieldCheckIcon, RadioIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { filterByDepartment, getEmptyStateMessage, hasValidMACAssignment, isDepartmentAdmin } from '../utils/departmentFilter';
import CommandCenterHUD from '../components/map/CommandCenterHUD';
import AssetControlPopup from '../components/map/AssetControlPopup';
import MapNotification from '../components/map/MapNotification';
import ViewVehicleModal from '../components/ViewVehicleModal';
import ViewFacilityModal from '../components/ViewFacilityModal';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox token - set your real token in .env
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'demo-token';

interface Asset {
  id: string;
  name: string;
  type: 'vehicle' | 'facility' | 'equipment';
  subType: string; // car, truck, ministry, hospital, laptop, etc.
  coordinates: [number, number];
  status: 'active' | 'inactive' | 'maintenance' | 'operational' | 'available';
  department: string;
  assignedTo?: string;
  lastUpdate: string;
  details: {
    address?: string;
    licensePlate?: string;
    serialNumber?: string;
    contactPerson?: string;
    capacity?: number;
    fuelLevel?: number;
    batteryLevel?: number;
    gpsTracker?: string;
    securityLevel?: string;
    facilityName?: string;
    room?: string;
    condition?: string;
  };
}

// Custom Mapbox style
const CUSTOM_MAP_STYLE = 'mapbox://styles/lejohnsongroup/cmfd5oeek007t01s9gih21q58';

// Map style options
const MAP_STYLES = {
  custom: CUSTOM_MAP_STYLE,
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  hybrid: 'mapbox://styles/mapbox/satellite-streets-v12'
};

const MapView = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [mapNotifications, setMapNotifications] = useState<any[]>([]);
  const mapRef = useRef<any>();

  // Show in-map notification
  const showMapNotification = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    const notification = {
      id: `notif-${Date.now()}`,
      type,
      title,
      message,
      duration: 3000
    }
    
    setMapNotifications(prev => [...prev, notification])
    
    // Auto-dismiss after duration
    setTimeout(() => {
      setMapNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, notification.duration)
  }

  const dismissNotification = (id: string) => {
    setMapNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  // Map control states
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('hybrid');
  const [showControls, setShowControls] = useState(true);
  const [showMobileHUD, setShowMobileHUD] = useState(false);
  const [mapPitch, setMapPitch] = useState(0); // Map tilt angle
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Data states for command center
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [error, setError] = useState<string>('');

  // Map control functions
  const handleStyleChange = (style: keyof typeof MAP_STYLES) => {
    setMapStyle(style);
    console.log(`🗺️ Map style changed to: ${style}`);
  };

  const toggleMapTilt = () => {
    const newPitch = mapPitch === 0 ? 45 : 0;
    setMapPitch(newPitch);
    
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: newPitch,
        duration: 1000
      });
    }
    console.log(`🗺️ Map pitch changed to: ${newPitch}°`);
  };

  const resetMapView = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [-10.7969, 6.3005], // Monrovia, Liberia
        zoom: 12,
        pitch: 0,
        bearing: 0,
        duration: 2000
      });
    }
    setMapPitch(0);
  };

  // Fetch all assets from APIs for comprehensive command center
  const fetchAllAssets = async () => {
    setIsLoadingAssets(true);
    setError('');
    
    try {
      console.log('🔄 Fetching all government assets for command center...');
      
      // Fetch all asset types in parallel
      const [vehiclesResponse, facilitiesResponse, equipmentResponse] = await Promise.all([
        fetch('http://localhost:5000/api/vehicles'),
        fetch('http://localhost:5000/api/facilities'),
        fetch('http://localhost:5000/api/equipment')
      ]);

      const vehiclesResult = await vehiclesResponse.json();
      const facilitiesResult = await facilitiesResponse.json();
      const equipmentResult = await equipmentResponse.json();

      console.log('📊 API Results:', {
        vehicles: vehiclesResult.success ? vehiclesResult.vehicles?.length : 0,
        facilities: facilitiesResult.success ? facilitiesResult.facilities?.length : 0,
        equipment: equipmentResult.success ? equipmentResult.equipment?.length : 0
      });

      const allAssets: Asset[] = [];

      // Add vehicles to assets
      if (vehiclesResult.success && vehiclesResult.vehicles) {
        vehiclesResult.vehicles.forEach((vehicle: any, index: number) => {
          // Generate realistic GPS coordinates for vehicles (since API doesn't have lat/lng yet)
          const baseCoords = [-10.7969, 6.2907]; // Monrovia center
          const offset = index * 0.01; // Spread vehicles around Monrovia
          const coordinates: [number, number] = [
            baseCoords[0] + (index % 2 === 0 ? offset : -offset),
            baseCoords[1] + (Math.floor(index / 2) % 2 === 0 ? offset : -offset)
          ];
          
          allAssets.push({
            id: vehicle.id,
            name: `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`,
            type: 'vehicle',
            subType: vehicle.vehicleType || 'car',
            coordinates: coordinates,
            status: vehicle.status,
            department: vehicle.department,
            assignedTo: vehicle.assignedEmployee?.name || 'Unassigned',
            lastUpdate: vehicle.updatedAt || new Date().toISOString(),
            details: {
              licensePlate: vehicle.plateNumber,
              fuelLevel: vehicle.fuelLevel,
              gpsTracker: vehicle.gpsTracker // Tracked by GPS handler
            }
          });
          
          console.log(`🚗 Added vehicle: ${vehicle.plateNumber} at coordinates ${coordinates}`);
        });
      }

      // Add facilities to assets
      if (facilitiesResult.success && facilitiesResult.facilities) {
        facilitiesResult.facilities.forEach((facility: any) => {
          if (facility.coordinates && facility.coordinates.length === 2) {
            allAssets.push({
              id: facility.id,
              name: facility.name,
              type: 'facility',
              subType: facility.type,
              coordinates: facility.coordinates, // [longitude, latitude]
              status: facility.status || 'operational',
              department: facility.department,
              assignedTo: facility.contactPerson,
              lastUpdate: facility.updatedAt || new Date().toISOString(),
              details: {
                address: facility.address,
                contactPerson: facility.contactPerson,
                capacity: facility.capacity,
                securityLevel: facility.securityLevel
              }
            });
            
            console.log(`🏢 Added facility: ${facility.name} at coordinates ${facility.coordinates}`);
          } else {
            console.warn(`⚠️ Facility ${facility.name} has no GPS coordinates - skipped from map`);
          }
        });
      }

      // Add tracked equipment to assets (only equipment with GPS/location tracking)
      if (equipmentResult.success && equipmentResult.equipment) {
        equipmentResult.equipment.forEach((equipment: any) => {
          // Only add equipment that has facility assignment (for location tracking)
          if (equipment.facility && equipment.facility.id) {
            // Find the facility to get coordinates
            const facility = facilitiesResult.facilities?.find((f: any) => f.id === equipment.facility.id);
            if (facility && facility.location) {
              allAssets.push({
                id: equipment.id,
                name: equipment.name,
                type: 'equipment',
                subType: equipment.type,
                coordinates: facility.location, // Use facility coordinates
                status: equipment.status,
                department: equipment.department,
                assignedTo: equipment.assignedEmployee?.name || 'Unassigned',
                lastUpdate: equipment.updatedAt || new Date().toISOString(),
                details: {
                  serialNumber: equipment.serialNumber,
                  facilityName: equipment.facility.name,
                  room: equipment.facility.room,
                  condition: equipment.condition
                }
              });
              
              console.log(`🖥️ Added equipment: ${equipment.name} at facility ${facility.name} (${facility.location})`);
            } else {
              console.warn(`⚠️ Equipment ${equipment.name} facility ${equipment.facility.id} not found or has no GPS`);
            }
          } else {
            console.warn(`⚠️ Equipment ${equipment.name} has no facility assignment - not tracked on map`);
          }
        });
      }

      console.log(`✅ Command Center loaded: ${allAssets.length} total assets`);
      console.log('📊 Asset breakdown:', {
        vehicles: allAssets.filter(a => a.type === 'vehicle').length,
        facilities: allAssets.filter(a => a.type === 'facility').length,
        equipment: allAssets.filter(a => a.type === 'equipment').length
      });

      setAssets(allAssets);
    } catch (error) {
      console.error('❌ Error fetching assets:', error);
      setError('Failed to load government assets');
      // Fallback to mock data
      setAssets(mockAssets);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  // Fetch assets on component mount
  useEffect(() => {
    fetchAllAssets();
  }, []);

  // Listen for global refresh events
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🔄 Live Map received global refresh event');
      fetchAllAssets();
    };

    window.addEventListener('refreshAllAssets', handleGlobalRefresh);
    return () => {
      window.removeEventListener('refreshAllAssets', handleGlobalRefresh);
    };
  }, []);

  // Listen for real-time GPS position updates
  useEffect(() => {
    console.log('🛰️ Setting up real-time GPS tracking on map...');
    const socket = io('http://localhost:5000');
    
    // Listen for GPS position updates
    socket.on('gps:position', (data) => {
      console.log('📍 GPS position update received on map:', data);
      
      // Find the vehicle in assets and update its coordinates
      setAssets(prevAssets => {
        return prevAssets.map(asset => {
          if (asset.type === 'vehicle' && asset.details.gpsTracker && 
              asset.id === data.vehicleId) {
            console.log(`✅ Updating vehicle ${asset.name} to GPS coordinates: ${data.latitude}, ${data.longitude}`);
            return {
              ...asset,
              coordinates: [data.longitude, data.latitude], // [lng, lat] for mapbox
              lastUpdate: data.timestamp,
              details: {
                ...asset.details,
                batteryLevel: data.batteryLevel,
                signalStrength: data.signalStrength
              }
            };
          }
          return asset;
        });
      });
    });
    
    // Listen for GPS alarms
    socket.on('gps:alarm', (alarm) => {
      console.log('🚨 GPS Alarm received on map:', alarm);
      showMapNotification('warning', 'GPS Alarm', `Vehicle ${alarm.vehicleId}: ${alarm.message || 'Alarm triggered'}`);
    });
    
    // Listen for device heartbeat
    socket.on('gps:heartbeat', (data) => {
      console.log('💓 GPS heartbeat received:', data);
    });
    
    return () => {
      console.log('🛰️ Disconnecting GPS socket');
      socket.disconnect();
    };
  }, []);

  // Mock assets as fallback
  const mockAssets: Asset[] = [
    // Government Vehicles
    {
      id: 'VH001',
      name: 'Ministry Health Toyota Hilux',
      type: 'vehicle',
      subType: 'truck',
      coordinates: [-10.7969, 6.2907],
      status: 'active',
      department: 'Ministry of Health',
      assignedTo: 'Dr. Sarah Johnson',
      lastUpdate: '2024-01-15 09:30',
      details: {
        licensePlate: 'LBR-001-GOV',
        fuelLevel: 75
      }
    },
    {
      id: 'VH002',
      name: 'Defense Ministry Patrol Vehicle',
      type: 'vehicle',
      subType: 'car',
      coordinates: [-10.7900, 6.2700],
      status: 'active',
      department: 'Ministry of Defense',
      assignedTo: 'Security Team Alpha',
      lastUpdate: '2024-01-15 08:15',
      details: {
        licensePlate: 'LBR-002-GOV',
        fuelLevel: 45
      }
    },
    {
      id: 'VH003',
      name: 'Agriculture Field Motorcycle',
      type: 'vehicle',
      subType: 'motorcycle',
      coordinates: [-9.3120, 6.8870],
      status: 'active',
      department: 'Ministry of Agriculture',
      assignedTo: 'John Doe',
      lastUpdate: '2024-01-15 07:45',
      details: {
        licensePlate: 'LBR-003-GOV',
        fuelLevel: 80
      }
    },
    {
      id: 'VH004',
      name: 'GSA Transport Bus',
      type: 'vehicle',
      subType: 'bus',
      coordinates: [-10.7600, 6.3100],
      status: 'maintenance',
      department: 'General Services Agency',
      lastUpdate: '2024-01-14 16:30',
      details: {
        licensePlate: 'LBR-004-GOV',
        fuelLevel: 25
      }
    },
    
    // Government Facilities
    {
      id: 'FC001',
      name: 'Ministry of Health Headquarters',
      type: 'facility',
      subType: 'ministry',
      coordinates: [-10.7800, 6.2800],
      status: 'operational',
      department: 'Ministry of Health',
      lastUpdate: '2024-01-15 08:00',
      details: {
        address: 'Capitol Hill, Monrovia',
        contactPerson: 'Dr. Sarah Johnson',
        capacity: 500
      }
    },
    {
      id: 'FC002',
      name: 'JFK Memorial Medical Center',
      type: 'facility',
      subType: 'hospital',
      coordinates: [-10.7850, 6.2950],
      status: 'operational',
      department: 'Ministry of Health',
      lastUpdate: '2024-01-15 06:00',
      details: {
        address: 'Sinkor, Monrovia',
        contactPerson: 'Dr. Michael Brown',
        capacity: 300
      }
    },
    {
      id: 'FC003',
      name: 'Central Government Warehouse',
      type: 'facility',
      subType: 'warehouse',
      coordinates: [-10.7600, 6.3100],
      status: 'operational',
      department: 'General Services Agency',
      lastUpdate: '2024-01-15 07:00',
      details: {
        address: 'Bushrod Island, Monrovia',
        contactPerson: 'John Wilson',
        capacity: 1000
      }
    },
    {
      id: 'FC004',
      name: 'Defense Ministry Headquarters',
      type: 'facility',
      subType: 'military_base',
      coordinates: [-10.7900, 6.2700],
      status: 'operational',
      department: 'Ministry of Defense',
      lastUpdate: '2024-01-15 08:30',
      details: {
        address: 'Camp Johnson Road, Monrovia',
        contactPerson: 'General Robert Smith',
        capacity: 800
      }
    },
    {
      id: 'FC005',
      name: 'University of Liberia Campus',
      type: 'facility',
      subType: 'school',
      coordinates: [-10.7750, 6.2850],
      status: 'maintenance',
      department: 'Ministry of Education',
      lastUpdate: '2024-01-12 17:00',
      details: {
        address: 'Capitol Hill, Monrovia',
        contactPerson: 'Prof. Mary Davis',
        capacity: 5000
      }
    },
    
    // Tracked Equipment (with GPS/location tracking)
    {
      id: 'EQ001',
      name: 'Field Data Collection Tablet',
      type: 'equipment',
      subType: 'tablet',
      coordinates: [-10.3450, 6.5180],
      status: 'active',
      department: 'Ministry of Agriculture',
      assignedTo: 'Field Officer James',
      lastUpdate: '2024-01-15 10:15',
      details: {
        serialNumber: 'IPD129-003',
        batteryLevel: 85
      }
    },
    {
      id: 'EQ002',
      name: 'Security Radio Unit',
      type: 'equipment',
      subType: 'radio',
      coordinates: [-10.7900, 6.2700],
      status: 'active',
      department: 'Ministry of Defense',
      assignedTo: 'Security Team Bravo',
      lastUpdate: '2024-01-15 09:45',
      details: {
        serialNumber: 'MOT200-005',
        batteryLevel: 92
      }
    },
    {
      id: 'EQ003',
      name: 'Medical Equipment Monitor',
      type: 'equipment',
      subType: 'medical_device',
      coordinates: [-10.7850, 6.2950],
      status: 'active',
      department: 'Ministry of Health',
      assignedTo: 'Dr. Michael Brown',
      lastUpdate: '2024-01-15 08:20',
      details: {
        serialNumber: 'MED-MON-001',
        batteryLevel: 78
      }
    }
  ];

  // First filter by user's department/MAC access
  const departmentFilteredAssets = filterByDepartment(assets, user);
  
  // Then apply search and other filters
  const filteredAssets = departmentFilteredAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.assignedTo && asset.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (asset.details.licensePlate && asset.details.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesDepartment = filterDepartment === 'all' || asset.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    
    return matchesSearch && matchesType && matchesDepartment && matchesStatus;
  });

  // Get unique departments for filter
  const departments = [...new Set(assets.map(asset => asset.department))];

  const getMarkerColor = (asset: Asset) => {
    if (asset.status === 'maintenance') return '#f59e0b';
    if (asset.status === 'inactive') return '#6b7280';
    
    switch (asset.type) {
      case 'vehicle': return '#10b981';
      case 'facility': return '#3b82f6';
      case 'equipment': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getMarkerIcon = (asset: Asset) => {
    switch (asset.type) {
      case 'vehicle':
        return <TruckIcon className="h-4 w-4 text-white" />;
      case 'facility':
        return <BuildingOfficeIcon className="h-4 w-4 text-white" />;
      case 'equipment':
        return <ComputerDesktopIcon className="h-4 w-4 text-white" />;
      default:
        return <MapPinIcon className="h-4 w-4 text-white" />;
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Debug the token
  console.log('Mapbox token:', MAPBOX_TOKEN);
  console.log('Token starts with pk:', MAPBOX_TOKEN.startsWith('pk.'));

  // Auto-focus on specific asset when navigated from other pages
  useEffect(() => {
    if (location.state?.focusVehicle) {
      const vehicleId = location.state.focusVehicle;
      console.log(`Auto-focusing on vehicle: ${vehicleId}`);
      
      // Auto-open fullscreen if requested
      if (location.state?.openFullscreen) {
        console.log('Auto-opening fullscreen map for vehicle tracking');
        setIsFullScreen(true);
      }
      
      // Find the vehicle in assets
      const vehicle = filteredAssets.find(asset => asset.id === vehicleId);
      if (vehicle) {
        setSelectedAsset(vehicle);
        
        setTimeout(() => {
          if (mapRef.current) {
            console.log(`Flying to vehicle coordinates: ${vehicle.coordinates}`);
            mapRef.current.flyTo({
              center: vehicle.coordinates,
              zoom: 16,
              duration: 2000
            });
          }
        }, 1000); // Wait for map to load
      }
    }
    
    if (location.state?.focusEquipment) {
      const equipmentId = location.state.focusEquipment;
      console.log(`Auto-focusing on equipment: ${equipmentId}`);
      
      // Auto-open fullscreen for equipment location viewing
      console.log('Auto-opening fullscreen map for equipment location');
      setIsFullScreen(true);
      
      // Find the equipment in assets
      const equipment = filteredAssets.find(asset => asset.id === equipmentId);
      if (equipment) {
        setSelectedAsset(equipment);
        
        setTimeout(() => {
          if (mapRef.current) {
            console.log(`Flying to equipment coordinates: ${equipment.coordinates}`);
            mapRef.current.flyTo({
              center: equipment.coordinates,
              zoom: 16,
              duration: 2000
            });
          }
        }, 1000);
      }
    }
    
    // Auto-track vehicle when navigated from vehicle details
    if (location.state?.trackVehicle) {
      const vehicleId = location.state.trackVehicle;
      const vehicleName = location.state?.vehicleName;
      const vehicleCoordinates = location.state?.vehicleCoordinates;
      
      console.log(`🗺️ AUTO-TRACKING VEHICLE:`, {
        id: vehicleId,
        name: vehicleName,
        coordinates: vehicleCoordinates,
        debugInfo: location.state?.debugInfo,
        timestamp: location.state?.timestamp
      });
      
      // Find the vehicle in assets and auto-select it
      setTimeout(() => {
        const vehicleAsset = filteredAssets.find(a => a.id === vehicleId);
        if (vehicleAsset) {
          console.log(`✅ Found vehicle in assets:`, vehicleAsset);
          setSelectedAsset(vehicleAsset);
          
          // Auto-focus on vehicle location
          if (mapRef.current && vehicleCoordinates) {
            console.log(`🚁 Flying to vehicle: ${vehicleName} at coordinates ${vehicleCoordinates}`);
            mapRef.current.flyTo({
              center: vehicleCoordinates,
              zoom: 16,
              duration: 2000
            });
          }
        } else {
          console.log(`❌ Vehicle ${vehicleId} not found in current assets`);
        }
      }, 1000);
    }
  }, [location.state, filteredAssets]);

  // Fallback map when Mapbox token is not available
  const renderMap = () => {
    if (MAPBOX_TOKEN === 'demo-token' || !MAPBOX_TOKEN || !MAPBOX_TOKEN.startsWith('pk.')) {
      return (
        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
          <MapPinIcon className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Interactive Map</h3>
          <p className="text-gray-500 text-center max-w-md">
            Add your Mapbox access token to frontend/.env as VITE_MAPBOX_TOKEN to enable the interactive map
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Current token status: {MAPBOX_TOKEN === 'demo-token' ? 'Not found' : `Found (${MAPBOX_TOKEN.substring(0, 10)}...)`}
          </p>
          
          {/* Mock asset markers */}
          <div className="mt-8 space-y-3">
            {assets.map((asset) => (
              <div 
                key={asset.id} 
                className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedAsset(selectedAsset?.id === asset.id ? null : asset)}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: getMarkerColor(asset) }}
                />
                <div>
                  <p className="font-medium text-sm">{asset.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{asset.type} • {asset.status}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedAsset && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
              <h4 className="font-semibold text-blue-900">{selectedAsset.name}</h4>
              <p className="text-blue-700 text-sm capitalize">Type: {selectedAsset.type}</p>
              <p className="text-blue-700 text-sm capitalize">Status: {selectedAsset.status}</p>
              <p className="text-blue-700 text-sm">Coordinates: {selectedAsset.coordinates[1]}, {selectedAsset.coordinates[0]}</p>
              <button 
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                onClick={() => setSelectedAsset(null)}
              >
                Close Details
              </button>
            </div>
          )}
        </div>
      );
    }

    // Real Mapbox implementation
    console.log('🗺️ Loading interactive Mapbox map...');
    console.log('🗺️ Token valid:', MAPBOX_TOKEN.startsWith('pk.'));
    
    try {
      return (
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: -10.7969,
            latitude: 6.2907,
            zoom: 12,
            pitch: mapPitch,
            bearing: 0
          }}
          style={{ 
            width: isFullScreen ? '100vw' : '100%', 
            height: isFullScreen ? '100vh' : '100%',
            display: 'block'
          }}
          mapStyle={MAP_STYLES[mapStyle]}
          onLoad={() => {
            console.log('🗺️ Interactive map loaded successfully!');
            console.log('🎨 Using style:', MAP_STYLES[mapStyle]);
            console.log('🎛️ Controls should be visible: tilt, style selector, reset view');
          }}
          onError={(error) => {
            console.error('❌ Mapbox error:', error);
          }}
          projection="globe" // 3D globe view
          terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        >
          {/* Map Controls */}
          <NavigationControl position="top-right" showCompass={true} showZoom={true} />
          <FullscreenControl position="top-right" />
          <ScaleControl position="bottom-left" maxWidth={100} unit="metric" />
        {filteredAssets.map((asset) => (
          <Marker
            key={asset.id}
            longitude={asset.coordinates[0]}
            latitude={asset.coordinates[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedAsset(asset);
            }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
              style={{ backgroundColor: getMarkerColor(asset) }}
            >
              {getMarkerIcon(asset)}
            </div>
          </Marker>
        ))}

        {selectedAsset && (
          <Popup
            longitude={selectedAsset.coordinates[0]}
            latitude={selectedAsset.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedAsset(null)}
            closeButton={false}
            className="command-center-popup"
          >
            <AssetControlPopup
              asset={selectedAsset}
              onClose={() => setSelectedAsset(null)}
              onViewVehicleDetails={(vehicleId) => {
                console.log(`Opening vehicle details for: ${vehicleId}`)
                setSelectedVehicleId(vehicleId)
                setIsVehicleModalOpen(true)
              }}
              onViewFacilityDetails={(facilityId) => {
                console.log(`Opening facility details for: ${facilityId}`)
                setSelectedFacilityId(facilityId)
                setIsFacilityModalOpen(true)
              }}
            />
          </Popup>
        )}

            {/* Custom Map Style Controls - Responsive */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 lg:p-3">
              <h4 className="text-xs lg:text-sm font-semibold text-gray-900 dark:text-white mb-2 lg:mb-3 hidden lg:block">Map Style</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleStyleChange('hybrid')}
                  className={`w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors flex items-center justify-center lg:justify-start space-x-1 lg:space-x-2 ${
                    mapStyle === 'hybrid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  <CubeIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline">Hybrid</span>
                </button>
                <button
                  onClick={() => handleStyleChange('streets')}
                  className={`w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors flex items-center justify-center lg:justify-start space-x-1 lg:space-x-2 ${
                    mapStyle === 'streets'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  <MapPinIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline">Streets</span>
                </button>
                <button
                  onClick={() => handleStyleChange('satellite')}
                  className={`w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors flex items-center justify-center lg:justify-start space-x-1 lg:space-x-2 ${
                    mapStyle === 'satellite'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  <GlobeAltIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline">Satellite</span>
                </button>
                <button
                  onClick={() => handleStyleChange('custom')}
                  className={`w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors flex items-center justify-center lg:justify-start space-x-1 lg:space-x-2 ${
                    mapStyle === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  <GlobeAltIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline">Custom</span>
                </button>
              </div>
            </div>
          </div>

          {/* Map View Controls - Moved up and responsive */}
          <div className="absolute bottom-32 lg:bottom-4 right-4 z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 lg:p-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 hidden lg:block">View Controls</h4>
              <div className="space-y-2">
                <button
                  onClick={toggleMapTilt}
                  className={`w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors flex items-center justify-center lg:justify-start space-x-1 lg:space-x-2 ${
                    mapPitch > 0
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                  title={mapPitch > 0 ? `Tilt: ${mapPitch}°` : 'Enable Tilt'}
                >
                  <CubeIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline">{mapPitch > 0 ? `Tilt: ${mapPitch}°` : 'Enable Tilt'}</span>
                </button>
                <button
                  onClick={resetMapView}
                  className="w-full px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 flex items-center justify-center lg:justify-start space-x-1 lg:space-x-2"
                  title="Reset View"
                >
                  <MapPinIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline">Reset View</span>
                </button>
              </div>
            </div>
          </div>

          {/* Command Center HUD - Always visible, tap to expand/collapse */}
          <div className="absolute bottom-4 left-4 right-4 lg:left-80 lg:right-auto lg:w-72 z-10">
            <CommandCenterHUD
              totalAssets={filteredAssets.length}
              activeVehicles={filteredAssets.filter(a => a.type === 'vehicle' && a.status === 'active').length}
              operationalFacilities={filteredAssets.filter(a => a.type === 'facility' && a.status === 'operational').length}
              onlineEquipment={filteredAssets.filter(a => a.type === 'equipment' && a.status === 'active').length}
              activePersonnel={filteredAssets.filter(a => a.type === 'personnel' && a.status === 'active').length}
              alertCount={filteredAssets.filter(a => a.status === 'maintenance' || a.status === 'inactive').length}
              lastUpdate={new Date().toLocaleTimeString()}
              filterType={filterType}
              hasSelectedAsset={!!selectedAsset}
              selectedAsset={selectedAsset}
              onSearchAsset={(searchTerm) => {
                console.log(`🔍 Command Center search: ${searchTerm}`)
                setSearchTerm(searchTerm)
              }}
              onSelectAsset={(assetId) => {
                console.log(`🎯 Command Center selecting asset: ${assetId}`)
                const asset = filteredAssets.find(a => a.id === assetId)
                if (asset) {
                  setSelectedAsset(asset)
                }
              }}
              onShowNotification={showMapNotification}
            />
          </div>

          {/* Map Info Panel */}
          <div className="absolute top-4 right-20 z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Live Tracking</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {filteredAssets.length} assets • {mapStyle} • {mapPitch}°
                </p>
              </div>
            </div>
          </div>

        </Map>
      );
    } catch (error) {
      console.error('Map rendering error:', error);
      return (
        <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold text-red-600 mb-2">Map Error</h3>
          <p className="text-red-500 text-center">Failed to load Mapbox map. Check console for details.</p>
          <p className="text-sm text-red-400 mt-2">Token: {MAPBOX_TOKEN.substring(0, 20)}...</p>
        </div>
      );
    }
  };

  if (isFullScreen) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black w-screen h-screen"
        data-fullscreen={isFullScreen}
      >
        {/* Fullscreen Controls & Filters */}
        <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Live Asset Tracking</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Real-time government assets in Liberia</p>
          
          {/* Fullscreen Filters */}
          <div className="space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="vehicle">Vehicles</option>
                <option value="facility">Facilities</option>
                <option value="equipment">Equipment</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={toggleFullScreen}
          className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Exit Fullscreen"
        >
          <ArrowsPointingOutIcon className="h-5 w-5 text-gray-900 dark:text-white" />
        </button>

        {/* Asset Count Summary in Fullscreen */}
        <div className="absolute top-4 right-20 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Assets on Map</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Vehicles:</span>
              <span className="font-medium text-green-600">{filteredAssets.filter(a => a.type === 'vehicle').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Facilities:</span>
              <span className="font-medium text-blue-600">{filteredAssets.filter(a => a.type === 'facility').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Equipment:</span>
              <span className="font-medium text-purple-600">{filteredAssets.filter(a => a.type === 'equipment').length}</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 w-full h-full">
          {renderMap()}
        </div>

        {/* Modals for fullscreen mode */}
        <ViewVehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => {
            setIsVehicleModalOpen(false)
            setSelectedVehicleId(null)
          }}
          vehicleId={selectedVehicleId}
          onTrack={(vehicleId) => {
            console.log(`Tracking vehicle ${vehicleId} from fullscreen modal`)
            setIsVehicleModalOpen(false)
          }}
          onEdit={(vehicleId) => {
            console.log(`Editing vehicle ${vehicleId}`)
          }}
          onDelete={(vehicleId) => {
            console.log(`Deleting vehicle ${vehicleId}`)
          }}
        />

        <ViewFacilityModal
          isOpen={isFacilityModalOpen}
          onClose={() => {
            setIsFacilityModalOpen(false)
            setSelectedFacilityId(null)
          }}
          facilityId={selectedFacilityId}
          onEdit={(facilityId) => {
            console.log(`Editing facility ${facilityId}`)
          }}
          onDelete={(facilityId) => {
            console.log(`Deleting facility ${facilityId}`)
          }}
          onViewOnMap={(facilityId) => {
            console.log(`Viewing facility ${facilityId} on map`)
            setIsFacilityModalOpen(false)
          }}
        />
      </div>
    );
  }

  // Check if department admin has no MAC assignment
  if (isDepartmentAdmin(user) && !hasValidMACAssignment(user)) {
    const emptyState = getEmptyStateMessage(user, 'Assets');
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
            {isDepartmentAdmin(user) ? `${user?.department} Asset Tracking` : 'Live Asset Tracking - Command Center'}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
            {isLoadingAssets ? 'Loading...' : `Real-time monitoring of ${filteredAssets.length} government assets ${isDepartmentAdmin(user) ? `in ${user?.department}` : 'in Liberia'}`}
          </p>
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
            onClick={fetchAllAssets}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingAssets && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading command center data...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchAllAssets}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Assets</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, department, license plate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asset Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="vehicle">Vehicles</option>
                  <option value="facility">Facilities</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="available">Available</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                  setFilterDepartment('all')
                  setFilterStatus('all')
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

      {/* Map Container */}
      {!error && (
        <div 
          className="relative h-[calc(100vh-12rem)] rounded-lg overflow-hidden shadow-lg"
          data-fullscreen={false}
        >
          {renderMap()}

          {/* In-Map Notifications */}
          <MapNotification
            notifications={mapNotifications}
            onDismiss={dismissNotification}
          />

          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs hidden lg:block">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Live Asset Overview</h3>
            
            <div className="space-y-3 text-sm">
              {/* Vehicles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <TruckIcon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Vehicles</span>
                </div>
                <span className="font-semibold text-green-600">
                  {filteredAssets.filter(a => a.type === 'vehicle').length}
                </span>
              </div>
              
              {/* Facilities */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Facilities</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {filteredAssets.filter(a => a.type === 'facility').length}
                </span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">Total Assets:</span>
                  <span className="text-gray-900 dark:text-white">{filteredAssets.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      <ViewVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false)
          setSelectedVehicleId(null)
        }}
        vehicleId={selectedVehicleId}
        onTrack={(vehicleId) => {
          console.log(`Tracking vehicle ${vehicleId} from modal`)
          setIsVehicleModalOpen(false)
        }}
        onEdit={(vehicleId) => {
          console.log(`Editing vehicle ${vehicleId}`)
          // TODO: Open edit vehicle modal
        }}
        onDelete={(vehicleId) => {
          console.log(`Deleting vehicle ${vehicleId}`)
          // TODO: Handle vehicle deletion
        }}
      />

      {/* Facility Details Modal */}
      <ViewFacilityModal
        isOpen={isFacilityModalOpen}
        onClose={() => {
          setIsFacilityModalOpen(false)
          setSelectedFacilityId(null)
        }}
        facilityId={selectedFacilityId}
        onEdit={(facilityId) => {
          console.log(`Editing facility ${facilityId}`)
          // TODO: Open edit facility modal
        }}
        onDelete={(facilityId) => {
          console.log(`Deleting facility ${facilityId}`)
          // TODO: Handle facility deletion
        }}
        onViewOnMap={(facilityId) => {
          console.log(`Viewing facility ${facilityId} on map`)
          setIsFacilityModalOpen(false)
        }}
      />
    </div>
  );
};

export default MapView;
