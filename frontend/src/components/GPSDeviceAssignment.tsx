import { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, WifiIcon, SignalIcon } from '@heroicons/react/24/outline';

interface GPSDevice {
  id: string;
  imei: string;
  simNumber: string;
  batteryLevel: number;
  signalStrength: number;
  status: 'active' | 'inactive' | 'maintenance';
  lastSeen: string;
  isAssigned: boolean;
  assignedVehicleId?: string;
}

interface GPSDeviceAssignmentProps {
  vehicleId: string;
  currentTrackerId?: string;
  onAssignmentChange: (trackerId: string | null) => void;
}

const GPSDeviceAssignment = ({ vehicleId, currentTrackerId, onAssignmentChange }: GPSDeviceAssignmentProps) => {
  const [availableDevices, setAvailableDevices] = useState<GPSDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchAvailableDevices();
  }, []);

  const fetchAvailableDevices = async () => {
    setIsLoading(true);
    try {
      // Get all registered GPS devices from new BW32 system
      const response = await fetch('/api/gps/devices');
      const result = await response.json();
      if (result.success) {
        // Transform to expected format
        const transformedDevices = result.devices.map((device: any) => ({
          id: device.deviceId,
          imei: device.deviceId,
          simNumber: device.deviceId,
          batteryLevel: 85, // TODO: Get from real device status
          signalStrength: 4, // TODO: Get from real device status  
          status: device.lastSeen ? 'active' : 'inactive',
          lastSeen: device.lastSeen || 'Never',
          isAssigned: !!device.vehicleId,
          assignedVehicleId: device.vehicleId,
          name: device.name
        }));
        setAvailableDevices(transformedDevices);
        console.log('📡 Loaded BW32 GPS devices:', transformedDevices.length);
      }
    } catch (error) {
      console.error('Error fetching GPS devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const assignDevice = async (deviceId: string) => {
    setIsAssigning(true);
    try {
      // Register device to vehicle in BW32 GPS system
      const response = await fetch('/api/gps/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          deviceId: deviceId, 
          vehicleId: vehicleId,
          name: `GPS Tracker for Vehicle ${vehicleId}`
        })
      });

      const result = await response.json();
      if (result.success) {
        onAssignmentChange(deviceId);
        setShowAssignModal(false);
        await fetchAvailableDevices(); // Refresh device list
      } else {
        alert('Failed to assign GPS device: ' + result.error);
      }
    } catch (error) {
      console.error('Error assigning GPS device:', error);
      alert('Failed to assign GPS device');
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignDevice = async () => {
    if (!currentTrackerId) return;
    
    setIsAssigning(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/unassign-tracker`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        onAssignmentChange(null);
        await fetchAvailableDevices(); // Refresh device list
      } else {
        alert('Failed to unassign GPS device: ' + result.error);
      }
    } catch (error) {
      console.error('Error unassigning GPS device:', error);
      alert('Failed to unassign GPS device');
    } finally {
      setIsAssigning(false);
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getSignalBars = (strength: number) => {
    const bars = Math.ceil(strength / 25); // Convert to 1-4 bars
    return Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        className={`w-1 h-3 ${i < bars ? 'bg-green-500' : 'bg-gray-300'} rounded-sm`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Current Assignment Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">GPS Tracker Assignment</h3>
        
        {currentTrackerId ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-500 rounded-lg p-2">
                  <WifiIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Device Connected</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">Tracker ID: {currentTrackerId}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Real-time tracking active</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <SignalIcon className="h-4 w-4 text-gray-600" />
                  <div className="flex items-end space-x-0.5">
                    {getSignalBars(85)} {/* Example signal strength */}
                  </div>
                </div>
                
                <button
                  onClick={unassignDevice}
                  disabled={isAssigning}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isAssigning ? 'Unassigning...' : 'Disconnect'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-500 rounded-lg p-2">
                  <XMarkIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">No GPS Device Assigned</h4>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Vehicle tracking is not active</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Assign a BW32 tracker to enable real-time monitoring</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Assign Device
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Device Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAssignModal(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign GPS Tracker</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Select an available BW32 device to assign to this vehicle</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading available devices...</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availableDevices.filter(device => !device.isAssigned).map((device) => (
                      <div
                        key={device.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-2">
                              <WifiIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">BW32-{device.id}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>IMEI: {device.imei}</span>
                                <span>SIM: {device.simNumber}</span>
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDeviceStatusColor(device.status)}`}>
                                  {device.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Last seen: {new Date(device.lastSeen).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right text-sm">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Battery:</span>
                                <span className="font-semibold">{device.batteryLevel}%</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600 dark:text-gray-400">Signal:</span>
                                <div className="flex items-end space-x-0.5">
                                  {getSignalBars(device.signalStrength)}
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => assignDevice(device.id)}
                              disabled={isAssigning || device.status !== 'active'}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isAssigning ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {availableDevices.filter(device => !device.isAssigned).length === 0 && (
                      <div className="text-center py-12">
                        <WifiIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Available Devices</h3>
                        <p className="text-gray-600 dark:text-gray-400">All BW32 trackers are currently assigned to other vehicles</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPSDeviceAssignment;
