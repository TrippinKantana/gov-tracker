/**
 * Goods Release Modal
 * Release goods from warehouse to MAC facilities
 */

import { useState, useEffect } from 'react';
import { XMarkIcon, TruckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface GoodsReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: any;
  onSuccess: (release: any) => void;
}

interface ReleaseFormData {
  quantity: number;
  requestingMACId: string;
  requestingMAC: string;
  destinationFacilityId: string;
  destinationFacility: string;
  driverName: string;
  vehicleUsed: string;
  deliveryNote: string;
  approvedBy: string;
  estimatedDeliveryDate: string;
  releaseNotes: string;
}

const GoodsReleaseModal = ({ isOpen, onClose, stockItem, onSuccess }: GoodsReleaseModalProps) => {
  const [formData, setFormData] = useState<ReleaseFormData>({
    quantity: 1,
    requestingMACId: '',
    requestingMAC: '',
    destinationFacilityId: '',
    destinationFacility: '',
    driverName: '',
    vehicleUsed: '',
    deliveryNote: '',
    approvedBy: '',
    estimatedDeliveryDate: new Date().toISOString().split('T')[0],
    releaseNotes: ''
  });

  const [availableMACs, setAvailableMACs] = useState<any[]>([]);
  const [availableFacilities, setAvailableFacilities] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  const loadDropdownData = async () => {
    try {
      // Load MACs
      const macsResponse = await fetch('/api/departments');
      if (macsResponse.ok) {
        const macsData = await macsResponse.json();
        if (macsData.success) {
          setAvailableMACs(macsData.departments);
        }
      }

      // Load Facilities
      const facilitiesResponse = await fetch('/api/facilities');
      if (facilitiesResponse.ok) {
        const facilitiesData = await facilitiesResponse.json();
        if (facilitiesData.success) {
          setAvailableFacilities(facilitiesData.facilities);
        }
      }

      // Load Vehicles
      const vehiclesResponse = await fetch('/api/vehicles');
      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        if (vehiclesData.success) {
          setAvailableVehicles(vehiclesData.vehicles);
        }
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const getFilteredFacilities = () => {
    if (!formData.requestingMAC) return [];
    return availableFacilities.filter(facility => 
      facility.department === formData.requestingMAC
    );
  };

  const handleMACChange = (macId: string) => {
    const selectedMAC = availableMACs.find(mac => mac.id === macId);
    if (selectedMAC) {
      setFormData(prev => ({
        ...prev,
        requestingMACId: macId,
        requestingMAC: selectedMAC.name,
        destinationFacilityId: '', // Reset facility selection
        destinationFacility: ''
      }));
    }
  };

  const handleFacilityChange = (facilityId: string) => {
    const selectedFacility = availableFacilities.find(facility => facility.id === facilityId);
    if (selectedFacility) {
      setFormData(prev => ({
        ...prev,
        destinationFacilityId: facilityId,
        destinationFacility: selectedFacility.name
      }));
    }
  };

  const generateDeliveryNote = () => {
    const today = new Date();
    const noteNumber = `DEL-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    setFormData(prev => ({ ...prev, deliveryNote: noteNumber }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.quantity > stockItem.quantity) {
      alert(`Cannot release ${formData.quantity} items. Only ${stockItem.quantity} available in stock.`);
      return;
    }

    setIsLoading(true);
    try {
      const release = {
        id: `REL_${Date.now()}`,
        stockItemId: stockItem.id,
        itemName: stockItem.name,
        ...formData,
        releasedBy: 'Warehouse Manager', // TODO: Get from current user
        releaseDate: new Date().toISOString(),
        status: 'released',
        createdAt: new Date().toISOString()
      };

      console.log('📦 Releasing goods:', release);

      // API call to create goods release
      const response = await fetch('/api/stock/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stockItemId: stockItem.id,
          itemName: stockItem.name,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to release goods from warehouse');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to release goods');
      }

      onSuccess(release);
      onClose();
    } catch (error) {
      console.error('Error releasing goods:', error);
      alert('Failed to release goods');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !stockItem) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 rounded-lg p-2">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Release Goods from Warehouse</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stockItem.name} - Available: {stockItem.quantity.toLocaleString()} units
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Release Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity to Release *
                </label>
                <input
                  type="number"
                  min="1"
                  max={stockItem.quantity}
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: {stockItem.quantity.toLocaleString()} units</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Delivery Date *
                </label>
                <input
                  type="date"
                  value={formData.estimatedDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requesting MAC *
                </label>
                <select
                  value={formData.requestingMACId}
                  onChange={(e) => handleMACChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select requesting MAC</option>
                  {availableMACs.map(mac => (
                    <option key={mac.id} value={mac.id}>{mac.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destination Facility *
                </label>
                <select
                  value={formData.destinationFacilityId}
                  onChange={(e) => handleFacilityChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  disabled={!formData.requestingMAC}
                  required
                >
                  <option value="">
                    {!formData.requestingMAC ? 'Select MAC first' : 'Select destination facility'}
                  </option>
                  {getFilteredFacilities().map(facility => (
                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Driver Name *
                </label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Name of delivery driver"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vehicle Used *
                </label>
                <select
                  value={formData.vehicleUsed}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleUsed: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select delivery vehicle</option>
                  {availableVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.plateNumber}>
                      {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Note Number
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.deliveryNote}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryNote: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Enter delivery note number"
                  />
                  <button
                    type="button"
                    onClick={generateDeliveryNote}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            {/* Authorization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Approved By *
              </label>
              <input
                type="text"
                value={formData.approvedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, approvedBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                placeholder="Name of authorizing official"
                required
              />
            </div>

            {/* Release Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Release Notes
              </label>
              <textarea
                value={formData.releaseNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseNotes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                placeholder="Additional notes about this release..."
              />
            </div>

            {/* Release Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Release Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Item:</span>
                  <span className="ml-2 font-medium">{stockItem?.name}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                  <span className="ml-2 font-medium">{formData.quantity.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Value:</span>
                  <span className="ml-2 font-medium">${(formData.quantity * (stockItem?.unitCost || 0)).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Destination:</span>
                  <span className="ml-2 font-medium">{formData.destinationFacility || 'Not selected'}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isLoading || !formData.requestingMAC || !formData.destinationFacility || !formData.driverName}
                className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Releasing...</span>
                  </>
                ) : (
                  <>
                    <TruckIcon className="h-4 w-4" />
                    <span>Release Goods</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GoodsReleaseModal;
