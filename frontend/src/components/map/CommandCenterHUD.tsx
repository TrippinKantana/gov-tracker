/**
 * Command Center Heads-Up Display
 * Professional government operations interface overlay
 */

import { useState } from 'react'
import { 
  GlobeAltIcon,
  EyeIcon,
  RadioIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ComputerDesktopIcon,
  UsersIcon,
  StopIcon
} from '@heroicons/react/24/outline'

interface CommandCenterHUDProps {
  totalAssets: number
  activeVehicles: number
  operationalFacilities: number
  onlineEquipment: number
  activePersonnel: number
  alertCount: number
  lastUpdate: string
  filterType: string
  hasSelectedAsset: boolean
  onSearchAsset: (searchTerm: string) => void
  onSelectAsset: (assetId: string) => void
  selectedAsset?: any
  onShowNotification: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void
}

const CommandCenterHUD = ({
  totalAssets,
  activeVehicles,
  operationalFacilities,
  onlineEquipment,
  activePersonnel,
  alertCount,
  lastUpdate,
  filterType,
  hasSelectedAsset,
  onSearchAsset,
  onSelectAsset,
  selectedAsset,
  onShowNotification
}: CommandCenterHUDProps) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="w-full lg:w-72">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Clickable Header */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 hover:from-blue-700 hover:to-blue-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GlobeAltIcon className="h-5 w-5 text-white" />
              <h2 className="text-sm font-semibold text-white">Command Center</h2>
            </div>
            <div className="text-blue-200 text-sm">
              {isMinimized ? '▼' : '▲'}
            </div>
          </div>
        </button>

        {!isMinimized && (
          <div className="p-4 space-y-4">
            {/* Strategic Asset Search */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Asset Search & Control
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for specific asset..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    onSearchAsset(e.target.value)
                  }}
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Live Asset Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <TruckIcon className="h-4 w-4 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">{activeVehicles}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vehicles</p>
              </div>
              
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <BuildingOfficeIcon className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">{operationalFacilities}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Facilities</p>
              </div>
              
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <ComputerDesktopIcon className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">{onlineEquipment}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Equipment</p>
              </div>
              
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <UsersIcon className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">{activePersonnel}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Personnel</p>
              </div>
            </div>

            {/* Selected Asset Control */}
            {selectedAsset && (
              <div className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Selected Asset Control
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedAsset.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedAsset.type} • {selectedAsset.department}
                </div>
                
                {selectedAsset.type === 'vehicle' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => onShowNotification('success', 'Vehicle Tracking', `Now tracking ${selectedAsset.name}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded text-xs transition-colors"
                    >
                      Track Vehicle
                    </button>
                    <button 
                      onClick={() => onShowNotification('warning', 'Emergency Command', `Engine kill sent to ${selectedAsset.name}`)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-2 rounded text-xs transition-colors"
                    >
                      Kill Engine
                    </button>
                  </div>
                )}
                
                {selectedAsset.type === 'facility' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => onShowNotification('info', 'Facility Monitoring', `Monitoring ${selectedAsset.name}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded text-xs transition-colors"
                    >
                      Monitor
                    </button>
                    <button 
                      onClick={() => onShowNotification('warning', 'Security Alert', `Lockdown initiated for ${selectedAsset.name}`)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-2 rounded text-xs transition-colors"
                    >
                      Lockdown
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* System Status */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {selectedAsset ? 'Asset Selected' : 'Click asset for control'}
                </span>
                <span className="text-gray-900 dark:text-white font-medium">{lastUpdate}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommandCenterHUD
