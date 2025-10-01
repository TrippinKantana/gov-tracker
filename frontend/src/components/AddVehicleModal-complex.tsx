import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { departments } from '../data/organizationData';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehicleData?: any) => void;
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

const AddVehicleModal = ({ isOpen, onClose, onSuccess }: AddVehicleModalProps) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'technical' | 'financial' | 'admin'>('basic');
  const [formData, setFormData] = useState<VehicleFormData>({
    // Original Essential Fields
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
    currentOperator: '',
    entryDate: new Date().toISOString().split('T')[0],
    enteredBy: '',
    registrationDate: '',
    lastMaintenance: '',
    maintenanceInterval: 90,
    notes: '',
    
    // Additional Client Required Fields
    serialNumber: '', // Different from VIN
    gsaCode: '',
    engineNumber: '',
    powerRating: '',
    fuelType: 'Petrol',
    donor: '',
    location: '',
    assignment: '',
    cost: 0,
    lifeCycle: 'New',
    runningHours: '0'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Employees no longer needed for vehicle assignment (department-based model)

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

    if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Vehicle ID / Plate Number is required';
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.vinNumber.trim()) newErrors.vinNumber = 'VIN Number is required';
    if (!formData.departmentId) newErrors.department = 'MAC is required';
    if (!formData.entryDate) newErrors.entryDate = 'Entry date is required';
    if (!formData.enteredBy.trim()) newErrors.enteredBy = 'Entered by is required';
    if (!formData.registrationDate) newErrors.registrationDate = 'Registration date is required';

    // Year validation
    if (formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = `Year must be between 1990 and ${new Date().getFullYear() + 1}`;
    }

    // VIN validation (basic format check)
    if (formData.vinNumber && formData.vinNumber.length !== 17) {
      newErrors.vinNumber = 'VIN Number must be exactly 17 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Auto-generate vehicle ID if not provided
      const vehicleId = `VH${String(Math.floor(Math.random() * 900) + 100)}`;
      
      const vehicleData = {
        ...formData,
        id: vehicleId,
        gpsTrackerEnabled: true,
        fuelLevel: 100, // Start with full tank
        mileage: 0 // New vehicle starts at 0
      };

      const response = await fetch('http://localhost:5000/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Vehicle created successfully:', result.vehicle);
        onSuccess(result.vehicle);
        onClose();
        resetForm();
      } else {
        throw new Error(result.message || 'Failed to create vehicle');
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create vehicle. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      currentOperator: '',
      lastMaintenance: '',
      maintenanceInterval: 90,
      notes: ''
    });
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
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Vehicle</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new vehicle to the government fleet with tracking capabilities
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <nav className="flex space-x-6">
              {[
                { id: 'basic', name: 'Basic Info', icon: '🚗', desc: 'Vehicle details' },
                { id: 'technical', name: 'Technical', icon: '⚙️', desc: 'Engine & specs' },
                { id: 'financial', name: 'Financial', icon: '💰', desc: 'Cost & procurement' },
                { id: 'admin', name: 'Administrative', icon: '📋', desc: 'Assignment & records' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center py-2 px-3 border-b-2 font-medium text-xs transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="text-lg mb-1">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                  <span className="text-xs opacity-75">{tab.desc}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vehicle Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Make *
                  </label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Toyota, Nissan, Ford"
                  />
                  {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
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
                    placeholder="e.g., Hilux, Patrol, F-150"
                  />
                  {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., White, Black, Silver"
                  />
                </div>
              </div>

              {/* MAC & Maintenance */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">MAC & Maintenance</h3>
                
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Vehicle Identification Number (17 characters)
                  </p>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    MAC (Ministry/Agency/Commission) *
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select MAC</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Operator (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.currentOperator}
                    onChange={(e) => setFormData({ ...formData, currentOperator: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Dr. Sarah Johnson (current driver)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Person currently using this MAC vehicle (optional)
                  </p>
                </div>

                {/* Administrative Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Entry Date *
                    </label>
                    <input
                      type="date"
                      value={formData.entryDate}
                      onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Date vehicle was entered into the system
                    </p>
                    {errors.entryDate && <p className="text-red-500 text-xs mt-1">{errors.entryDate}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Entered By *
                    </label>
                    <input
                      type="text"
                      value={formData.enteredBy}
                      onChange={(e) => setFormData({ ...formData, enteredBy: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., John Smith"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Person who entered this vehicle into the system
                    </p>
                    {errors.enteredBy && <p className="text-red-500 text-xs mt-1">{errors.enteredBy}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Registration Date *
                  </label>
                  <input
                    type="date"
                    value={formData.registrationDate}
                    onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Official government registration date for this vehicle
                  </p>
                  {errors.registrationDate && <p className="text-red-500 text-xs mt-1">{errors.registrationDate}</p>}
                </div>

                {/* Client Required Fields Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Serial # *
                    </label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.serialNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Vehicle serial number"
                    />
                    {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GSA Code *
                    </label>
                    <input
                      type="text"
                      value={formData.gsaCode}
                      onChange={(e) => setFormData({ ...formData, gsaCode: e.target.value.toUpperCase() })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.gsaCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="GSA asset code"
                    />
                    {errors.gsaCode && <p className="text-red-500 text-xs mt-1">{errors.gsaCode}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Engine # *
                    </label>
                    <input
                      type="text"
                      value={formData.engineNumber}
                      onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value.toUpperCase() })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.engineNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Engine number"
                    />
                    {errors.engineNumber && <p className="text-red-500 text-xs mt-1">{errors.engineNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Power Rating
                    </label>
                    <input
                      type="text"
                      value={formData.powerRating}
                      onChange={(e) => setFormData({ ...formData, powerRating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 150HP, 2.5L"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fuel Type
                    </label>
                    <select
                      value={formData.fuelType}
                      onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Donor
                    </label>
                    <input
                      type="text"
                      value={formData.donor}
                      onChange={(e) => setFormData({ ...formData, donor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., World Bank, USAID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Current location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assignment
                    </label>
                    <input
                      type="text"
                      value={formData.assignment}
                      onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Assigned to person/unit"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cost
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Life Cycle
                    </label>
                    <select
                      value={formData.lifeCycle}
                      onChange={(e) => setFormData({ ...formData, lifeCycle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Refurbished">Refurbished</option>
                      <option value="End of Life">End of Life</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Running Hours
                    </label>
                    <input
                      type="text"
                      value={formData.runningHours}
                      onChange={(e) => setFormData({ ...formData, runningHours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 1500 hrs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Maintenance Date
                  </label>
                  <input
                    type="date"
                    value={formData.lastMaintenance}
                    onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When was this vehicle last serviced?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maintenance Interval (Days)
                  </label>
                  <select
                    value={formData.maintenanceInterval}
                    onChange={(e) => setFormData({ ...formData, maintenanceInterval: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={30}>30 days - Heavy duty vehicles</option>
                    <option value={60}>60 days - Regular use vehicles</option>
                    <option value={90}>90 days - Standard government fleet</option>
                    <option value={120}>120 days - Light use vehicles</option>
                    <option value={180}>180 days - Occasional use vehicles</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    How often should this vehicle be maintained?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about this vehicle..."
                  />
                </div>

                {/* Vehicle Details Preview */}
                {formData.make && formData.model && formData.year && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Vehicle Summary</h4>
                    <div className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                      <p><strong>Vehicle:</strong> {formData.year} {formData.make} {formData.model}</p>
                      <p><strong>Type:</strong> {formData.vehicleType.toUpperCase()}</p>
                      <p><strong>Department:</strong> {formData.department || 'Not selected'}</p>
                      {formData.color && <p><strong>Color:</strong> {formData.color}</p>}
                      <p><strong>Plate:</strong> {formData.plateNumber || 'To be assigned'}</p>
                      <p><strong>Status:</strong> {formData.status.toUpperCase()}</p>
                      {formData.currentOperator && <p><strong>Current Operator:</strong> {formData.currentOperator}</p>}
                      {formData.lastMaintenance && (
                        <p><strong>Maintenance:</strong> Every {formData.maintenanceInterval} days</p>
                      )}
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
                {isLoading ? 'Adding Vehicle...' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
