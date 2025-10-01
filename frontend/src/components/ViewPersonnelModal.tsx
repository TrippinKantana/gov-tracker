/**
 * View Personnel Modal - Professional dialog matching other view modals
 */

import { useState, useEffect } from 'react'
import { XMarkIcon, UserIcon, MapIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Personnel {
  id: string
  fullName: string
  email?: string
  phone?: string
  badgeNumber: string
  department: string
  position: string
  clearanceLevel: 'standard' | 'confidential' | 'secret' | 'top_secret'
  dateHired: string
  facilityAssignment?: string
  status: 'active' | 'inactive' | 'on_leave'
  vehicleAssignments?: string[]
  equipmentAssignments?: string[]
  createdAt: string
}

interface ViewPersonnelModalProps {
  isOpen: boolean
  onClose: () => void
  personnelId: string | null
  onEdit?: (personnelId: string) => void
  onDelete?: (personnelId: string) => void
  onViewOnMap?: (personnelId: string) => void
}

const ViewPersonnelModal = ({ isOpen, onClose, personnelId, onEdit, onDelete, onViewOnMap }: ViewPersonnelModalProps) => {
  const [personnel, setPersonnel] = useState<Personnel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'contact'>('overview')

  useEffect(() => {
    if (isOpen && personnelId) {
      fetchPersonnelDetails()
    }
  }, [isOpen, personnelId])

  const fetchPersonnelDetails = async () => {
    if (!personnelId) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // Fetch real personnel data from API
      const response = await fetch(`/api/personnel/${personnelId}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.personnel) {
          setPersonnel(result.personnel)
          console.log('✅ Personnel details loaded from API:', result.personnel)
        } else {
          throw new Error(result.message || 'Personnel not found')
        }
      } else {
        throw new Error(`HTTP ${response.status}: Failed to fetch personnel details`)
      }
    } catch (error) {
      console.error('❌ Error loading personnel details:', error)
      setError('Failed to load personnel details')
    } finally {
      setIsLoading(false)
    }
  }

  const getClearanceColor = (level: string) => {
    switch (level) {
      case 'top_secret': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'secret': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'confidential': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personnel Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Government staff information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading personnel details...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {personnel && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Main Content Area */}
                  <div className="lg:col-span-3">
                    {/* Personnel Header */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xl">
                            {personnel.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{personnel.fullName}</h2>
                          <p className="text-lg text-gray-600 dark:text-gray-300">{personnel.position}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Badge: {personnel.badgeNumber}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mt-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(personnel.status)}`}>
                          {personnel.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getClearanceColor(personnel.clearanceLevel)}`}>
                          {personnel.clearanceLevel.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                          onClick={() => setActiveTab('overview')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'overview'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          Overview
                        </button>
                        <button
                          onClick={() => setActiveTab('assignments')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'assignments'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          Asset Assignments
                        </button>
                        <button
                          onClick={() => setActiveTab('contact')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'contact'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          Contact & Details
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                      {/* Overview Tab */}
                      {activeTab === 'overview' && (
                        <div className="space-y-6">
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personnel Information</h3>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                                  <p className="text-lg font-medium text-gray-900 dark:text-white">{personnel.department}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
                                  <p className="text-lg font-medium text-gray-900 dark:text-white">{personnel.position}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Hired</label>
                                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    {new Date(personnel.dateHired).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Clearance Level</label>
                                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getClearanceColor(personnel.clearanceLevel)}`}>
                                    {personnel.clearanceLevel.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(personnel.status)}`}>
                                    {personnel.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Facility Assignment</label>
                                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    {personnel.facilityAssignment || 'Not assigned'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assignments Tab */}
                      {activeTab === 'assignments' && (
                        <div className="space-y-6">
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asset Assignments</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Vehicle Assignments</h4>
                                <div className="space-y-2">
                                  {personnel.vehicleAssignments && personnel.vehicleAssignments.length > 0 ? (
                                    personnel.vehicleAssignments.map((vehicleId, index) => (
                                      <div key={index} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
                                        <p className="font-medium text-gray-900 dark:text-white">Vehicle {vehicleId}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Assigned vehicle</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No vehicle assignments</p>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">Equipment Assignments</h4>
                                <div className="space-y-2">
                                  {personnel.equipmentAssignments && personnel.equipmentAssignments.length > 0 ? (
                                    personnel.equipmentAssignments.map((equipmentId, index) => (
                                      <div key={index} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
                                        <p className="font-medium text-gray-900 dark:text-white">Equipment {equipmentId}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Assigned equipment</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No equipment assignments</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Contact Tab */}
                      {activeTab === 'contact' && (
                        <div className="space-y-6">
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                            <div className="space-y-4">
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <div className="space-y-3">
                                  {personnel.email && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                                      <span className="text-gray-900 dark:text-white">{personnel.email}</span>
                                    </div>
                                  )}
                                  {personnel.phone && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                                      <span className="text-gray-900 dark:text-white">{personnel.phone}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Badge Number:</span>
                                    <span className="text-gray-900 dark:text-white">{personnel.badgeNumber}</span>
                                  </div>
                                </div>
                              </div>

                              {personnel.facilityAssignment && (
                                <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Facility Assignment</label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{personnel.facilityAssignment}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar with Actions */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        {personnel.facilityAssignment && (
                          <button
                            onClick={() => {
                              if (onViewOnMap) onViewOnMap(personnel.id);
                              onClose();
                            }}
                            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <MapIcon className="h-5 w-5" />
                            <span>View on Facility Map</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (onEdit) onEdit(personnel.id);
                            onClose();
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <PencilIcon className="h-5 w-5" />
                          <span>Edit Personnel</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onDelete) onDelete(personnel.id);
                            onClose();
                          }}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <TrashIcon className="h-5 w-5" />
                          <span>Remove Personnel</span>
                        </button>
                      </div>
                    </div>

                    {/* Assignment Summary */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assignment Summary</h3>
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {(personnel.vehicleAssignments?.length || 0) + (personnel.equipmentAssignments?.length || 0)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
                        </div>

                        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{personnel.vehicleAssignments?.length || 0}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Vehicles</p>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{personnel.equipmentAssignments?.length || 0}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Equipment</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewPersonnelModal
