import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { departments, getEmployeesByDepartment } from '../data/organizationData';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehicleData?: any) => void;
  vehicleId: string | null;
}

interface VehicleFormData {
  // Original Essential Fields
  plateNumber: string;
  vehicleType: 'car' | 'truck' | 'motorcycle' | 'bus' | 'van' | 'suv';
  make: string;
  model: string;
  year: number;
  color: string;
  vinNumber: string;
  status: 'active' | 'parked' | 'maintenance' | 'alert';
  department: string;
  departmentId: string;
  currentOperator: string;
  // Administrative fields
  entryDate: string;
  enteredBy: string;
  registrationDate: string;
  // Maintenance tracking
  lastMaintenance: string;
  maintenanceInterval: number;
  notes: string;
  
  // Additional Client Required Fields
  serialNumber: string; // Serial # (additional to VIN)
  gsaCode: string; // GSA Code
  engineNumber: string; // Engine #
  powerRating: string; // Power rating
  fuelType: string; // Fuel Type
  donor: string; // Donor
  location: string; // Location
  assignment: string; // Assignment
  cost: number; // Cost
  lifeCycle: string; // Life Cycle
  runningHours: string; // Running HR
}

const EditVehicleModal = ({ isOpen, onClose, onSuccess, vehicleId }: EditVehicleModalProps) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    plateNumber: '',
    vehicleType: 'car',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vinNumber: '',
    status: 'parked',
    department: '',
    departmentId: '',
    assignedEmployeeId: '',
    fuelCapacity: 50,
    // Administrative fields
    entryDate: '',
    enteredBy: '',
    registrationDate: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get employees for selected department
  const availableEmployees = formData.departmentId ? getEmployeesByDepartment(formData.departmentId) : [];

  useEffect(() => {
    if (isOpen && vehicleId) {
      fetchVehicleData();
    }
  }, [isOpen, vehicleId]);

  const fetchVehicleData = async () => {
    if (!vehicleId) return;
    
    setIsFetching(true);
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}`);
      
      // Mock data for now - in production this would come from API
      const mockVehicleData = {
        plateNumber: vehicleId === 'VH001' ? 'LBR-001-GOV' : `LBR-${vehicleId.slice(-3)}-GOV`,
        vehicleType: 'truck' as const,
        make: 'Toyota',
        model: 'Hilux',
        year: 2023,
        color: 'White',
        vinNumber: '1HGBH41JXMN109186',
        status: 'active' as const,
        department: 'Ministry of Health',
        departmentId: 'DEPT001',
        assignedEmployeeId: 'EMP001',
        fuelCapacity: 70,
        notes: 'Primary vehicle for health department field operations'
      };
      
      setFormData(mockVehicleData);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      setErrors({ general: 'Failed to load vehicle data' });
    } finally {
      setIsFetching(false);
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    setFormData({
      ...formData,
      departmentId,
      department: department?.name || '',
      assignedEmployeeId: '' // Reset employee when department changes
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.vinNumber.trim()) newErrors.vinNumber = 'VIN number is required';
    if (!formData.departmentId) newErrors.department = 'Department is required';

    // Year validation
    if (formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = `Year must be between 1990 and ${new Date().getFullYear() + 1}`;
    }

    // VIN validation
    if (formData.vinNumber && formData.vinNumber.length !== 17) {
      newErrors.vinNumber = 'VIN number must be exactly 17 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const vehicleData = {
        id: vehicleId,
        ...formData
      };

      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Vehicle updated successfully:', result.vehicle);
        onSuccess(result.vehicle);
        onClose();
      } else {
        throw new Error(result.message || 'Failed to update vehicle');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to update vehicle. Please try again.' });
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Vehicle</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update vehicle information and assignment details
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
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading vehicle data...</span>
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
                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vehicle Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vehicle ID / Plate Number *
                    </label>
                    <input
                      type="text"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., LBR-001-GOV"
                    />
                    {errors.plateNumber && <p className="text-red-500 text-xs mt-1">{errors.plateNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vehicle Type *
                    </label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleFormData['vehicleType'] })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="car">Car</option>
                      <option value="suv">SUV</option>
                      <option value="truck">Truck</option>
                      <option value="van">Van</option>
                      <option value="bus">Bus</option>
                      <option value="motorcycle">Motorcycle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Make *</label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Toyota, Nissan"
                    />
                    {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Hilux, Patrol"
                    />
                    {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year *</label>
                    <input
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., White, Black, Silver"
                    />
                  </div>
                </div>

                {/* Assignment & Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assignment & Status</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      VIN Number *
                    </label>
                    <input
                      type="text"
                      value={formData.vinNumber}
                      onChange={(e) => setFormData({ ...formData, vinNumber: e.target.value.toUpperCase() })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="17-character VIN"
                      maxLength={17}
                    />
                    {errors.vinNumber && <p className="text-red-500 text-xs mt-1">{errors.vinNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleFormData['status'] })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active - In use</option>
                      <option value="parked">Parked - Available</option>
                      <option value="maintenance">Maintenance - Being serviced</option>
                      <option value="alert">Alert - Requires attention</option>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign to Employee</label>
                    <select
                      value={formData.assignedEmployeeId}
                      onChange={(e) => setFormData({ ...formData, assignedEmployeeId: e.target.value })}
                      disabled={!formData.departmentId}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {availableEmployees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.badgeNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fuel Capacity (Liters)</label>
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={formData.fuelCapacity}
                      onChange={(e) => setFormData({ ...formData, fuelCapacity: parseInt(e.target.value) || 50 })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes about this vehicle..."
                    />
                  </div>
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
                  disabled={isLoading || isFetching}
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
  );
};

export default EditVehicleModal;
