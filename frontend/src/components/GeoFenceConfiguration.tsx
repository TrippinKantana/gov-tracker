import { useState, useEffect } from 'react';
import { XMarkIcon, MapIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { gpsTrackingService } from '../services/gpsTrackingService';

interface GeoFence {
  id: string;
  name: string;
  center: [number, number]; // [longitude, latitude]
  radius: number; // meters
  type: 'circular' | 'polygon';
  isActive: boolean;
  createdAt: Date;
  violations: number;
}

interface GeoFenceConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  trackerId: string;
  vehicleName: string;
  onGeoFenceUpdate?: (geoFence: GeoFence) => void;
}

const GeoFenceConfiguration = ({ 
  isOpen, 
  onClose, 
  vehicleId, 
  trackerId, 
  vehicleName,
  onGeoFenceUpdate 
}: GeoFenceConfigurationProps) => {
  const [geoFences, setGeoFences] = useState<GeoFence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGeoFence, setNewGeoFence] = useState({
    name: '',
    centerLat: 6.3005, // Default to Monrovia, Liberia
    centerLng: -10.7969,
    radius: 1000, // 1km default
    type: 'circular' as const
  });

  const presetLocations = [
    { name: 'Ministry of Health HQ', lat: 6.3005, lng: -10.7969, radius: 500 },
    { name: 'Ministry of Defense', lat: 6.2985, lng: -10.7995, radius: 800 },
    { name: 'GSA Motor Pool', lat: 6.3025, lng: -10.7945, radius: 300 },
    { name: 'Government Hospital', lat: 6.3055, lng: -10.7915, radius: 1000 },
    { name: 'Port of Monrovia', lat: 6.3015, lng: -10.8025, radius: 1500 }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchGeoFences();
    }
  }, [isOpen, vehicleId]);

  const fetchGeoFences = async () => {
    setIsLoading(true);
    try {
      // Mock geo-fences for now - replace with real API call
      const mockGeoFences: GeoFence[] = [
        {
          id: 'GF001',
          name: 'Ministry of Health Area',
          center: [-10.7969, 6.3005],
          radius: 500,
          type: 'circular',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          violations: 0
        },
        {
          id: 'GF002',
          name: 'Downtown Monrovia',
          center: [-10.7995, 6.2985],
          radius: 2000,
          type: 'circular',
          isActive: false,
          createdAt: new Date('2024-01-15'),
          violations: 2
        }
      ];
      
      setGeoFences(mockGeoFences);
    } catch (error) {
      console.error('Error fetching geo-fences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGeoFence = async () => {
    if (!newGeoFence.name.trim()) {
      alert('Please enter a name for the geo-fence');
      return;
    }

    try {
      const geoFence: GeoFence = {
        id: `GF${Date.now()}`,
        name: newGeoFence.name,
        center: [newGeoFence.centerLng, newGeoFence.centerLat],
        radius: newGeoFence.radius,
        type: newGeoFence.type,
        isActive: true,
        createdAt: new Date(),
        violations: 0
      };

      // Send to GPS service
      const success = await gpsTrackingService.setGeoFence(trackerId, {
        center: [newGeoFence.centerLng, newGeoFence.centerLat],
        radius: newGeoFence.radius
      });

      if (success) {
        setGeoFences(prev => [geoFence, ...prev]);
        setShowCreateForm(false);
        setNewGeoFence({
          name: '',
          centerLat: 6.3005,
          centerLng: -10.7969,
          radius: 1000,
          type: 'circular'
        });

        if (onGeoFenceUpdate) {
          onGeoFenceUpdate(geoFence);
        }

        alert('✅ Geo-fence created and activated successfully');
      } else {
        alert('❌ Failed to create geo-fence');
      }
    } catch (error) {
      console.error('Error creating geo-fence:', error);
      alert('❌ Failed to create geo-fence');
    }
  };

  const toggleGeoFence = async (geoFenceId: string, currentlyActive: boolean) => {
    try {
      const geoFence = geoFences.find(gf => gf.id === geoFenceId);
      if (!geoFence) return;

      if (!currentlyActive) {
        // Activate geo-fence
        const success = await gpsTrackingService.setGeoFence(trackerId, {
          center: geoFence.center,
          radius: geoFence.radius
        });

        if (success) {
          setGeoFences(prev => prev.map(gf => 
            gf.id === geoFenceId ? { ...gf, isActive: true } : { ...gf, isActive: false }
          ));
          alert('✅ Geo-fence activated');
        } else {
          alert('❌ Failed to activate geo-fence');
        }
      } else {
        // Deactivate geo-fence
        setGeoFences(prev => prev.map(gf => 
          gf.id === geoFenceId ? { ...gf, isActive: false } : gf
        ));
        alert('✅ Geo-fence deactivated');
      }
    } catch (error) {
      console.error('Error toggling geo-fence:', error);
      alert('❌ Failed to toggle geo-fence');
    }
  };

  const deleteGeoFence = async (geoFenceId: string) => {
    if (!window.confirm('Are you sure you want to delete this geo-fence?')) {
      return;
    }

    try {
      setGeoFences(prev => prev.filter(gf => gf.id !== geoFenceId));
      alert('✅ Geo-fence deleted');
    } catch (error) {
      console.error('Error deleting geo-fence:', error);
      alert('❌ Failed to delete geo-fence');
    }
  };

  const applyPresetLocation = (preset: typeof presetLocations[0]) => {
    setNewGeoFence(prev => ({
      ...prev,
      name: `${preset.name} Zone`,
      centerLat: preset.lat,
      centerLng: preset.lng,
      radius: preset.radius
    }));
  };

  const openMapView = (geoFence: GeoFence) => {
    // This would ideally open the map view with the geo-fence highlighted
    // For now, we'll show coordinates
    alert(`📍 Geo-fence Location:\nCenter: ${geoFence.center[1]}, ${geoFence.center[0]}\nRadius: ${geoFence.radius}m\n\nClick "View on Map" in the vehicle details to see it on the map.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Geo-fence Configuration</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage location boundaries for {vehicleName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Create New Geo-fence */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Geo-fence</h3>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {showCreateForm ? 'Cancel' : '+ Add Geo-fence'}
                </button>
              </div>

              {showCreateForm && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Geo-fence Name
                      </label>
                      <input
                        type="text"
                        value={newGeoFence.name}
                        onChange={(e) => setNewGeoFence(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Ministry Area"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Radius (meters)
                      </label>
                      <input
                        type="number"
                        value={newGeoFence.radius}
                        onChange={(e) => setNewGeoFence(prev => ({ ...prev, radius: parseInt(e.target.value) || 1000 }))}
                        min="100"
                        max="10000"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Center Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={newGeoFence.centerLat}
                        onChange={(e) => setNewGeoFence(prev => ({ ...prev, centerLat: parseFloat(e.target.value) || 6.3005 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Center Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={newGeoFence.centerLng}
                        onChange={(e) => setNewGeoFence(prev => ({ ...prev, centerLng: parseFloat(e.target.value) || -10.7969 }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Preset Locations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quick Presets
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {presetLocations.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyPresetLocation(preset)}
                          className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createGeoFence}
                      disabled={!newGeoFence.name.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Geo-fence
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Geo-fences */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Active Geo-fences ({geoFences.filter(gf => gf.isActive).length})
              </h3>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading geo-fences...</p>
                </div>
              ) : geoFences.length === 0 ? (
                <div className="text-center py-8">
                  <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">No Geo-fences Configured</h4>
                  <p className="text-gray-600 dark:text-gray-400">Create your first geo-fence to monitor vehicle boundaries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {geoFences.map((geoFence) => (
                    <div
                      key={geoFence.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        geoFence.isActive 
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            geoFence.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                          }`}></div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{geoFence.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Center: {geoFence.center[1].toFixed(6)}, {geoFence.center[0].toFixed(6)}</span>
                              <span>Radius: {geoFence.radius}m</span>
                              <span>Created: {geoFence.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {geoFence.violations > 0 && (
                            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                              <ExclamationTriangleIcon className="h-4 w-4" />
                              <span className="text-sm">{geoFence.violations} violations</span>
                            </div>
                          )}

                          <button
                            onClick={() => openMapView(geoFence)}
                            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="View on Map"
                          >
                            <MapIcon className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => toggleGeoFence(geoFence.id, geoFence.isActive)}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              geoFence.isActive
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300'
                                : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300'
                            }`}
                          >
                            {geoFence.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          <button
                            onClick={() => deleteGeoFence(geoFence.id)}
                            className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Geo-fence Details */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Status:</span>
                            <div className="flex items-center mt-1">
                              {geoFence.isActive ? (
                                <>
                                  <CheckIcon className="h-4 w-4 text-green-600 mr-1" />
                                  <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                </>
                              ) : (
                                <span className="text-gray-600 dark:text-gray-400">Inactive</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Type:</span>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">{geoFence.type}</p>
                          </div>

                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Area:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {(Math.PI * Math.pow(geoFence.radius, 2) / 1000000).toFixed(2)} km²
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Violations:</span>
                            <p className={`font-medium ${
                              geoFence.violations > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {geoFence.violations} incidents
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Information Panel */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How Geo-fencing Works</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Set circular boundaries around important locations</li>
                <li>• Receive alerts when vehicle enters or exits the area</li>
                <li>• Monitor compliance with authorized routes</li>
                <li>• Track unauthorized vehicle usage</li>
                <li>• Only one geo-fence can be active at a time per vehicle</li>
              </ul>
            </div>
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

export default GeoFenceConfiguration;
