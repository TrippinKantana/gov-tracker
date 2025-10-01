/**
 * Facility Command & Control Panel
 * Professional government facility operations interface
 */

import { useState } from 'react'
import { 
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  UsersIcon,
  CogIcon,
  BellIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

interface Facility {
  id: string
  name: string
  type: 'ministry' | 'hospital' | 'school' | 'police_station' | 'military_base' | 'warehouse'
  department: string
  address: string
  coordinates: [number, number]
  status: 'operational' | 'maintenance' | 'under_construction' | 'closed'
  capacity?: number
  contactPerson: string
  phone: string
  securityLevel?: 'low' | 'medium' | 'high' | 'classified'
  accessControlled?: boolean
  occupancyCount?: number
  lastSecurityCheck?: string
}

interface FacilityControlPanelProps {
  facility: Facility
  onClose: () => void
  onLockdown: (facilityId: string) => void
  onSecurityAlert: (facilityId: string) => void
  onMonitorFacility: (facilityId: string) => void
  onContactSecurity: (facilityId: string) => void
}

const FacilityControlPanel = ({ 
  facility, 
  onClose, 
  onLockdown, 
  onSecurityAlert, 
  onMonitorFacility, 
  onContactSecurity 
}: FacilityControlPanelProps) => {
  const [isLockingDown, setIsLockingDown] = useState(false)
  const [commandSent, setCommandSent] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  const handleLockdown = async () => {
    setIsLockingDown(true)
    setCommandSent('Initiating facility lockdown protocol...')
    
    // Simulate lockdown command
    setTimeout(() => {
      onLockdown(facility.id)
      setIsLocked(!isLocked)
      setCommandSent(`Facility ${isLocked ? 'unlocked' : 'lockdown'} successful`)
      setIsLockingDown(false)
      
      // Clear message after 3 seconds
      setTimeout(() => setCommandSent(null), 3000)
    }, 2500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'under_construction': return 'bg-blue-500'
      case 'closed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getSecurityLevelColor = (level?: string) => {
    switch (level) {
      case 'classified': return 'text-red-400 bg-red-900/30'
      case 'high': return 'text-orange-400 bg-orange-900/30'
      case 'medium': return 'text-yellow-400 bg-yellow-900/30'
      case 'low': return 'text-green-400 bg-green-900/30'
      default: return 'text-gray-400 bg-gray-800'
    }
  }

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'military_base': return '🏛️'
      case 'hospital': return '🏥'
      case 'school': return '🏫'
      case 'police_station': return '🚔'
      case 'warehouse': return '🏭'
      default: return '🏢'
    }
  }

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-2xl border border-green-500 min-w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-green-600 p-2 rounded-lg">
            <BuildingOfficeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-400">FACILITY CONTROL</h3>
            <p className="text-sm text-gray-400">{getFacilityIcon(facility.type)} {facility.type.toUpperCase()}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
        >
          ×
        </button>
      </div>

      {/* Facility Name */}
      <div className="mb-4">
        <h4 className="text-xl font-bold text-white">{facility.name}</h4>
        <p className="text-gray-400">{facility.address}</p>
        <p className="text-blue-400 text-sm">{facility.department}</p>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(facility.status)}`}></div>
            <span className="text-sm font-medium">STATUS</span>
          </div>
          <p className="text-green-400 font-bold uppercase">{facility.status}</p>
        </div>
        
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">SECURITY</span>
          </div>
          <p className={`font-bold uppercase text-sm px-2 py-1 rounded ${getSecurityLevelColor(facility.securityLevel)}`}>
            {facility.securityLevel || 'STANDARD'}
          </p>
        </div>
      </div>

      {/* Occupancy */}
      <div className="bg-gray-800 p-3 rounded mb-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UsersIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">OCCUPANCY</span>
          </div>
          <div className="text-right">
            <p className="text-blue-400 font-bold">
              {facility.occupancyCount || 0} / {facility.capacity || 'Unknown'}
            </p>
            <p className="text-xs text-gray-400">
              {facility.capacity ? `${Math.round(((facility.occupancyCount || 0) / facility.capacity) * 100)}% capacity` : 'No limit'}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-gray-800 p-3 rounded mb-4 border border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <PhoneIcon className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium">CONTACT</span>
        </div>
        <p className="text-blue-400 font-medium">{facility.contactPerson}</p>
        <p className="text-gray-400 text-sm">{facility.phone}</p>
      </div>

      {/* Command Status */}
      {commandSent && (
        <div className="bg-blue-900/50 border border-blue-600 p-3 rounded mb-4">
          <div className="flex items-center space-x-2">
            <RadioIcon className="h-4 w-4 text-blue-400 animate-pulse" />
            <span className="text-blue-400 text-sm font-medium">{commandSent}</span>
          </div>
        </div>
      )}

      {/* Command Controls */}
      <div className="space-y-3">
        <div className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-700 pb-2">
          FACILITY OPERATIONS
        </div>
        
        <button
          onClick={() => onMonitorFacility(facility.id)}
          className="w-full bg-blue-700 hover:bg-blue-600 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <EyeIcon className="h-5 w-5" />
          <span className="font-medium">MONITOR FACILITY</span>
        </button>

        <button
          onClick={() => onContactSecurity(facility.id)}
          className="w-full bg-green-700 hover:bg-green-600 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <PhoneIcon className="h-5 w-5" />
          <span className="font-medium">CONTACT SECURITY</span>
        </button>

        <button
          onClick={() => onSecurityAlert(facility.id)}
          className="w-full bg-yellow-700 hover:bg-yellow-600 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <BellIcon className="h-5 w-5" />
          <span className="font-medium">SECURITY ALERT</span>
        </button>

        <div className="border-t border-gray-700 pt-3">
          <div className="text-xs text-red-400 uppercase tracking-wide mb-2">
            EMERGENCY CONTROLS
          </div>
          <button
            onClick={handleLockdown}
            disabled={isLockingDown}
            className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 p-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isLockingDown ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="font-medium">EXECUTING...</span>
              </>
            ) : (
              <>
                {isLocked ? <LockOpenIcon className="h-5 w-5" /> : <LockClosedIcon className="h-5 w-5" />}
                <span className="font-medium">
                  {isLocked ? 'UNLOCK FACILITY' : 'EMERGENCY LOCKDOWN'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Coordinates */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>GPS COORDINATES</span>
          <span className="text-blue-400 font-mono">
            {facility.coordinates[1].toFixed(6)}, {facility.coordinates[0].toFixed(6)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>SECURITY CHECK</span>
          <span className="text-green-400">
            {facility.lastSecurityCheck || 'PENDING'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default FacilityControlPanel
