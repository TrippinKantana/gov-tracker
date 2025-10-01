import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Equipment, UpdateEquipmentRequest, equipmentService } from '../../services/equipmentService';

interface EditEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipmentId: string | null;
}

const EditEquipmentModal = ({ isOpen, onClose, onSuccess, equipmentId }: EditEquipmentModalProps) => {
  const [formData, setFormData] = useState<UpdateEquipmentRequest>({
    id: '',
    name: '',
    type: 'laptop',
    brand: '',
    model: '',
    serialNumber: '',
    department: '',
    status: 'available',
    condition: 'excellent',
    purchaseDate: '',
    purchasePrice: 0,
    usefulLife: 4,
    salvageValue: 0,
    warrantyExpiry: '',
    location: '',
    notes: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Assignment states
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const departments = [
    'Ministry of Health',
    'Ministry of Agriculture', 
    'Ministry of Defense',
    'Ministry of Education',
    'General Services Agency',
    'Ministry of Information'
  ];

  // Mock facilities and employees data (would come from API in production)
  const mockFacilities = [
    { id: 'FAC001', name: 'Ministry of Health HQ', departmentId: 'DEPT001', rooms: ['Room 101', 'Room 102', 'Room 201', 'Room 202', 'Conference Room A'] },
    { id: 'FAC002', name: 'Government Technology Center', departmentId: 'DEPT003', rooms: ['IT Lab 1', 'IT Lab 2', 'Server Room', 'Office 301'] },
    { id: 'FAC003', name: 'Defense Ministry Building', departmentId: 'DEPT004', rooms: ['Command Center', 'Office 401', 'Office 402', 'Meeting Room B'] }
  ];

  const mockEmployees = [
    { id: 'EMP001', name: 'Dr. Sarah Johnson', badgeNumber: 'GSA-001', departmentId: 'DEPT001' },
    { id: 'EMP002', name: 'General Robert Smith', badgeNumber: 'GSA-008', departmentId: 'DEPT004' },
    { id: 'EMP003', name: 'John Tech', badgeNumber: 'GSA-003', departmentId: 'DEPT003' }
  ];

  // Get facilities for selected department
  const availableFacilities = selectedDepartmentId ? mockFacilities.filter(f => f.departmentId === selectedDepartmentId) : [];
  
  // Get employees for selected department
  const availableEmployees = selectedDepartmentId ? mockEmployees.filter(e => e.departmentId === selectedDepartmentId) : [];
  
  // Get rooms for selected facility
  const selectedFacility = availableFacilities.find(f => f.id === selectedFacilityId);
  const availableRooms = selectedFacility?.rooms || [];

  useEffect(() => {
    if (isOpen && equipmentId) {
      fetchEquipment();
    }
  }, [isOpen, equipmentId]);

  // Handle department selection
  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedFacilityId(''); // Reset facility when department changes
    setSelectedRoom(''); // Reset room when department changes
    setSelectedEmployeeId(''); // Reset employee when department changes
    
    const departmentNames = {
      'DEPT001': 'Ministry of Health',
      'DEPT002': 'Ministry of Agriculture', 
      'DEPT003': 'General Services Agency',
      'DEPT004': 'Ministry of Defense'
    };
    
    const departmentName = departmentNames[departmentId as keyof typeof departmentNames];
    if (departmentName) {
      setFormData({ ...formData, department: departmentName });
    }
  };

  // Handle facility selection
  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setSelectedRoom(''); // Reset room when facility changes
    
    const facility = availableFacilities.find(f => f.id === facilityId);
    if (facility) {
      setFormData({ 
        ...formData, 
        location: facility.name
      });
    }
  };

  // Handle room selection
  const handleRoomChange = (room: string) => {
    setSelectedRoom(room);
    const facility = availableFacilities.find(f => f.id === selectedFacilityId);
    if (facility) {
      setFormData({ 
        ...formData, 
        location: room ? `${facility.name} - ${room}` : facility.name
      });
    }
  };

  const fetchEquipment = async () => {
    if (!equipmentId) return;
    
    setIsFetching(true);
    try {
      const equipment = await equipmentService.getEquipmentById(equipmentId);
      setFormData({
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        brand: equipment.brand,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        department: equipment.department,
        status: equipment.status,
        condition: equipment.condition,
        purchaseDate: equipment.purchaseDate,
        purchasePrice: equipment.purchasePrice,
        warrantyExpiry: equipment.warrantyExpiry,
        location: equipment.location,
        notes: equipment.notes
      });
    } catch (error) {
      console.error('Error fetching equipment:', error);
      setErrors({ general: 'Failed to load equipment data' });
    } finally {
      setIsFetching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Equipment name is required';
    if (!formData.brand?.trim()) newErrors.brand = 'Brand is required';
    if (!formData.model?.trim()) newErrors.model = 'Model is required';
    if (!formData.serialNumber?.trim()) newErrors.serialNumber = 'Serial number is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Purchase date is required';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await equipmentService.updateEquipment(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating equipment:', error);
      setErrors({ general: 'Failed to update equipment. Please try again.' });
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
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Equipment</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isFetching && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading equipment data...</span>
              </div>
            )}

            {!isFetching && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Equipment Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type *
                      </label>
                      <select
                        value={formData.type || 'laptop'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Equipment['type'] })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="laptop">Laptop</option>
                        <option value="desktop">Desktop Computer</option>
                        <option value="tablet">Tablet</option>
                        <option value="phone">Phone</option>
                        <option value="printer">Printer</option>
                        <option value="projector">Projector</option>
                        <option value="server">Server</option>
                        <option value="radio">Radio</option>
                        <option value="camera">Camera</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Brand *
                      </label>
                      <input
                        type="text"
                        value={formData.brand || ''}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Model *
                      </label>
                      <input
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Serial Number *
                      </label>
                      <input
                        type="text"
                        value={formData.serialNumber || ''}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber}</p>}
                    </div>
                  </div>

                  {/* Status & Assignment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status & Assignment</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Department *
                      </label>
                      <select
                        value={selectedDepartmentId}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        <option value="DEPT001">Ministry of Health</option>
                        <option value="DEPT002">Ministry of Agriculture</option>
                        <option value="DEPT003">General Services Agency</option>
                        <option value="DEPT004">Ministry of Defense</option>
                      </select>
                      {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status *
                      </label>
                      <select
                        value={formData.status || 'available'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Equipment['status'] })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="available">Available</option>
                        <option value="active">Active (Assigned)</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Condition *
                      </label>
                      <select
                        value={formData.condition || 'excellent'}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value as Equipment['condition'] })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Facility Assignment *
                      </label>
                      <select
                        value={selectedFacilityId}
                        onChange={(e) => handleFacilityChange(e.target.value)}
                        disabled={!selectedDepartmentId}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="">Select Facility</option>
                        {availableFacilities.map(facility => (
                          <option key={facility.id} value={facility.id}>{facility.name}</option>
                        ))}
                      </select>
                      {errors.facility && <p className="text-red-500 text-xs mt-1">{errors.facility}</p>}
                    </div>

                    {availableRooms.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Room Assignment
                        </label>
                        <select
                          value={selectedRoom}
                          onChange={(e) => handleRoomChange(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Room</option>
                          {availableRooms.map(room => (
                            <option key={room} value={room}>{room}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {availableEmployees.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Assign to Employee
                        </label>
                        <select
                          value={selectedEmployeeId}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {availableEmployees.map(employee => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} ({employee.badgeNumber})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Warranty Expiry
                      </label>
                      <input
                        type="date"
                        value={formData.warrantyExpiry || ''}
                        onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Purchase Price (USD) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.purchasePrice || ''}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 1200.00"
                      />
                      {errors.purchasePrice && <p className="text-red-500 text-xs mt-1">{errors.purchasePrice}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Useful Life (Years)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.usefulLife || ''}
                        onChange={(e) => setFormData({ ...formData, usefulLife: parseInt(e.target.value) || 4 })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="4 (equipment) or 10 (furniture)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Equipment: 4 years, Furniture: 10 years</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Salvage Value (USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.salvageValue || ''}
                        onChange={(e) => setFormData({ ...formData, salvageValue: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 120.00 (typically 10% of purchase price)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Estimated end-of-life value</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about this equipment..."
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
                    {isLoading ? 'Updating...' : 'Update Equipment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEquipmentModal;
