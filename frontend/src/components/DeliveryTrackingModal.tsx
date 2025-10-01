/**
 * Delivery Tracking Modal
 * Track goods delivery and facilitate dual confirmation
 */

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, TruckIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';

interface DeliveryTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: any;
  onStatusUpdate: (updatedRelease: any) => void;
}

const DeliveryTrackingModal = ({ isOpen, onClose, release, onStatusUpdate }: DeliveryTrackingModalProps) => {
  const [confirmationData, setConfirmationData] = useState({
    receivedBy: '',
    receivedDate: new Date().toISOString().split('T')[0],
    receivedTime: new Date().toTimeString().slice(0, 5),
    conditionNotes: '',
    damageReported: false,
    damageDescription: '',
    facilityManagerSignature: ''
  });

  const [isConfirming, setIsConfirming] = useState(false);

  const handleWarehouseConfirmDelivered = async () => {
    setIsConfirming(true);
    try {
      const updatedRelease = {
        ...release,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('📦 Warehouse confirming delivery:', updatedRelease);

      // API call to update release status
      const response = await fetch(`/api/stock/releases/${release.id}/delivered`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveredAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm delivery');
      }

      onStatusUpdate(updatedRelease);
      console.log('✅ Warehouse confirmed goods delivered');
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Failed to confirm delivery');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleFacilityConfirmReceived = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmationData.receivedBy.trim()) {
      alert('Please enter who received the goods');
      return;
    }

    setIsConfirming(true);
    try {
      const updatedRelease = {
        ...release,
        status: 'confirmed',
        facilityConfirmation: {
          ...confirmationData,
          confirmedAt: new Date().toISOString()
        },
        completedAt: new Date().toISOString()
      };

      console.log('🏢 Facility confirming receipt:', updatedRelease);

      // TODO: API call to confirm receipt and convert to assets
      const assetConversionResponse = await fetch('/api/stock/convert-to-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          releaseId: release.id,
          confirmation: confirmationData,
          macId: release.requestingMACId,
          facilityId: release.destinationFacilityId
        })
      });

      if (assetConversionResponse.ok) {
        onStatusUpdate(updatedRelease);
        console.log('✅ Goods converted to assets successfully');
        alert('Goods received and converted to trackable assets!');
        onClose();
      } else {
        throw new Error('Failed to convert goods to assets');
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert('Failed to confirm receipt');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen || !release) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Tracking</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {release.quantity} × {release.itemName} → {release.destinationFacility}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Delivery Status Timeline */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Delivery Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Goods Released from Warehouse</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(release.releaseDate).toLocaleDateString()} by {release.releasedBy}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 ${release.status === 'delivered' || release.status === 'confirmed' ? 'bg-green-500' : 'bg-orange-500'} rounded-full flex items-center justify-center`}>
                    <TruckIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {release.status === 'delivered' || release.status === 'confirmed' ? 'Delivered to Facility' : 'In Transit'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Driver: {release.driverName} • Vehicle: {release.vehicleUsed}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 ${release.status === 'confirmed' ? 'bg-green-500' : 'bg-gray-300'} rounded-full flex items-center justify-center`}>
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {release.status === 'confirmed' ? 'Receipt Confirmed by Facility' : 'Awaiting Facility Confirmation'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {release.status === 'confirmed' ? 'Goods converted to trackable assets' : 'Facility staff must confirm receipt'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse Actions */}
            {release.status === 'released' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Warehouse Confirmation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Confirm that goods have been delivered to the facility by the driver.
                </p>
                <button
                  onClick={handleWarehouseConfirmDelivered}
                  disabled={isConfirming}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isConfirming ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" />
                  )}
                  <span>Confirm Delivered</span>
                </button>
              </div>
            )}

            {/* Facility Receipt Confirmation */}
            {release.status === 'delivered' && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Facility Receipt Confirmation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Facility staff must confirm receipt of goods. This will convert the goods to trackable assets.
                </p>
                
                <form onSubmit={handleFacilityConfirmReceived} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Received By *
                      </label>
                      <input
                        type="text"
                        value={confirmationData.receivedBy}
                        onChange={(e) => setConfirmationData(prev => ({ ...prev, receivedBy: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        placeholder="Name of person receiving goods"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Received Date & Time
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="date"
                          value={confirmationData.receivedDate}
                          onChange={(e) => setConfirmationData(prev => ({ ...prev, receivedDate: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                        <input
                          type="time"
                          value={confirmationData.receivedTime}
                          onChange={(e) => setConfirmationData(prev => ({ ...prev, receivedTime: e.target.value }))}
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={confirmationData.damageReported}
                        onChange={(e) => setConfirmationData(prev => ({ ...prev, damageReported: e.target.checked }))}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Report damage or missing items</span>
                    </label>
                    
                    {confirmationData.damageReported && (
                      <textarea
                        value={confirmationData.damageDescription}
                        onChange={(e) => setConfirmationData(prev => ({ ...prev, damageDescription: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white mt-2"
                        placeholder="Describe any damage or missing items..."
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Condition Notes
                    </label>
                    <textarea
                      value={confirmationData.conditionNotes}
                      onChange={(e) => setConfirmationData(prev => ({ ...prev, conditionNotes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="Notes about the condition of received goods..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Facility Manager Signature *
                    </label>
                    <input
                      type="text"
                      value={confirmationData.facilityManagerSignature}
                      onChange={(e) => setConfirmationData(prev => ({ ...prev, facilityManagerSignature: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="Facility manager name and signature"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isConfirming}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isConfirming ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Converting to Assets...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>Confirm Receipt & Convert to Assets</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Delivery Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Delivery Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Release ID:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{release.id}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Delivery Note:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{release.deliveryNote}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Approved By:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{release.approvedBy}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Released By:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{release.releasedBy}</span>
                </div>
              </div>
            </div>

            {/* Warehouse Actions for In Transit */}
            {release.status === 'in_transit' && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Warehouse Actions</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Warehouse staff: Confirm when goods have been delivered to the facility.
                </p>
                <button
                  onClick={handleWarehouseConfirmDelivered}
                  disabled={isConfirming}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isConfirming ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <MapPinIcon className="h-4 w-4" />
                  )}
                  <span>Confirm Delivered to Facility</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTrackingModal;
