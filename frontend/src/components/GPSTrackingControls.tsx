import { useState, useEffect } from 'react';
import { MapIcon, ExclamationTriangleIcon, SignalIcon } from '@heroicons/react/24/outline';
import { gpsTrackingService, GPSTrackerData } from '../services/gpsTrackingService';
import GeoFenceConfiguration from './GeoFenceConfiguration';
import { io } from 'socket.io-client';

interface GPSTrackingControlsProps {
  vehicleId: string;
  trackerId: string;
  vehicleName?: string;
  onLocationUpdate?: (data: GPSTrackerData) => void;
}

const GPSTrackingControls = ({ vehicleId, trackerId, vehicleName, onLocationUpdate }: GPSTrackingControlsProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastData, setLastData] = useState<GPSTrackerData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showGeoFenceConfig, setShowGeoFenceConfig] = useState(false);

  useEffect(() => {
    // Initialize GPS tracking
    initializeTracking();
    
    // Connect to real-time GPS updates via Socket.IO
    const socket = io('http://localhost:5000');
    
    // Listen for real BW32 GPS position updates
    socket.on('gps:position', (data) => {
      if (data.vehicleId === vehicleId) {
        const gpsData: GPSTrackerData = {
          vehicleId: data.vehicleId,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          course: data.course,
          timestamp: data.timestamp,
          batteryLevel: data.batteryLevel,
          signalStrength: data.signalStrength,
          gpsValid: data.gpsValid,
          satellites: data.satellites
        };
        
        setLastData(gpsData);
        if (onLocationUpdate) {
          onLocationUpdate(gpsData);
        }
        console.log('📍 Real-time GPS update received:', gpsData);
      }
    });

    // Listen for GPS alarms
    socket.on('gps:alarm', (alarm) => {
      if (alarm.vehicleId === vehicleId) {
        console.log('🚨 GPS Alarm received:', alarm);
        setAlerts(prev => [...prev, alarm]);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
    
    // Listen for GPS alerts
    const handleGPSAlerts = (event: any) => {
      const vehicleAlerts = event.detail.filter((alert: any) => 
        alert.message.includes(vehicleId)
      );
      if (vehicleAlerts.length > 0) {
        setAlerts(prev => [...prev, ...vehicleAlerts]);
      }
    };
    
    window.addEventListener('gpsDataReceived', handleGPSData);
    window.addEventListener('gpsAlertsReceived', handleGPSAlerts);
    
    return () => {
      window.removeEventListener('gpsDataReceived', handleGPSData);
      window.removeEventListener('gpsAlertsReceived', handleGPSAlerts);
    };
  }, [vehicleId]);

  const initializeTracking = async () => {
    const success = await gpsTrackingService.initializeTracking();
    setIsTracking(success);
  };

  const handleEmergencyStop = async () => {
    if (window.confirm('⚠️ EMERGENCY STOP: This will immediately cut off the engine. Continue?')) {
      const success = await gpsTrackingService.emergencyStop(vehicleId, trackerId);
      if (success) {
        alert('🚨 Emergency stop command sent to vehicle');
      } else {
        alert('❌ Failed to send emergency stop command');
      }
    }
  };

  const handleGetCurrentLocation = async () => {
    const location = await gpsTrackingService.getCurrentLocation(trackerId);
    if (location) {
      alert(`📍 Current Location: ${location.latitude}, ${location.longitude}`);
    } else {
      alert('❌ Failed to get current location');
    }
  };

  const getSignalStrength = () => {
    if (!lastData) return 'unknown';
    if (lastData.gsmSignal > 80) return 'excellent';
    if (lastData.gsmSignal > 60) return 'good';
    if (lastData.gsmSignal > 40) return 'fair';
    return 'poor';
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-white">GPS Tracker Status</h4>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-sm ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
              {isTracking ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Tracker ID:</span>
            <span className="font-mono text-gray-900 dark:text-white">{trackerId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Signal:</span>
            <span className="text-gray-900 dark:text-white capitalize">{getSignalStrength()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Battery:</span>
            <span className="text-gray-900 dark:text-white">{lastData?.batteryLevel || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
            <span className="text-gray-900 dark:text-white">
              {lastData ? new Date(lastData.timestamp).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Remote Controls</h4>
        <div className="space-y-2">
          <button
            onClick={handleEmergencyStop}
            className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>Emergency Engine Stop</span>
          </button>
          
          <button
            onClick={handleGetCurrentLocation}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <MapIcon className="h-4 w-4" />
            <span>Get Location</span>
          </button>
          
          <button
            onClick={() => setShowGeoFenceConfig(true)}
            className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <SignalIcon className="h-4 w-4" />
            <span>Configure Geo-fence</span>
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">Active Alerts</h4>
          <div className="space-y-2">
            {alerts.slice(-3).map((alert, index) => (
              <div key={index} className="text-sm">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  alert.severity === 'emergency' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.type.toUpperCase()}
                </span>
                <p className="text-red-700 dark:text-red-400 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geo-fence Configuration Modal */}
      <GeoFenceConfiguration
        isOpen={showGeoFenceConfig}
        onClose={() => setShowGeoFenceConfig(false)}
        vehicleId={vehicleId}
        trackerId={trackerId}
        vehicleName={vehicleName || `Vehicle ${vehicleId}`}
        onGeoFenceUpdate={(geoFence) => {
          console.log('Geo-fence updated:', geoFence);
          // Could trigger map update or other actions here
        }}
      />
    </div>
  );
};

export default GPSTrackingControls;
