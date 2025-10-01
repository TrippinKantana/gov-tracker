import { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOfficeIcon, MapPinIcon, UserIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import FacilityMaintenanceManager from './FacilityMaintenanceManager';

interface ViewFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string | null;
  onEdit?: (facilityId: string) => void;
  onDelete?: (facilityId: string) => void;
  onViewOnMap?: (facilityId: string) => void;
}

interface FacilityDetails {
  id: string;
  name: string;
  type: string;
  address: string;
  department: string;
  capacity?: number;
  status: string;
  securityLevel: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  location?: [number, number]; // [longitude, latitude]
  assignedVehicles?: number;
  assignedEquipment?: number;
  lastInspection?: string;
  notes?: string;
  createdAt?: string;
}

const ViewFacilityModal = ({ isOpen, onClose, facilityId, onEdit, onDelete, onViewOnMap }: ViewFacilityModalProps) => {
  const [facility, setFacility] = useState<FacilityDetails | null>(null);
  const [realAssetCounts, setRealAssetCounts] = useState({ vehicles: 0, equipment: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'assets' | 'maintenance'>('overview');

  useEffect(() => {
    if (isOpen && facilityId) {
      fetchFacilityDetails();
      setActiveTab('overview'); // Reset to overview when opening
    }
  }, [isOpen, facilityId]);

  const fetchFacilityDetails = async () => {
    if (!facilityId) return;
    
    setIsLoading(true);
    setError('');
    try {
      console.log(`🔄 Fetching facility details and real asset counts for ${facilityId}...`);
      
      // Fetch facility details and all assets in parallel to calculate real counts
      const [facilityResponse, vehiclesResponse, equipmentResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/facilities/${facilityId}`),
        fetch('http://localhost:5000/api/vehicles'),
        fetch('http://localhost:5000/api/equipment')
      ]);

      const facilityResult = await facilityResponse.json();
      const vehiclesResult = await vehiclesResponse.json();
      const equipmentResult = await equipmentResponse.json();
      
      if (facilityResult.success) {
        const facilityData = facilityResult.facility;
        setFacility(facilityData);
        
        // Calculate REAL asset counts for this facility
        let realVehicleCount = 0;
        let realEquipmentCount = 0;
        
        // Count vehicles actually assigned to this facility
        if (vehiclesResult.success && vehiclesResult.vehicles) {
          realVehicleCount = vehiclesResult.vehicles.filter((vehicle: any) => 
            vehicle.lastLocation?.includes(facilityData.name) || 
            vehicle.department === facilityData.department
          ).length;
        }
        
        // Count equipment actually assigned to this facility
        if (equipmentResult.success && equipmentResult.equipment) {
          realEquipmentCount = equipmentResult.equipment.filter((equipment: any) => 
            equipment.facility?.id === facilityId ||
            equipment.facility?.name === facilityData.name ||
            equipment.location?.includes(facilityData.name)
          ).length;
        }
        
        console.log(`📊 REAL ASSET COUNTS for ${facilityData.name}:`, {
          realVehicles: realVehicleCount,
          realEquipment: realEquipmentCount,
          fakeVehicles: facilityData.assignedVehicles,
          fakeEquipment: facilityData.assignedEquipment
        });
        
        setRealAssetCounts({ 
          vehicles: realVehicleCount, 
          equipment: realEquipmentCount 
        });
      } else {
        throw new Error(facilityResult.message || 'Failed to fetch facility details');
      }
    } catch (error) {
      console.error('Error fetching facility details:', error);
      setError('Failed to load facility details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'under_construction': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'closed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSecurityLevelColor = (level: string | undefined) => {
    if (!level) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'restricted': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm sm:max-w-2xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Header - Responsive */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="bg-blue-500 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                <BuildingOfficeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Facility Details</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Government facility information</p>
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
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading facility details...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {facility && (
              <>
                {/* Facility Header Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                        <BuildingOfficeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{facility.name}</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{facility.type.replace('_', ' ')} • {facility.department}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{facility.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(facility.status)}`}>
                        {facility.status.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSecurityLevelColor(facility.securityLevel)}`}>
                        {facility.securityLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Responsive Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  {/* Mobile: Dropdown */}
                  <div className="sm:hidden">
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as any)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="overview">Overview</option>
                      <option value="location">Location & Contact</option>
                      <option value="assets">Assigned Assets</option>
                      <option value="maintenance">Maintenance & History</option>
                    </select>
                  </div>

                  {/* Desktop: Tab Navigation */}
                  <nav className="hidden sm:flex -mb-px flex-wrap space-x-4 lg:space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-2 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('location')}
                      className={`py-2 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                        activeTab === 'location'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Location & Contact
                    </button>
                    <button
                      onClick={() => setActiveTab('assets')}
                      className={`py-2 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                        activeTab === 'assets'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Assigned Assets
                    </button>
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className={`py-2 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm whitespace-nowrap ${
                        activeTab === 'maintenance'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Maintenance & History
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
                        {/* Facility Details */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Facility Details</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Facility Type</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">{facility.type.replace('_', ' ')}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{facility.department}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                  {facility.capacity ? `${facility.capacity.toLocaleString()} people` : 'Not specified'}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(facility.status)}`}>
                                    {facility.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Security Level</label>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-sm font-semibold ${getSecurityLevelColor(facility.securityLevel)}`}>
                                    {facility.securityLevel}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                  {facility.createdAt ? new Date(facility.createdAt).toLocaleDateString() : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {facility.notes && (
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                              <p className="text-gray-700 dark:text-gray-300">{facility.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location & Contact Tab */}
                    {activeTab === 'location' && (
                      <div className="space-y-6">
                        {/* Address & GPS */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Physical Location</h3>
                          <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <MapPinIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                  <label className="text-sm font-medium text-blue-700 dark:text-blue-300">Address</label>
                                  <p className="text-lg font-medium text-gray-900 dark:text-white">{facility.address}</p>
                                </div>
                              </div>
                            </div>
                            
                            {facility.location && (
                              <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">GPS Coordinates</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white font-mono">
                                  {facility.location[1]}, {facility.location[0]}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Latitude: {facility.location[1]} • Longitude: {facility.location[0]}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                          <div className="space-y-4">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{facility.contactPerson}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Primary Contact</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                  <PhoneIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{facility.contactPhone}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                  </div>
                                </div>
                              </div>

                              {facility.contactEmail && (
                                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                  <div className="flex items-center space-x-3">
                                    <EnvelopeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    <div>
                                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{facility.contactEmail}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                    </div>
                                  </div>
                                </div>
                              )}
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
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {realAssetCounts.vehicles}
                              </p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">Vehicles</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to this facility</p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {realAssetCounts.equipment}
                              </p>
                              <p className="text-lg font-medium text-gray-900 dark:text-white">Equipment</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to this facility</p>
                            </div>
                          </div>
                        </div>

                        {/* Asset Details */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asset Distribution</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded">
                              <span className="text-gray-700 dark:text-gray-300">Government Vehicles</span>
                              <span className="font-semibold text-green-600 dark:text-green-400">{realAssetCounts.vehicles} units</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded">
                              <span className="text-gray-700 dark:text-gray-300">Equipment & Technology</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{realAssetCounts.equipment} items</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-600 rounded">
                              <span className="text-gray-700 dark:text-gray-300">Total Assets</span>
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {realAssetCounts.vehicles + realAssetCounts.equipment} items
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Maintenance Tab */}
                    {activeTab === 'maintenance' && (
                      <FacilityMaintenanceManager
                        facilityId={facility.id}
                        facilityName={facility.name}
                        onMaintenanceUpdate={fetchFacilityDetails}
                      />
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
                            if (onViewOnMap) onViewOnMap(facility.id);
                            onClose();
                          }}
                          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <MapPinIcon className="h-5 w-5" />
                          <span>View on Map</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onEdit) onEdit(facility.id);
                            onClose();
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <BuildingOfficeIcon className="h-5 w-5" />
                          <span>Edit Facility</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onDelete) onDelete(facility.id);
                            onClose();
                          }}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <XMarkIcon className="h-5 w-5" />
                          <span>Delete Facility</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Status */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Overview</h3>
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(facility.status)}`}>
                            {facility.status.replace('_', ' ')}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Facility Status</p>
                        </div>

                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getSecurityLevelColor(facility.securityLevel)}`}>
                            {facility.securityLevel}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Security Level</p>
                        </div>

                        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{facility.department}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
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

export default ViewFacilityModal;
