import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Equipment, CreateEquipmentRequest, equipmentService } from '../../services/equipmentService';
import { departments, getFacilitiesByDepartment, getEmployeesByDepartment } from '../../data/organizationData';

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: 'equipment' | 'furniture';
}

const AddEquipmentModal = ({ isOpen, onClose, onSuccess, category = 'equipment' }: AddEquipmentModalProps) => {
  const [formData, setFormData] = useState<CreateEquipmentRequest>({
    name: '',
    type: category === 'furniture' ? 'desk' : 'laptop',
    brand: '',
    model: '',
    serialNumber: '',
    department: '',
    status: 'available',
    condition: 'excellent',
    purchaseDate: '',
    purchasePrice: 0,
    usefulLife: category === 'furniture' ? 10 : 4,
    salvageValue: 0,
    location: '',
    category: category
  });
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get facilities for selected department
  const availableFacilities = selectedDepartmentId ? getFacilitiesByDepartment(selectedDepartmentId) : [];
  
  // Get employees for selected department
  const availableEmployees = selectedDepartmentId ? getEmployeesByDepartment(selectedDepartmentId) : [];
  
  // Get rooms for selected facility
  const selectedFacility = availableFacilities.find(f => f.id === selectedFacilityId);
  const availableRooms = selectedFacility?.rooms || [];

  // Handle department selection
  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedFacilityId(''); // Reset facility when department changes
    setSelectedRoom(''); // Reset room when department changes
    setSelectedEmployeeId(''); // Reset employee when department changes
    
    const department = departments.find(d => d.id === departmentId);
    setFormData({ 
      ...formData, 
      department: department?.name || '',
      location: '' // Reset location when department changes
    });
  };

  // Handle facility selection
  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    setSelectedRoom(''); // Reset room when facility changes
    
    const facility = availableFacilities.find(f => f.id === facilityId);
    if (facility) {
      setFormData({ 
        ...formData, 
        location: selectedRoom ? `${facility.name} - ${selectedRoom}` : facility.name
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Equipment name is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial number is required';
    if (!selectedDepartmentId) newErrors.department = 'Department is required';
    if (!selectedFacilityId) newErrors.facility = 'Facility is required';
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Purchase date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('Submitting form data:', formData);
      console.log('Category being submitted:', formData.category);
      
      const newEquipment = await equipmentService.createEquipment(formData);
      console.log('Equipment created successfully:', newEquipment);
      console.log('Returned equipment category:', newEquipment?.category);
      
      onSuccess(newEquipment); // Pass the new equipment data
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating equipment:', error);
      setErrors({ general: 'Failed to create equipment. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: category === 'furniture' ? 'desk' : 'laptop',
      brand: '',
      model: '',
      serialNumber: '',
      department: '',
      status: 'available',
      condition: 'excellent',
      purchaseDate: '',
      purchasePrice: 0,
      usefulLife: category === 'furniture' ? 10 : 4,
      salvageValue: 0,
      location: '',
      category: category
    });
    setSelectedDepartmentId('');
    setSelectedFacilityId('');
    setSelectedRoom('');
    setSelectedEmployeeId('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New {category === 'furniture' ? 'Office Furniture' : 'Office Equipment'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {category === 'furniture' 
                  ? 'Add furniture items like desks, chairs, tables, and storage'
                  : 'Add technology equipment like computers, printers, and devices'
                }
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder={category === 'furniture' ? 'e.g., Executive Office Desk' : 'e.g., Dell Latitude 7420'}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {category === 'furniture' ? 'Furniture Type' : 'Equipment Type'} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Equipment['type'] })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    {category === 'furniture' ? (
                      <>
                        <option value="desk">Desk</option>
                        <option value="chair">Chair</option>
                        <option value="table">Table</option>
                        <option value="storage">Storage/Filing Cabinet</option>
                        <option value="bookshelf">Bookshelf</option>
                        <option value="cabinet">Cabinet</option>
                        <option value="sofa">Sofa/Seating</option>
                        <option value="other">Other Furniture</option>
                      </>
                    ) : (
                      <>
                        <option value="laptop">Laptop</option>
                        <option value="desktop">Desktop Computer</option>
                        <option value="tablet">Tablet</option>
                        <option value="phone">Phone</option>
                        <option value="printer">Printer</option>
                        <option value="projector">Projector</option>
                        <option value="server">Server</option>
                        <option value="radio">Radio</option>
                        <option value="camera">Camera</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Brand *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder={category === 'furniture' ? 'e.g., Steelcase, Herman Miller, Global' : 'e.g., Dell, HP, Apple'}
                  />
                  {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder={category === 'furniture' ? 'e.g., Series 9000, Aeron Size B' : 'e.g., Latitude 7420'}
                  />
                  {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder={category === 'furniture' ? 'e.g., SC9000-001' : 'e.g., DL7420-001'}
                  />
                  {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber}</p>}
                </div>
              </div>

              {/* Assignment & Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assignment & Status</h3>
                
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
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Facility *
                  </label>
                  <select
                    value={selectedFacilityId}
                    onChange={(e) => handleFacilityChange(e.target.value)}
                    disabled={!selectedDepartmentId}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Facility</option>
                    {availableFacilities.map(facility => (
                      <option key={facility.id} value={facility.id}>{facility.name}</option>
                    ))}
                  </select>
                  {errors.facility && <p className="text-red-500 text-xs mt-1">{errors.facility}</p>}
                  {selectedDepartmentId && availableFacilities.length === 0 && (
                    <p className="text-yellow-600 text-xs mt-1">No facilities found for this department</p>
                  )}
                </div>

                {availableRooms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room (Optional)
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
                      Assign to Employee (Optional)
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
                    Status *
                  </label>
                  <select
                    value={formData.status}
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
                    value={formData.condition}
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
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purchase Price (USD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder={category === 'furniture' ? 'e.g., 850.00' : 'e.g., 1200.00'}
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
                    onChange={(e) => setFormData({ ...formData, usefulLife: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder={category === 'furniture' ? '10 (furniture standard)' : '4 (equipment standard)'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {category === 'furniture' ? 'Furniture typically: 10-15 years' : 'Equipment typically: 3-5 years'}
                  </p>
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
                    onChange={(e) => setFormData({ ...formData, salvageValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 120.00 (typically 10-15% of purchase price)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Estimated value at end of useful life</p>
                </div>

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

            {/* Location & Notes */}
            <div className="space-y-4">
              {formData.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Generated Location
                  </label>
                  <div className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {formData.location}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder={category === 'furniture' ? 'Additional notes about this furniture item...' : 'Additional notes about this equipment...'}
                />
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
                {isLoading ? 'Adding...' : `Add ${category === 'furniture' ? 'Furniture' : 'Equipment'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEquipmentModal;
