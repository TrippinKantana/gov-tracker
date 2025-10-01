/**
 * Vehicle Command & Control Panel
 * Professional government vehicle operations interface
 */

import { useState } from 'react'
import { 
  TruckIcon, 
  StopIcon, 
  PlayIcon, 
  MapPinIcon, 
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  RadioIcon,
  BoltIcon,
  EyeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

interface Vehicle {
  id: string
  plateNumber: string
  make: string
  model: string
  year: number
  vehicleType: string
  department: string
  currentOperator?: string
  status: string
  fuelLevel?: number
  coordinates: [number, number]
  lastUpdate: string
  gpsTrackerId?: string
  engineStatus?: 'running' | 'stopped' | 'unknown'
  batteryLevel?: number
}

interface VehicleCommandPanelProps {
  vehicle: Vehicle
  onClose: () => void
  onEngineKill: (vehicleId: string) => void
  onTrackVehicle: (vehicleId: string) => void
  onContactOperator: (vehicleId: string) => void
}

const VehicleCommandPanel = ({ 
  vehicle, 
  onClose, 
  onEngineKill, 
  onTrackVehicle, 
  onContactOperator 
}: VehicleCommandPanelProps) => {
  const [isKillingEngine, setIsKillingEngine] = useState(false)
  const [commandSent, setCommandSent] = useState<string | null>(null)

  const handleEngineKill = async () => {
    setIsKillingEngine(true)
    setCommandSent('Sending engine kill command...')
    
    // Simulate command transmission
    setTimeout(() => {
      onEngineKill(vehicle.id)
      setCommandSent('Engine kill command sent successfully')
      setIsKillingEngine(false)
      
      // Clear message after 3 seconds
      setTimeout(() => setCommandSent(null), 3000)
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'inactive': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getEngineStatusColor = (engineStatus?: string) => {
    switch (engineStatus) {
      case 'running': return 'text-green-600'
      case 'stopped': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg shadow-xl border border-blue-500 w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <TruckIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-400">VEHICLE COMMAND</h3>
            <p className="text-sm text-gray-400">ID: {vehicle.plateNumber}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
        >
          ×
        </button>
      </div>

      {/* Vehicle Status */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`}></div>
            <span className="text-sm font-medium">STATUS</span>
          </div>
          <p className="text-blue-400 font-bold uppercase">{vehicle.status}</p>
        </div>
        
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="flex items-center space-x-2">
            <BoltIcon className={`h-4 w-4 ${getEngineStatusColor(vehicle.engineStatus)}`} />
            <span className="text-sm font-medium">ENGINE</span>
          </div>
          <p className={`font-bold uppercase ${getEngineStatusColor(vehicle.engineStatus)}`}>
            {vehicle.engineStatus || 'UNKNOWN'}
          </p>
        </div>
      </div>

      {/* Live Data */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-800 p-2 rounded text-center border border-gray-700">
          <p className="text-xs text-gray-400">FUEL</p>
          <p className="text-lg font-bold text-yellow-400">{vehicle.fuelLevel || 'N/A'}%</p>
        </div>
        <div className="bg-gray-800 p-2 rounded text-center border border-gray-700">
          <p className="text-xs text-gray-400">BATTERY</p>
          <p className="text-lg font-bold text-green-400">{vehicle.batteryLevel || 'N/A'}%</p>
        </div>
        <div className="bg-gray-800 p-2 rounded text-center border border-gray-700">
          <p className="text-xs text-gray-400">GPS</p>
          <p className="text-lg font-bold text-blue-400">ACTIVE</p>
        </div>
      </div>

      {/* Operator Info */}
      {vehicle.currentOperator && (
        <div className="bg-gray-800 p-3 rounded mb-4 border border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">CURRENT OPERATOR</span>
          </div>
          <p className="text-blue-400 font-medium">{vehicle.currentOperator}</p>
          <p className="text-xs text-gray-400">{vehicle.department}</p>
        </div>
      )}

      {/* Command Status */}
      {commandSent && (
        <div className="bg-yellow-900/50 border border-yellow-600 p-3 rounded mb-4">
          <div className="flex items-center space-x-2">
            <RadioIcon className="h-4 w-4 text-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-sm font-medium">{commandSent}</span>
          </div>
        </div>
      )}

      {/* Command Controls */}
      <div className="space-y-3">
        <div className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-700 pb-2">
          OPERATIONAL COMMANDS
        </div>
        
        <button
          onClick={() => onTrackVehicle(vehicle.id)}
          className="w-full bg-blue-700 hover:bg-blue-600 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <EyeIcon className="h-5 w-5" />
          <span className="font-medium">TRACK VEHICLE</span>
        </button>

        <button
          onClick={() => onContactOperator(vehicle.id)}
          disabled={!vehicle.currentOperator}
          className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <PhoneIcon className="h-5 w-5" />
          <span className="font-medium">CONTACT OPERATOR</span>
        </button>

        <div className="border-t border-gray-700 pt-3">
          <div className="text-xs text-red-400 uppercase tracking-wide mb-2">
            EMERGENCY CONTROLS
          </div>
          <button
            onClick={handleEngineKill}
            disabled={isKillingEngine || vehicle.engineStatus === 'stopped'}
            className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isKillingEngine ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="font-medium">SENDING COMMAND...</span>
              </>
            ) : (
              <>
                <StopIcon className="h-5 w-5" />
                <span className="font-medium">EMERGENCY ENGINE KILL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>LAST UPDATE</span>
          <span>{new Date(vehicle.lastUpdate).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>GPS TRACKER</span>
          <span className="text-green-400">{vehicle.gpsTrackerId || 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}

export default VehicleCommandPanel
