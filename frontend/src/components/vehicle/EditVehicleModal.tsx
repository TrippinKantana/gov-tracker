import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Vehicle, UpdateVehicleRequest, vehicleService } from '../../services/vehicleService';
import { departments, getFacilitiesByDepartment, getEmployeesByDepartment } from '../../data/organizationData';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string | null;
  onSuccess: () => void;
}

const EditVehicleModal = ({ isOpen, onClose, vehicleId, onSuccess }: EditVehicleModalProps) => {
  const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<UpdateVehicleRequest>({
    id: '',
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'car',
    department: '',
    status: 'available',
    condition: 'excellent',
    fuelLevel: 100,
    mileage: 0,
    gpsTracker: '',
    purchaseDate: ''
  });
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get facilities for selected department
  const availableFacilities = selectedDepartmentId ? getFacilitiesByDepartment(selectedDepartmentId) : [];
  
  // Get employees for selected department
  const availableEmployees = selectedDepartmentId ? getEmployeesByDepartment(selectedDepartmentId) : [];

  useEffect(() => {
    if (isOpen && vehicleId) {
      fetchVehicle();
    }
  }, [isOpen, vehicleId]);

  const fetchVehicle = async () => {
    if (!vehicleId) return;
    
    setIsLoadingVehicle(true);
    setErrors({});
    try {
      const vehicle = await vehicleService.getVehicleById(vehicleId);
      setOriginalVehicle(vehicle);
      
      // Find department ID from department name
      const department = departments.find(d => d.name === vehicle.department);
      const departmentId = department?.id || '';
      
      // Find facility and employee IDs if they exist
      const facilityId = vehicle.homeFacility?.id || '';
      const employeeId = vehicle.assignedEmployee?.id || '';
      
      setSelectedDepartmentId(departmentId);
      setSelectedFacilityId(facilityId);
      setSelectedEmployeeId(employeeId);
      
      setFormData({
        id: vehicle.id,
        licensePlate: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        type: vehicle.type,
        department: vehicle.department,
        status: vehicle.status,
        condition: vehicle.condition,
        fuelLevel: vehicle.fuelLevel,
        mileage: vehicle.mileage,
        gpsTracker: vehicle.gpsTracker,
        purchaseDate: vehicle.purchaseDate,
        purchasePrice: vehicle.purchasePrice,
        warrantyExpiry: vehicle.warrantyExpiry,
        notes: vehicle.notes
      });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      setErrors({ general: 'Failed to load vehicle details' });
    } finally {
      setIsLoadingVehicle(false);
    }
  };

  // Handle department selection
  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedFacilityId(''); // Reset facility when department changes
    setSelectedEmployeeId(''); // Reset employee when department changes
    
    const department = departments.find(d => d.id === departmentId);
    setFormData({ 
      ...formData, 
      department: department?.name || ''
    });
  };

  // Handle facility selection
  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.licensePlate?.trim()) newErrors.licensePlate = 'License plate is required';
    if (!formData.make?.trim()) newErrors.make = 'Make is required';
    if (!formData.model?.trim()) newErrors.model = 'Model is required';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Please enter a valid year';
    }
    if (!selectedDepartmentId) newErrors.department = 'Department is required';
    if (!formData.gpsTracker?.trim()) newErrors.gpsTracker = 'GPS tracker ID is required';
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Purchase date is required';
    if (formData.fuelLevel !== undefined && (formData.fuelLevel < 0 || formData.fuelLevel > 100)) {
      newErrors.fuelLevel = 'Fuel level must be between 0 and 100';
    }
    if (formData.mileage !== undefined && formData.mileage < 0) {
      newErrors.mileage = 'Mileage cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submitData: UpdateVehicleRequest = {
        ...formData,
        assignedEmployeeId: selectedEmployeeId || undefined,
        facilityId: selectedFacilityId || undefined
      };
      
      await vehicleService.updateVehicle(submitData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      setErrors({ general: 'Failed to update vehicle. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOriginalVehicle(null);
    setFormData({
      id: '',
      licensePlate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'car',
      department: '',
      status: 'available',
      condition: 'excellent',
      fuelLevel: 100,
      mileage: 0,
      gpsTracker: '',
      purchaseDate: ''
    });
    setSelectedDepartmentId('');
    setSelectedFacilityId('');
    setSelectedEmployeeId('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Vehicle</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoadingVehicle && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading vehicle details...</span>
              </div>
            )}

            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {!isLoadingVehicle && originalVehicle && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Vehicle Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        License Plate *
                      </label>
                      <input
                        type="text"
                        value={formData.licensePlate || ''}
                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., LBR-001-GOV"
                      />
                      {errors.licensePlate && <p className="text-red-500 text-xs mt-1">{errors.licensePlate}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Make *
                        </label>
                        <input
                          type="text"
                          value={formData.make || ''}
                          onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Toyota"
                        />
                        {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
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
                          placeholder="e.g., Hilux"
                        />
                        {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Year *
                        </label>
                        <input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          value={formData.year || ''}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Vehicle Type *
                        </label>
                        <select
                          value={formData.type || 'car'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as Vehicle['type'] })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="car">Car</option>
                          <option value="truck">Truck</option>
                          <option value="motorcycle">Motorcycle</option>
                          <option value="bus">Bus</option>
                          <option value="van">Van</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GPS Tracker ID *
                      </label>
                      <input
                        type="text"
                        value={formData.gpsTracker || ''}
                        onChange={(e) => setFormData({ ...formData, gpsTracker: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., BW32001"
                      />
                      {errors.gpsTracker && <p className="text-red-500 text-xs mt-1">{errors.gpsTracker}</p>}
                      <p className="text-xs text-gray-500 mt-1">BW32 device ID for GPS tracking</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fuel Level (%) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.fuelLevel || ''}
                          onChange={(e) => setFormData({ ...formData, fuelLevel: parseInt(e.target.value) })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.fuelLevel && <p className="text-red-500 text-xs mt-1">{errors.fuelLevel}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Mileage *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.mileage || ''}
                          onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        {errors.mileage && <p className="text-red-500 text-xs mt-1">{errors.mileage}</p>}
                      </div>
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
                        Home Facility (Optional)
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
                      {selectedDepartmentId && availableFacilities.length === 0 && (
                        <p className="text-yellow-600 text-xs mt-1">No facilities found for this department</p>
                      )}
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status *
                        </label>
                        <select
                          value={formData.status || 'available'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as Vehicle['status'] })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="available">Available</option>
                          <option value="active">Active (Assigned)</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="out_of_service">Out of Service</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Condition *
                        </label>
                        <select
                          value={formData.condition || 'excellent'}
                          onChange={(e) => setFormData({ ...formData, condition: e.target.value as Vehicle['condition'] })}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Purchase Date *
                      </label>
                      <input
                        type="date"
                        value={formData.purchaseDate || ''}
                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Purchase Price (USD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.purchasePrice || ''}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 25000.00"
                      />
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
                    placeholder="Additional notes about this vehicle..."
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
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Updating...' : 'Update Vehicle'}
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

export default EditVehicleModal;
