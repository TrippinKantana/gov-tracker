import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, MapPinIcon, ComputerDesktopIcon, MapIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Equipment, equipmentService } from '../../services/equipmentService';

interface ViewEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string | null;
  onEdit?: (equipmentId: string) => void;
  onDelete?: (equipmentId: string) => void;
  onViewOnMap?: (equipmentId: string) => void;
}

const ViewEquipmentModal = ({ isOpen, onClose, equipmentId, onEdit, onDelete, onViewOnMap }: ViewEquipmentModalProps) => {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'maintenance'>('overview');

  useEffect(() => {
    if (isOpen && equipmentId) {
      fetchEquipment();
      setActiveTab('overview'); // Reset to overview when opening
    }
  }, [isOpen, equipmentId]);

  const fetchEquipment = async () => {
    if (!equipmentId) return;
    
    setIsLoading(true);
    setError('');
    try {
      const data = await equipmentService.getEquipmentById(equipmentId);
      setEquipment(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setError('Failed to load equipment details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'available': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'retired': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'lost': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Depreciation calculation function (same as in main Assets page)
  const calculateDepreciation = (equipment: Equipment) => {
    if (!equipment.purchasePrice || !equipment.purchaseDate) {
      return { currentValue: 0, depreciationRate: 0, totalDepreciation: 0, depreciationPerYear: 0, yearsElapsed: 0 };
    }

    // Use default values if depreciation fields are missing
    const usefulLife = equipment.usefulLife || (equipment.category === 'furniture' ? 10 : 4); // Default: 10 years furniture, 4 years equipment
    const salvageValue = equipment.salvageValue || Math.round(equipment.purchasePrice * 0.1); // Default: 10% of purchase price

    const purchaseDate = new Date(equipment.purchaseDate);
    const currentDate = new Date();
    const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    const cost = equipment.purchasePrice;
    
    // Straight-line depreciation (standard for government)
    const depreciationPerYear = (cost - salvageValue) / usefulLife;
    const totalDepreciation = Math.min(depreciationPerYear * yearsElapsed, cost - salvageValue);
    const currentValue = Math.max(cost - totalDepreciation, salvageValue);
    const depreciationRate = (totalDepreciation / cost) * 100;

    return {
      currentValue: Math.round(currentValue),
      depreciationRate: Math.round(depreciationRate),
      totalDepreciation: Math.round(totalDepreciation),
      depreciationPerYear: Math.round(depreciationPerYear),
      yearsElapsed: Math.round(yearsElapsed * 100) / 100
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <ComputerDesktopIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Equipment Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Government equipment asset information</p>
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
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading equipment details...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {equipment && (
              <>
                {/* Equipment Header Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                        <ComputerDesktopIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{equipment.name}</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{equipment.brand} {equipment.model}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Serial: {equipment.serialNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(equipment.status)}`}>
                        {equipment.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getConditionColor(equipment.condition)}`}>
                        {equipment.condition}
                      </span>
                    </div>
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
                      onClick={() => setActiveTab('location')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'location'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Location & Assignment
                    </button>
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'maintenance'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Purchase & Warranty
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Main Content Area */}
                  <div className="lg:col-span-3">
                    
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Equipment Details */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Equipment Details</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">{equipment.type}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{equipment.brand}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{equipment.model}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Serial Number</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white font-mono">{equipment.serialNumber}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">{equipment.department}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Status</label>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-sm font-semibold ${getStatusColor(equipment.status)}`}>
                                    {equipment.status}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-sm font-semibold ${getConditionColor(equipment.condition)}`}>
                                    {equipment.condition}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {equipment.notes && (
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                              <p className="text-gray-700 dark:text-gray-300">{equipment.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location Tab */}
                    {activeTab === 'location' && (
                      <div className="space-y-6">
                        {/* Employee Assignment */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee Assignment</h3>
                          {equipment.assignedEmployee ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <div>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{equipment.assignedEmployee.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Badge: {equipment.assignedEmployee.badgeNumber}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4 text-center">
                              <UserIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-600 dark:text-gray-400">Not assigned to any employee</p>
                            </div>
                          )}
                        </div>

                        {/* Facility Location */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Facility Location</h3>
                          {equipment.facility ? (
                            <div className="space-y-4">
                              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                  <MapPinIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                  <div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{equipment.facility.name}</p>
                                    {equipment.facility.room && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Room: {equipment.facility.room}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600 dark:text-gray-400">Specific Location:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{equipment.location}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <MapPinIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">No Facility Assignment</p>
                                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                                    This equipment is not assigned to a specific facility. Edit the equipment to assign it to a facility for location tracking.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Maintenance Tab - Purchase, Warranty & Depreciation */}
                    {activeTab === 'maintenance' && (
                      <div className="space-y-6">
                        {/* Asset Depreciation - Top Priority Display */}
                        {equipment.purchasePrice && (
                          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                              Asset Depreciation Analysis
                            </h3>
                            {(!equipment.usefulLife || !equipment.salvageValue) && (
                              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                  <strong>Note:</strong> Using standard government depreciation defaults - 
                                  {equipment.category === 'furniture' ? ' 10 years useful life for furniture' : ' 4 years useful life for equipment'} 
                                  {' '}and 10% salvage value.
                                </p>
                              </div>
                            )}
                            {(() => {
                              const depreciation = calculateDepreciation(equipment);
                              return (
                                <div className="space-y-4">
                                  {/* Large Depreciation Summary Cards */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-6 text-center border border-blue-200 dark:border-blue-700">
                                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Original Value</p>
                                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        ${equipment.purchasePrice.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Purchase price ({new Date(equipment.purchaseDate).getFullYear()})</p>
                                    </div>

                                    <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-6 text-center border border-green-200 dark:border-green-700">
                                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Current Value</p>
                                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        ${depreciation.currentValue.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">After {depreciation.yearsElapsed} years</p>
                                    </div>

                                    <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-6 text-center border border-red-200 dark:border-red-700">
                                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Total Depreciation</p>
                                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                        ${depreciation.totalDepreciation.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">{depreciation.depreciationRate}% depreciated</p>
                                    </div>
                                  </div>

                                  {/* Depreciation Timeline Progress */}
                                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-center mb-3">
                                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Asset Lifecycle Progress</span>
                                      <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                                        {depreciation.yearsElapsed.toFixed(1)} of {equipment.usefulLife} years
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                      <div 
                                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-4 rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${Math.min((depreciation.yearsElapsed / equipment.usefulLife) * 100, 100)}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    <span>New Asset</span>
                                    <span>Current: {depreciation.depreciationRate}%</span>
                                    <span>End of Life</span>
                                    </div>
                                  </div>

                                  {/* Quick Financial Facts */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                      <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Annual Depreciation</h4>
                                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        ${depreciation.depreciationPerYear.toLocaleString()}
                                      </p>
                                      <p className="text-sm text-purple-700 dark:text-purple-500">per year</p>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                                      <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Remaining Life</h4>
                                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {Math.max(0, equipment.usefulLife - depreciation.yearsElapsed).toFixed(1)}
                                      </p>
                                      <p className="text-sm text-orange-700 dark:text-orange-500">years left</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Purchase Information */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase Information</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Purchase Date</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                  {equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString() : 'Not recorded'}
                                </p>
                              </div>
                              {equipment.purchasePrice && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Original Purchase Price</label>
                                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                                    ${equipment.purchasePrice.toLocaleString()}
                                  </p>
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Useful Life</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                  {equipment.usefulLife || (equipment.category === 'furniture' ? 10 : 4)} years
                                  {!equipment.usefulLife && <span className="text-sm text-yellow-600 dark:text-yellow-400 ml-2">(default)</span>}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {equipment.warrantyExpiry && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Warranty Status</label>
                                  <div className="space-y-1">
                                    <p className={`text-lg font-medium ${
                                      new Date(equipment.warrantyExpiry) < new Date() 
                                        ? 'text-red-600 dark:text-red-400' 
                                        : 'text-green-600 dark:text-green-400'
                                    }`}>
                                      {new Date(equipment.warrantyExpiry) < new Date() ? 'Expired' : 'Active'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Expires: {new Date(equipment.warrantyExpiry).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {equipment.lastMaintenance && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Maintenance</label>
                                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    {new Date(equipment.lastMaintenance).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                              <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Salvage Value</label>
                                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                                  ${(equipment.salvageValue || Math.round(equipment.purchasePrice * 0.1)).toLocaleString()}
                                  {!equipment.salvageValue && <span className="text-sm text-yellow-600 dark:text-yellow-400 ml-2">(default 10%)</span>}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Asset Depreciation */}
                        {equipment.purchasePrice && equipment.usefulLife && (
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Asset Depreciation</h3>
                            {(() => {
                              const depreciation = calculateDepreciation(equipment);
                              return (
                                <div className="space-y-4">
                                  {/* Depreciation Summary Cards */}
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Original Value</p>
                                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        ${equipment.purchasePrice.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">Purchase price</p>
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
                                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        ${depreciation.currentValue.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">After depreciation</p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Depreciation</p>
                                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        ${depreciation.totalDepreciation.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">{depreciation.depreciationRate}% depreciated</p>
                                    </div>
                                  </div>

                                  {/* Detailed Depreciation Information */}
                                  <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Asset Age:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {depreciation.yearsElapsed} years
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Annual Depreciation:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            ${depreciation.depreciationPerYear.toLocaleString()}/year
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Useful Life:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {equipment.usefulLife || (equipment.category === 'furniture' ? 10 : 4)} years
                                            {!equipment.usefulLife && <span className="text-yellow-600 text-xs ml-1">(default)</span>}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Depreciation Method:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">Straight-line</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Remaining Life:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {Math.max(0, (equipment.usefulLife || (equipment.category === 'furniture' ? 10 : 4)) - depreciation.yearsElapsed).toFixed(1)} years
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Salvage Value:</span>
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            ${(equipment.salvageValue || Math.round(equipment.purchasePrice * 0.1)).toLocaleString()}
                                            {!equipment.salvageValue && <span className="text-yellow-600 text-xs ml-1">(default 10%)</span>}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Depreciation Timeline */}
                                  <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Depreciation Progress</span>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {depreciation.yearsElapsed.toFixed(1)} of {equipment.usefulLife || (equipment.category === 'furniture' ? 10 : 4)} years
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                      <div 
                                        className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((depreciation.yearsElapsed / (equipment.usefulLife || (equipment.category === 'furniture' ? 10 : 4))) * 100, 100)}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      <span>New</span>
                                      <span>End of Life</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Warranty Alert */}
                        {equipment.warrantyExpiry && (
                          <div className={`rounded-lg p-4 ${
                            new Date(equipment.warrantyExpiry) < new Date()
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className={`rounded-full p-2 ${
                                new Date(equipment.warrantyExpiry) < new Date()
                                  ? 'bg-red-100 dark:bg-red-900'
                                  : 'bg-green-100 dark:bg-green-900'
                              }`}>
                                <WrenchScrewdriverIcon className={`h-5 w-5 ${
                                  new Date(equipment.warrantyExpiry) < new Date()
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`} />
                              </div>
                              <div>
                                <p className={`font-medium ${
                                  new Date(equipment.warrantyExpiry) < new Date()
                                    ? 'text-red-700 dark:text-red-300'
                                    : 'text-green-700 dark:text-green-300'
                                }`}>
                                  {new Date(equipment.warrantyExpiry) < new Date() ? 'Warranty Expired' : 'Warranty Active'}
                                </p>
                                <p className={`text-sm ${
                                  new Date(equipment.warrantyExpiry) < new Date()
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {new Date(equipment.warrantyExpiry) < new Date()
                                    ? 'This equipment is no longer under warranty'
                                    : `Warranty valid until ${new Date(equipment.warrantyExpiry).toLocaleDateString()}`
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sidebar with Actions */}
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        {/* View on Map button - only show if equipment has facility assignment */}
                        {equipment.facility && (
                          <button
                            onClick={() => {
                              if (onViewOnMap) onViewOnMap(equipment.id);
                              onClose();
                            }}
                            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <MapIcon className="h-5 w-5" />
                            <span>View on Map</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (onEdit) onEdit(equipment.id);
                            onClose();
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <WrenchScrewdriverIcon className="h-5 w-5" />
                          <span>Edit Equipment</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onDelete) onDelete(equipment.id);
                            onClose();
                          }}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <XMarkIcon className="h-5 w-5" />
                          <span>Delete Equipment</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Status */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Summary</h3>
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(equipment.status)}`}>
                            {equipment.status}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Current Status</p>
                        </div>

                        <div className="text-center">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getConditionColor(equipment.condition)}`}>
                            {equipment.condition}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Condition</p>
                        </div>

                        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{equipment.department}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
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
  );
};

export default ViewEquipmentModal;
