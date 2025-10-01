/**
 * Delete Personnel Confirmation Modal
 */

import { useState } from 'react'
import { XMarkIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'

interface DeletePersonnelModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  personnelName: string
  badgeNumber: string
  department: string
  vehicleAssignments: number
  equipmentAssignments: number
}

const DeletePersonnelModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  personnelName, 
  badgeNumber,
  department,
  vehicleAssignments,
  equipmentAssignments
}: DeletePersonnelModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    setIsDeleting(true)
    setTimeout(() => {
      onConfirm()
      setIsDeleting(false)
    }, 1000)
  }

  const totalAssignments = vehicleAssignments + equipmentAssignments

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
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
                Remove Personnel
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to remove <strong>{personnelName}</strong> (Badge: {badgeNumber})?
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
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Impact Assessment
                </h4>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <p>This will affect the following assignments:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>{vehicleAssignments} vehicle assignments will be unassigned</li>
                    <li>{equipmentAssignments} equipment assignments will be unassigned</li>
                    <li>Personnel record will be permanently removed</li>
                    <li>All assignment history will be preserved for audit</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Total Impact: {totalAssignments} asset assignments will be affected
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Assets will become unassigned and available for reassignment
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Removing...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Remove Personnel
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeletePersonnelModal
