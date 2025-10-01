import { useState } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { departments } from '../../data/organizationData';

interface AddFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (facilityData?: any) => void;
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
  rooms: string[]; // List of room names/numbers
}

const AddFacilityModal = ({ isOpen, onClose, onSuccess }: AddFacilityModalProps) => {
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
    rooms: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newRoom, setNewRoom] = useState('');

  const handleDepartmentChange = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    setFormData({
      ...formData,
      departmentId,
      department: department?.name || ''
    });
  };

  // Room management functions
  const addRoom = () => {
    if (newRoom.trim() && !formData.rooms.includes(newRoom.trim())) {
      setFormData({
        ...formData,
        rooms: [...formData.rooms, newRoom.trim()]
      });
      setNewRoom('');
    }
  };

  const removeRoom = (roomToRemove: string) => {
    setFormData({
      ...formData,
      rooms: formData.rooms.filter(room => room !== roomToRemove)
    });
  };

  const addPresetRooms = (facilityType: string) => {
    const presetRooms = {
      ministry: ['Office 101', 'Office 102', 'Conference Room A', 'Conference Room B', 'Reception', 'Archive Room'],
      hospital: ['ER', 'ICU', 'Ward A', 'Ward B', 'Surgery 1', 'Surgery 2', 'Lab', 'Pharmacy', 'Reception'],
      school: ['Classroom 1', 'Classroom 2', 'Library', 'Computer Lab', 'Principal Office', 'Teachers Lounge'],
      police_station: ['Front Desk', 'Holding Cell 1', 'Holding Cell 2', 'Interrogation Room', 'Chief Office'],
      military_base: ['Command Center', 'Briefing Room', 'Armory', 'Barracks A', 'Barracks B'],
      warehouse: ['Loading Dock', 'Storage A', 'Storage B', 'Office', 'Security Checkpoint']
    };

    const rooms = presetRooms[facilityType as keyof typeof presetRooms] || [];
    setFormData({
      ...formData,
      rooms: [...new Set([...formData.rooms, ...rooms])] // Avoid duplicates
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
        coordinates: [Number(formData.longitude), Number(formData.latitude)], // [longitude, latitude] format for API
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        department: formData.department,
        departmentId: formData.departmentId,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        status: 'operational',
        securityLevel: 'medium'
      };

      const response = await fetch('http://localhost:5000/api/facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facilityData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Facility created successfully:', result.facility);
        onSuccess(result.facility);
        onClose();
        resetForm();
      } else {
        throw new Error(result.message || 'Failed to create facility');
      }
    } catch (error) {
      console.error('Error creating facility:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create facility. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      departmentId: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Auto-fill coordinates for known Liberia locations
  const handleAddressChange = (address: string) => {
    setFormData({ ...formData, address });
    
    // Auto-suggest coordinates for common Liberia locations
    const lowerAddress = address.toLowerCase();
    if (lowerAddress.includes('monrovia') || lowerAddress.includes('capitol hill')) {
      if (!formData.latitude && !formData.longitude) {
        setFormData(prev => ({
          ...prev,
          address,
          latitude: 6.2907,
          longitude: -10.7969
        }));
      }
    }
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Facility</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Register a new government facility with GPS coordinates for mapping and IoT monitoring.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Form */}
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
                    placeholder="e.g., Ministry of Health Headquarters"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Capitol Hill, Monrovia, Liberia"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacity (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : '' })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 500 (people)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Maximum number of people this facility can accommodate
                  </p>
                </div>
              </div>

              {/* GPS Coordinates & Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                  <MapPinIcon className="h-5 w-5" />
                  <span>GPS Coordinates</span>
                </h3>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    GPS coordinates are required for mapping and IoT device monitoring
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Latitude *
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        min="-90"
                        max="90"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : '' })}
                        className="w-full border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 6.2907"
                      />
                      {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Longitude *
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        min="-180"
                        max="180"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : '' })}
                        className="w-full border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., -10.7969"
                      />
                      {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
                    </div>
                  </div>
                  
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Tip: For Monrovia locations, coordinates are typically around 6.29, -10.80
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Dr. Sarah Johnson"
                    />
                    {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., +231-555-0101"
                    />
                    {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., contact@health.gov.lr"
                    />
                    {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
                  </div>
                </div>

                {/* Room Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Room Management</h3>
                    <button
                      type="button"
                      onClick={() => addPresetRooms(formData.type)}
                      className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition-colors"
                    >
                      Add {formData.type.replace('_', ' ')} presets
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      placeholder="Enter room name/number (e.g., Room 101, Conference Room A)"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRoom())}
                    />
                    <button
                      type="button"
                      onClick={addRoom}
                      disabled={!newRoom.trim() || formData.rooms.includes(newRoom.trim())}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Room
                    </button>
                  </div>

                  {/* Room List */}
                  {formData.rooms.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Facility Rooms ({formData.rooms.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {formData.rooms.map((room, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                          >
                            <span className="text-sm text-gray-900 dark:text-white truncate">{room}</span>
                            <button
                              type="button"
                              onClick={() => removeRoom(room)}
                              className="ml-2 text-red-600 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add rooms to enable precise asset location tracking. Equipment and furniture can be assigned to specific rooms.
                  </p>
                </div>

                {/* Facility Preview */}
                {formData.name && formData.latitude && formData.longitude && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">Facility Summary</h4>
                    <div className="space-y-1 text-xs text-green-700 dark:text-green-400">
                      <p><strong>Facility:</strong> {formData.name}</p>
                      <p><strong>Type:</strong> {formData.type.replace('_', ' ')}</p>
                      <p><strong>Department:</strong> {formData.department}</p>
                      <p><strong>GPS:</strong> {formData.latitude}, {formData.longitude}</p>
                      {formData.capacity && <p><strong>Capacity:</strong> {formData.capacity} people</p>}
                      <p><strong>Contact:</strong> {formData.contactPerson}</p>
                    </div>
                  </div>
                )}
              </div>
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
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Adding Facility...' : 'Add Facility'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddFacilityModal;
