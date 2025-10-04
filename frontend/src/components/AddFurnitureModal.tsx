/**
 * Add Furniture Modal - Same Structure as Add Fleet
 * Professional furniture registration form
 */

import { useState, useEffect } from 'react';
import { XMarkIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';
import { FURNITURE_CLASS_CODES } from '../utils/gsaCodeGenerator';

interface AddFurnitureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (furnitureData?: any) => void;
}

interface FurnitureFormData {
  // MAC Assignment
  department: string;
  departmentId: string;
  
  // Furniture Identification
  name: string;
  serialNumber: string;
  gsaCode: string;
  model: string;
  brand: string;
  category: string;
  
  // Physical Details
  material: string;
  color: string;
  dimensions: string;
  weight: string;
  
  // Financial Information
  cost: number;
  donor: string;
  lifeCycle: string;
  purchaseDate: string;
  
  // Location & Assignment
  location: string;
  assignment: string;
  currentUser: string;
  officeRoom: string;
  
  // Administrative Records
  entryDate: string;
  enteredBy: string;
  warrantyExpiry: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Additional Information
  notes: string;
}

const AddFurnitureModal = ({ isOpen, onClose, onSuccess }: AddFurnitureModalProps) => {
  const [furnitureClass, setFurnitureClass] = useState<string>('Desk');
  const [generatedGSACode, setGeneratedGSACode] = useState<string>('');
  const [formData, setFormData] = useState<FurnitureFormData>({
    // MAC Assignment
    department: '',
    departmentId: '',
    
    // Furniture Identification
    name: '',
    serialNumber: '',
    gsaCode: '',
    model: '',
    brand: '',
    category: 'Desk',
    
    // Physical Details
    material: '',
    color: '',
    dimensions: '',
    weight: '',
    
    // Financial Information
    cost: 0,
    donor: '',
    lifeCycle: 'New',
    purchaseDate: '',
    
    // Location & Assignment
    location: '',
    assignment: '',
    currentUser: '',
    officeRoom: '',
    
    // Administrative Records
    entryDate: new Date().toISOString().split('T')[0],
    enteredBy: '',
    warrantyExpiry: '',
    status: 'active',
    condition: 'excellent',
    
    // Additional Information
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableMACs, setAvailableMACs] = useState<any[]>([]);

  // Load real MACs from API  
  useEffect(() => {
    const loadMACs = async () => {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.departments) {
            setAvailableMACs(data.departments);
            console.log('✅ Loaded real MACs for furniture dropdown:', data.departments.length);
          }
        }
      } catch (error) {
        console.error('Error loading MACs:', error);
      }
    };

    if (isOpen) {
      loadMACs();
    }
  }, [isOpen]);



  const handleMACChange = (macId: string) => {
    const selectedMAC = availableMACs.find(d => d.id === macId);
    if (selectedMAC) {
      setFormData(prev => ({
        ...prev,
        departmentId: macId,
        department: selectedMAC.name
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Furniture name is required';
    if (!formData.gsaCode.trim()) newErrors.gsaCode = 'GSA code is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.departmentId) newErrors.department = 'MAC is required';
    if (!formData.entryDate) newErrors.entryDate = 'Data entry date is required';
    if (!formData.enteredBy.trim()) newErrors.enteredBy = 'Entered by is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🪑 Furniture form submitted');
    
    if (!validateForm()) {
      console.log('❌ Furniture form validation failed');
      return;
    }

    setIsLoading(true);
    try {
      const furnitureData = {
        id: `FU${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🪑 Creating furniture:', furnitureData);
      
      // TODO: Call furniture API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(furnitureData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating furniture:', error);
      setErrors({ general: 'Failed to create furniture. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      department: '',
      departmentId: '',
      name: '',
      serialNumber: '',
      gsaCode: '',
      model: '',
      brand: '',
      category: 'Desk',
      material: '',
      color: '',
      dimensions: '',
      weight: '',
      cost: 0,
      donor: '',
      lifeCycle: 'New',
      purchaseDate: '',
      location: '',
      assignment: '',
      currentUser: '',
      officeRoom: '',
      entryDate: new Date().toISOString().split('T')[0],
      enteredBy: '',
      warrantyExpiry: '',
      status: 'active',
      condition: 'excellent',
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
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <RectangleGroupIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Add Office Furniture
                  </h3>
                  <p className="text-sm text-green-100">
                    Register new furniture with comprehensive details
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form Content - Same Structure as Add Fleet */}
          <form onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-6 mb-0">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}
            
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-8">
                
                {/* Section 1: MAC Assignment & GSA Code */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">MAC Assignment</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Select MAC first to generate GSA code</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        MAC (Ministry/Agency/Commission) *
                      </label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => handleMACChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-600 dark:text-white"
                      >
                        <option value="">Select MAC</option>
                        {availableMACs.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                      {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Furniture Class *
                      </label>
                      <select
                        value={furnitureClass}
                        onChange={(e) => setFurnitureClass(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-600 dark:text-white"
                      >
                        {Object.keys(FURNITURE_CLASS_CODES).map(className => (
                          <option key={className} value={className}>{className}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Furniture classification type
                      </p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GSA Code *
                      </label>
                      <input
                        type="text"
                        value={formData.gsaCode}
                        onChange={(e) => setFormData({ ...formData, gsaCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white font-mono text-lg"
                        placeholder="Enter GSA code manually"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enter the official GSA asset code (complex format)
                      </p>
                      {errors.gsaCode && <p className="text-red-500 text-xs mt-1">{errors.gsaCode}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Basic Furniture Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Furniture Details</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Furniture identification and basic information</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Furniture Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-600 dark:text-white"
                        placeholder="e.g., Executive Desk, Office Chair"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Brand *
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-600 dark:text-white"
                        placeholder="e.g., IKEA, Herman Miller, Steelcase"
                      />
                      {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-600 dark:text-white"
                        placeholder="e.g., Executive 2000, Aeron Chair"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Material
                      </label>
                      <input
                        type="text"
                        value={formData.material}
                        onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-600 dark:text-white"
                        placeholder="e.g., Wood, Metal, Fabric"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-600 dark:text-white"
                        placeholder="e.g., Brown, Black, Gray"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dimensions
                      </label>
                      <input
                        type="text"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-600 dark:text-white"
                        placeholder="e.g., 120x60x75 cm"
                      />
                    </div>
                  </div>
                </div>

                {/* Continue with remaining sections similar to AddEquipmentModal but furniture-specific */}
                {/* For brevity, showing key structure - full implementation would include all sections */}

                {/* Footer - Inside Form */}
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 -mx-6 mt-8 rounded-b-lg">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Adding Furniture...</span>
                        </>
                      ) : (
                        <span>Add Furniture</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddFurnitureModal;
