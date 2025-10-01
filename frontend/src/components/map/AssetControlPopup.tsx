/**
 * Asset Control Popup - Universal popup for all asset types
 * Professional government asset control interface
 */

import { useState } from 'react'
import CompactVehicleControl from './CompactVehicleControl'
import CompactFacilityControl from './CompactFacilityControl'
import { ComputerDesktopIcon, UserIcon, StopIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Asset {
  id: string
  name: string
  type: 'vehicle' | 'facility' | 'equipment' | 'personnel'
  coordinates: [number, number]
  status: string
  department: string
  [key: string]: any // Allow additional properties
}

interface AssetControlPopupProps {
  asset: Asset
  onClose: () => void
  onViewVehicleDetails?: (vehicleId: string) => void
  onViewFacilityDetails?: (facilityId: string) => void
}

const AssetControlPopup = ({ asset, onClose, onViewVehicleDetails, onViewFacilityDetails }: AssetControlPopupProps) => {
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [showTrackConfirm, setShowTrackConfirm] = useState(false);
  const [showContactConfirm, setShowContactConfirm] = useState(false);

  // Fleet command handlers
  const handleEngineKill = (vehicleId: string) => {
    setShowKillConfirm(true);
  }

  const confirmEngineKill = (vehicleId: string) => {
    console.log(`🚨 EMERGENCY: Engine kill command sent to fleet ${vehicleId}`)
    // TODO: Send real command to fleet's GPS tracker
    setShowKillConfirm(false);
    
    // Show success notification
    setTimeout(() => {
      alert(`Engine kill command sent to fleet ${vehicleId}`)
    }, 100);
  }

  const handleTrackVehicle = (vehicleId: string) => {
    console.log(`📍 Tracking fleet ${vehicleId}`)
    // TODO: Open detailed tracking view
    alert(`Tracking fleet ${vehicleId}`)
  }

  const handleContactOperator = (vehicleId: string) => {
    console.log(`📞 Contacting operator of fleet ${vehicleId}`)
    // TODO: Open communication interface
    alert(`Contacting operator of fleet ${vehicleId}`)
  }

  // Facility command handlers
  const handleFacilityLockdown = (facilityId: string) => {
    console.log(`🔒 Lockdown command sent to facility ${facilityId}`)
    // TODO: Send lockdown command to facility systems
    alert(`Lockdown command sent to facility ${facilityId}`)
  }

  const handleSecurityAlert = (facilityId: string) => {
    console.log(`🚨 Security alert triggered for facility ${facilityId}`)
    // TODO: Trigger facility security protocols
    alert(`Security alert triggered for facility ${facilityId}`)
  }

  const handleMonitorFacility = (facilityId: string) => {
    console.log(`👁️ Monitoring facility ${facilityId}`)
    // TODO: Open facility monitoring dashboard
    alert(`Monitoring facility ${facilityId}`)
  }

  const handleContactSecurity = (facilityId: string) => {
    console.log(`📞 Contacting security for facility ${facilityId}`)
    // TODO: Contact facility security team
    alert(`Contacting security for facility ${facilityId}`)
  }

  // Equipment/Personnel handlers
  const handleEquipmentControl = () => {
    console.log(`⚙️ Equipment control for ${asset.name}`)
    alert(`Equipment control for ${asset.name}`)
  }

  const handlePersonnelContact = () => {
    console.log(`👤 Contacting personnel ${asset.name}`)
    alert(`Contacting personnel ${asset.name}`)
  }

  // Render appropriate control panel based on asset type
  if (asset.type === 'vehicle') {
    return (
      <CompactVehicleControl
        vehicle={asset}
        onClose={onClose}
        onEngineKill={handleEngineKill}
        onTrackVehicle={handleTrackVehicle}
        onViewDetails={onViewVehicleDetails || (() => alert('Opening fleet details...'))}
      />
    )
  }

  if (asset.type === 'facility') {
    return (
      <CompactFacilityControl
        facility={asset}
        onClose={onClose}
        onLockdown={handleFacilityLockdown}
        onMonitor={handleMonitorFacility}
        onViewDetails={onViewFacilityDetails || (() => alert('Opening facility details...'))}
      />
    )
  }

  // Simple panel for equipment and personnel
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-2xl border border-purple-500 min-w-64">
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            {asset.type === 'equipment' ? (
              <ComputerDesktopIcon className="h-6 w-6 text-white" />
            ) : (
              <UserIcon className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-400">
              {asset.type.toUpperCase()} CONTROL
            </h3>
            <p className="text-sm text-gray-400">ID: {asset.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
        >
          ×
        </button>
      </div>

      <div className="mb-4">
        <h4 className="text-lg font-bold text-white">{asset.name}</h4>
        <p className="text-gray-400">{asset.department}</p>
      </div>

      <div className="bg-gray-800 p-3 rounded border border-gray-700 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">STATUS: </span>
          <span className="text-green-400 font-bold uppercase">{asset.status}</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={asset.type === 'equipment' ? handleEquipmentControl : handlePersonnelContact}
          className="w-full bg-purple-700 hover:bg-purple-600 p-3 rounded-lg transition-colors"
        >
          {asset.type === 'equipment' ? 'CONTROL EQUIPMENT' : 'CONTACT PERSONNEL'}
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          GPS: {asset.coordinates[1].toFixed(6)}, {asset.coordinates[0].toFixed(6)}
        </div>
      </div>

      {/* Custom Engine Kill Confirmation Dialog */}
      {showKillConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-2 mr-3">
                <StopIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emergency Fleet Control</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirm engine kill command</p>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>WARNING:</strong> This will immediately stop the fleet engine remotely. 
                Use only in emergency situations.
              </p>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to send engine kill command to fleet <strong>{asset.id}</strong>?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowKillConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmEngineKill(asset.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <StopIcon className="h-4 w-4" />
                <span>Kill Engine</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetControlPopup
