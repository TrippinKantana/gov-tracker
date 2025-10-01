/**
 * Compact Vehicle Control Panel - Fits on screen properly
 */

import { useState } from 'react'
import { TruckIcon, StopIcon, EyeIcon, PhoneIcon } from '@heroicons/react/24/outline'

interface Vehicle {
  id: string
  name: string
  plateNumber?: string
  make?: string
  model?: string
  status: string
  currentOperator?: string
  assignedTo?: string
  fuelLevel?: number
  engineStatus?: 'running' | 'stopped' | 'unknown'
  details?: {
    licensePlate?: string
    [key: string]: any
  }
}

interface CompactVehicleControlProps {
  vehicle: Vehicle
  onClose: () => void
  onEngineKill: (vehicleId: string) => void
  onTrackVehicle: (vehicleId: string) => void
  onViewDetails: (vehicleId: string) => void
}

const CompactVehicleControl = ({ vehicle, onClose, onEngineKill, onTrackVehicle, onViewDetails }: CompactVehicleControlProps) => {
  const [isKilling, setIsKilling] = useState(false)

  const handleEngineKill = () => {
    setIsKilling(true)
    setTimeout(() => {
      onEngineKill(vehicle.id)
      setIsKilling(false)
    }, 1500)
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-blue-500 w-56">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <TruckIcon className="h-4 w-4 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{vehicle.name}</h3>
            <p className="text-xs text-gray-500">
              {vehicle.details?.licensePlate || vehicle.plateNumber || 'No Plate'} • {vehicle.make || 'Unknown Make'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
      </div>

      {/* Quick Status */}
      <div className="flex justify-between mb-3 text-xs">
        <span className={`px-2 py-1 rounded ${vehicle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {vehicle.status}
        </span>
        <span className="text-gray-500">Fuel: {vehicle.fuelLevel || 'N/A'}%</span>
      </div>

      {/* Compact Controls */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onTrackVehicle(vehicle.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-1 rounded text-xs transition-colors flex items-center justify-center space-x-1"
          >
            <EyeIcon className="h-3 w-3" />
            <span>Track</span>
          </button>
          <button
            onClick={() => alert('Contact operator')}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-1 rounded text-xs transition-colors flex items-center justify-center space-x-1"
          >
            <PhoneIcon className="h-3 w-3" />
            <span>Call</span>
          </button>
          <button
            onClick={() => onViewDetails(vehicle.id)}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-1 rounded text-xs transition-colors"
          >
            Details
          </button>
        </div>
        
        <button
          onClick={handleEngineKill}
          disabled={isKilling}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-xs transition-colors flex items-center justify-center space-x-1"
        >
          <StopIcon className="h-3 w-3" />
          <span>{isKilling ? 'Killing...' : 'Kill Engine'}</span>
        </button>
      </div>
    </div>
  )
}

export default CompactVehicleControl
