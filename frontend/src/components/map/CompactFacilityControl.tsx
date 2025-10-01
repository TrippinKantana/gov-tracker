/**
 * Compact Facility Control Panel - Fits on screen properly
 */

import { useState } from 'react'
import { BuildingOfficeIcon, LockClosedIcon, EyeIcon, BellIcon, UsersIcon } from '@heroicons/react/24/outline'

interface Facility {
  id: string
  name: string
  type: string
  status: string
  capacity?: number
  occupancyCount?: number
  contactPerson: string
}

interface CompactFacilityControlProps {
  facility: Facility
  onClose: () => void
  onLockdown: (facilityId: string) => void
  onMonitor: (facilityId: string) => void
  onViewDetails: (facilityId: string) => void
}

const CompactFacilityControl = ({ facility, onClose, onLockdown, onMonitor, onViewDetails }: CompactFacilityControlProps) => {
  const [isLocking, setIsLocking] = useState(false)

  const handleLockdown = () => {
    setIsLocking(true)
    setTimeout(() => {
      onLockdown(facility.id)
      setIsLocking(false)
    }, 1500)
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-green-500 w-56">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <BuildingOfficeIcon className="h-4 w-4 text-green-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{facility.name}</h3>
            <p className="text-xs text-gray-500 capitalize">{facility.type}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
      </div>

      {/* Quick Status */}
      <div className="flex justify-between mb-3 text-xs">
        <span className={`px-2 py-1 rounded ${facility.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {facility.status}
        </span>
        {facility.capacity && (
          <span className="text-gray-500">
            {facility.occupancyCount || 0}/{facility.capacity}
          </span>
        )}
      </div>

      {/* Contact */}
      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
        <p className="text-xs text-gray-500">Contact: {facility.contactPerson}</p>
      </div>

      {/* Compact Controls */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onMonitor(facility.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-1 rounded text-xs transition-colors flex items-center justify-center space-x-1"
          >
            <EyeIcon className="h-3 w-3" />
            <span>Monitor</span>
          </button>
          <button
            onClick={() => alert('Security alert sent')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-1 rounded text-xs transition-colors flex items-center justify-center space-x-1"
          >
            <BellIcon className="h-3 w-3" />
            <span>Alert</span>
          </button>
          <button
            onClick={() => onViewDetails(facility.id)}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-1 rounded text-xs transition-colors"
          >
            Details
          </button>
        </div>
        
        <button
          onClick={handleLockdown}
          disabled={isLocking}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-3 rounded text-xs transition-colors flex items-center justify-center space-x-1"
        >
          <LockClosedIcon className="h-3 w-3" />
          <span>{isLocking ? 'Locking...' : 'Emergency Lockdown'}</span>
        </button>
      </div>
    </div>
  )
}

export default CompactFacilityControl
