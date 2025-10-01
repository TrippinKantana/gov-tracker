import { useState, useEffect } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { departments } from '../data/organizationData';

interface EditFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (facilityData?: any) => void;
  facilityId: string | null;
}

interface FacilityFormData {
  name: string;
  type: 'ministry' | 'hospital' | 'school' | 'police_station' | 'military_base' | 'warehouse';
  address: string;
  latitude: number | '';
  longitude: number | '';
  capacity: number | '';
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  department: string;
  departmentId: string;
  status: 'operational' | 'maintenance' | 'under_construction' | 'closed';
  securityLevel: 'low' | 'medium' | 'high' | 'restricted';
  notes: string;
}

const EditFacilityModal = ({ isOpen, onClose, onSuccess, facilityId }: EditFacilityModalProps) => {
  const [formData, setFormData] = useState<FacilityFormData>({
    name: '',
    type: 'ministry',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    department: '',
    departmentId: '',
    status: 'operational',
    securityLevel: 'medium',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && facilityId) {
      fetchFacilityData();
    }
  }, [isOpen, facilityId]);

  const fetchFacilityData = async () => {
    if (!facilityId) return;
    
    setIsFetching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/facilities/${facilityId}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        const facility = result.facility;
        setFormData({
          name: facility.name || '',
          type: facility.type || 'ministry',
          address: facility.address || '',
          latitude: facility.location?.[1] || '',
          longitude: facility.location?.[0] || '',
          capacity: facility.capacity || '',
          contactPerson: facility.contactPerson || '',
          contactPhone: facility.contactPhone || '',
          contactEmail: facility.contactEmail || '',
          department: facility.department || '',
          departmentId: facility.departmentId || '',
          status: facility.status || 'operational',
          securityLevel: facility.securityLevel || 'medium',
          notes: facility.notes || ''
        });
      } else {
        throw new Error(result.message || 'Failed to fetch facility data');
      }
    } catch (error) {
      console.error('Error fetching facility data:', error);
      setErrors({ general: 'Failed to load facility data' });
    } finally {
      setIsFetching(false);
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    setFormData({
      ...formData,
      departmentId,
      department: department?.name || ''
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Facility name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.latitude === '' || formData.latitude === undefined) newErrors.latitude = 'Latitude is required';
    if (formData.longitude === '' || formData.longitude === undefined) newErrors.longitude = 'Longitude is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Contact phone is required';
    if (!formData.departmentId) newErrors.department = 'Department is required';

    // GPS coordinate validation
    if (formData.latitude !== '' && (Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (formData.longitude !== '' && (Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    // Email validation
    if (formData.contactEmail && !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const facilityData = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        coordinates: [Number(formData.longitude), Number(formData.latitude)],
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        department: formData.department,
        departmentId: formData.departmentId,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        status: formData.status,
        securityLevel: formData.securityLevel,
        notes: formData.notes
      };

      const response = await fetch(`http://localhost:5000/api/facilities/${facilityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facilityData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Facility updated successfully:', result.facility);
        onSuccess(result.facility);
        onClose();
      } else {
        throw new Error(result.message || 'Failed to update facility');
      }
    } catch (error) {
      console.error('Error updating facility:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to update facility. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Facility</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update facility information and assignment details
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Loading State */}
          {isFetching && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading facility data...</span>
            </div>
          )}

          {/* Form */}
          {!isFetching && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errors.general && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Facility Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Facility Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Facility Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as FacilityFormData['type'] })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ministry">Ministry / Government Building</option>
                      <option value="hospital">Hospital / Medical Center</option>
                      <option value="school">School / Educational Institution</option>
                      <option value="police_station">Police Station</option>
                      <option value="military_base">Military Base / Defense Facility</option>
                      <option value="warehouse">Warehouse / Storage Facility</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department *</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as FacilityFormData['status'] })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="operational">Operational</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="under_construction">Under Construction</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Security Level</label>
                    <select
                      value={formData.securityLevel}
                      onChange={(e) => setFormData({ ...formData, securityLevel: e.target.value as FacilityFormData['securityLevel'] })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="restricted">Restricted</option>
                    </select>
                  </div>
                </div>

                {/* Location & Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <MapPinIcon className="h-5 w-5" />
                    <span>Location & Contact</span>
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address *</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latitude *</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : '' })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Longitude *</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : '' })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capacity</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : '' })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Maximum people capacity"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Person *</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Phone *</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about this facility..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || isFetching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Updating...' : 'Update Facility'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditFacilityModal;
