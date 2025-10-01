/**
 * Custom Delete MAC Confirmation Modal
 */

import { useState, useEffect } from 'react'
import { XMarkIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'

interface DeleteMACModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  macName: string
  macCode: string
  employeeCount: number
  vehicleCount: number
  facilityCount: number
  equipmentCount: number
}

const DeleteMACModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  macName, 
  macCode,
  employeeCount,
  vehicleCount,
  facilityCount,
  equipmentCount
}: DeleteMACModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset deleting state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm() // Instant deletion since it's mock data
  }

  const totalAssets = employeeCount + vehicleCount + facilityCount + equipmentCount

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                Delete MAC
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to permanently delete <strong>{macName}</strong> (Code: {macCode})?
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Warning Content */}
          <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                  This action cannot be undone
                </h4>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                  <p>This will permanently delete:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>{employeeCount} employees assigned to this MAC</li>
                    <li>{vehicleCount} vehicles registered to this MAC</li>
                    <li>{facilityCount} facilities under this MAC</li>
                    <li>{equipmentCount} pieces of equipment</li>
                    <li>All historical data and audit logs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Total Impact: {totalAssets} items will be affected
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All personnel will be notified of this change
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
            <button
              onClick={handleConfirm}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors sm:w-auto"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete MAC
            </button>
            <button
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteMACModal
