/**
 * Vehicle Transfer Modal
 * Transfer vehicles between MACs with plate number updates
 */

import { useState, useEffect } from 'react'
import { XMarkIcon, TruckIcon, ArrowRightIcon, DocumentTextIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { generateAssetGSACode, getMACCode, VEHICLE_CLASS_CODES } from '../utils/gsaCodeGenerator'

interface VehicleTransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (transferData?: any) => void
  vehicle: {
    id: string
    plateNumber: string
    make: string
    model: string
    year: number
    department: string
    departmentId: string
    vinNumber: string
  } | null
}

interface TransferFormData {
  sourceMAC: string
  sourceMACId: string
  destinationMAC: string
  destinationMACId: string
  newPlateNumber: string
  newGSACode: string
  vehicleClass: string
  transferReason: string
  transferDate: string
  authorizedBy: string
  transferNotes: string
  effectiveDate: string
}

// Mock MACs data (this should come from your departments API)
const mockMACs = [
  { id: 'DEPT001', name: 'Ministry of Health', code: 'MOH' },
  { id: 'DEPT002', name: 'Ministry of Agriculture', code: 'MOA' },
  { id: 'DEPT003', name: 'General Services Agency', code: 'GSA' },
  { id: 'DEPT004', name: 'Ministry of Defense', code: 'MOD' },
  { id: 'DEPT005', name: 'Ministry of Education', code: 'MOE' }
]

const VehicleTransferModal = ({ isOpen, onClose, onSuccess, vehicle }: VehicleTransferModalProps) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState<TransferFormData>({
    sourceMAC: '',
    sourceMACId: '',
    destinationMAC: '',
    destinationMACId: '',
    newPlateNumber: '',
    newGSACode: '',
    vehicleClass: 'Sedan',
    transferReason: '',
    transferDate: new Date().toISOString().split('T')[0],
    authorizedBy: user?.name || '',
    transferNotes: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [MACs, setMACs] = useState(mockMACs)

  useEffect(() => {
    if (isOpen && vehicle) {
      // Load MACs from API
      loadMACs()
      
      // Set initial form data
      setFormData({
        sourceMAC: vehicle.department || '',
        sourceMACId: vehicle.departmentId || '',
        destinationMAC: '',
        destinationMACId: '',
        newPlateNumber: vehicle.plateNumber || '',
        transferReason: '',
        transferDate: new Date().toISOString().split('T')[0],
        authorizedBy: user?.name || '',
        transferNotes: '',
        effectiveDate: new Date().toISOString().split('T')[0]
      })
      setErrors({})
    }
  }, [isOpen, vehicle, user])

  const loadMACs = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.departments) {
          setMACs(data.departments)
        }
      }
    } catch (error) {
      console.error('Error loading MACs:', error)
    }
  }

  const handleInputChange = (field: keyof TransferFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDestinationMACChange = async (macId: string) => {
    const selectedMAC = MACs.find(mac => mac.id === macId)
    if (selectedMAC) {
      try {
        // Generate new GSA code for destination MAC
        const newGSACode = await generateAssetGSACode(selectedMAC.name, 'vehicle', formData.vehicleClass)
        
        setFormData(prev => ({
          ...prev,
          destinationMACId: macId,
          destinationMAC: selectedMAC.name,
          newGSACode: newGSACode
        }))
      } catch (error) {
        console.error('Error generating new GSA code:', error)
        setFormData(prev => ({
          ...prev,
          destinationMACId: macId,
          destinationMAC: selectedMAC.name,
          newGSACode: 'GSA-XXX-XX-XXX'
        }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.destinationMACId) newErrors.destinationMAC = 'Destination MAC is required'
    if (!formData.newPlateNumber.trim()) newErrors.newPlateNumber = 'New plate number is required'
    if (!formData.transferReason.trim()) newErrors.transferReason = 'Transfer reason is required'
    if (!formData.authorizedBy.trim()) newErrors.authorizedBy = 'Authorized by is required'
    if (!formData.transferDate) newErrors.transferDate = 'Transfer date is required'
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective date is required'

    // Validate destination is different from source
    if (formData.destinationMACId === formData.sourceMACId) {
      newErrors.destinationMAC = 'Destination MAC must be different from source MAC'
    }

    // Validate dates
    if (formData.effectiveDate < formData.transferDate) {
      newErrors.effectiveDate = 'Effective date cannot be before transfer date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTransfer = async () => {
    if (!validateForm() || !vehicle) return

    setIsLoading(true)
    
    try {
      // Simulate transfer API call
      const transferData = {
        vehicleId: vehicle.id,
        oldPlateNumber: vehicle.plateNumber,
        newPlateNumber: formData.newPlateNumber,
        fromMAC: formData.sourceMAC,
        toMAC: formData.destinationMAC,
        transferReason: formData.transferReason,
        transferDate: formData.transferDate,
        effectiveDate: formData.effectiveDate,
        authorizedBy: formData.authorizedBy,
        notes: formData.transferNotes,
        timestamp: new Date().toISOString()
      }

      // TODO: Call transfer API
      console.log('🔄 Vehicle Transfer:', transferData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess(transferData)
      onClose()
    } catch (error) {
      console.error('Transfer error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !vehicle) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <TruckIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Transfer Fleet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Transfer {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.plateNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Current Vehicle Info */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Current Assignment</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Vehicle:</span>
                <p className="font-medium text-gray-900 dark:text-white">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Current Plate:</span>
                <p className="font-medium text-gray-900 dark:text-white">{vehicle.plateNumber}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Current MAC:</span>
                <p className="font-medium text-gray-900 dark:text-white">{vehicle.department}</p>
              </div>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* MAC Transfer Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <ArrowRightIcon className="h-5 w-5 mr-2" />
                  MAC Transfer
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Source MAC (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      From MAC
                    </label>
                    <input
                      type="text"
                      value={formData.sourceMAC}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  {/* Destination MAC */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To MAC *
                    </label>
                    <select
                      value={formData.destinationMACId}
                      onChange={(e) => handleDestinationMACChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.destinationMAC ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select destination MAC</option>
                      {MACs.filter(mac => mac.id !== formData.sourceMACId).map(mac => (
                        <option key={mac.id} value={mac.id}>
                          {mac.name} ({mac.code})
                        </option>
                      ))}
                    </select>
                    {errors.destinationMAC && <p className="mt-1 text-sm text-red-600">{errors.destinationMAC}</p>}
                  </div>
                </div>
              </div>

              {/* Plate Number Update */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Plate Number Update
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Plate Number
                    </label>
                    <input
                      type="text"
                      value={vehicle.plateNumber}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Plate Number *
                    </label>
                    <input
                      type="text"
                      value={formData.newPlateNumber}
                      onChange={(e) => handleInputChange('newPlateNumber', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.newPlateNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., LBR-MOH-001"
                    />
                    {errors.newPlateNumber && <p className="mt-1 text-sm text-red-600">{errors.newPlateNumber}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      New plate number for destination MAC
                    </p>
                  </div>
                </div>
                
                {/* GSA Code Update */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current GSA Code
                    </label>
                    <input
                      type="text"
                      value={vehicle.gsaCode || 'Not assigned'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New GSA Code (Auto-Generated)
                    </label>
                    <input
                      type="text"
                      value={formData.newGSACode}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 font-mono font-semibold"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      GSA code for destination MAC
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Details */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Transfer Details
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transfer Reason *
                    </label>
                    <select
                      value={formData.transferReason}
                      onChange={(e) => handleInputChange('transferReason', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.transferReason ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select transfer reason</option>
                      <option value="operational_need">Operational Need</option>
                      <option value="budget_reallocation">Budget Reallocation</option>
                      <option value="maintenance_relocation">Maintenance Relocation</option>
                      <option value="mac_restructure">MAC Restructure</option>
                      <option value="emergency_assignment">Emergency Assignment</option>
                      <option value="fleet_optimization">Fleet Optimization</option>
                      <option value="other">Other (specify in notes)</option>
                    </select>
                    {errors.transferReason && <p className="mt-1 text-sm text-red-600">{errors.transferReason}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Transfer Date *
                      </label>
                      <input
                        type="date"
                        value={formData.transferDate}
                        onChange={(e) => handleInputChange('transferDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.transferDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.transferDate && <p className="mt-1 text-sm text-red-600">{errors.transferDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Effective Date *
                      </label>
                      <input
                        type="date"
                        value={formData.effectiveDate}
                        onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.effectiveDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.effectiveDate && <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Authorized By *
                    </label>
                    <input
                      type="text"
                      value={formData.authorizedBy}
                      onChange={(e) => handleInputChange('authorizedBy', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.authorizedBy ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Director John Smith"
                    />
                    {errors.authorizedBy && <p className="mt-1 text-sm text-red-600">{errors.authorizedBy}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transfer Notes
                    </label>
                    <textarea
                      value={formData.transferNotes}
                      onChange={(e) => handleInputChange('transferNotes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Additional notes about this transfer..."
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Transfer Summary</h4>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <p><strong>Fleet:</strong> {vehicle.year} {vehicle.make} {vehicle.model}</p>
                  <p><strong>From:</strong> {formData.sourceMAC}</p>
                  <p><strong>To:</strong> {formData.destinationMAC || 'Not selected'}</p>
                  <p><strong>Plate Change:</strong> {vehicle.plateNumber} → {formData.newPlateNumber || 'Not specified'}</p>
                  <p><strong>GSA Code Change:</strong> {vehicle.gsaCode || 'Current'} → {formData.newGSACode || 'New code'}</p>
                  <p><strong>Effective:</strong> {formData.effectiveDate || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing Transfer...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightIcon className="h-4 w-4" />
                    <span>Complete Transfer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VehicleTransferModal
