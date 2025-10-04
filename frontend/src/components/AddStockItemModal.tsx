/**
 * Add Stock Item Modal
 * Add new items to warehouse stock inventory
 */

import { useState } from 'react';
import { XMarkIcon, CubeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface AddStockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (stockItem: any) => void;
}

interface StockItemFormData {
  name: string;
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  receivedDate: string;
  expiryDate: string;
  minimumLevel: number;
  warehouseLocation: string;
  batchNumber: string;
  deliveryNote: string;
  purchaseOrder: string;
  receivedBy: string;
  qualityChecked: boolean;
  conditionNotes: string;
}

const AddStockItemModal = ({ isOpen, onClose, onSuccess, warehouseSections = [] }: AddStockItemModalProps) => {
  const [formData, setFormData] = useState<StockItemFormData>({
    name: '',
    category: 'Furniture',
    description: '',
    quantity: 1,
    unitCost: 0,
    supplier: '',
    receivedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    minimumLevel: 10,
    warehouseLocation: warehouseSections.length > 0 ? warehouseSections[0].name : 'Warehouse A - Section 1',
    batchNumber: '',
    deliveryNote: '',
    purchaseOrder: '',
    receivedBy: '',
    qualityChecked: true,
    conditionNotes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'Furniture',
    'Electronics', 
    'Equipment',
    'Office Supplies',
    'Medical Equipment',
    'Security Equipment',
    'Vehicles',
    'Tools',
    'Materials',
    'Other'
  ];

  // Use warehouse sections from props or fallback to defaults
  const warehouseLocations = warehouseSections.length > 0 
    ? warehouseSections.map(section => section.name)
    : [
        'Warehouse A - Section 1',
        'Warehouse A - Section 2', 
        'Warehouse A - Section 3',
        'Warehouse B - Electronics Section',
        'Warehouse B - Furniture Section',
        'Warehouse C - Heavy Equipment',
        'Warehouse C - Vehicles Bay',
        'Cold Storage - Section 1',
        'Secure Storage - High Value',
        'Outdoor Storage - Materials'
      ];

  const generateBatchNumber = () => {
    const today = new Date();
    const batchNumber = `BATCH-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    setFormData(prev => ({ ...prev, batchNumber }));
  };

  const generateDeliveryNote = () => {
    const today = new Date();
    const noteNumber = `DN-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    setFormData(prev => ({ ...prev, deliveryNote: noteNumber }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (formData.unitCost <= 0) newErrors.unitCost = 'Unit cost must be greater than 0';
    if (!formData.supplier.trim()) newErrors.supplier = 'Supplier is required';
    if (!formData.receivedBy.trim()) newErrors.receivedBy = 'Received by is required';
    if (!formData.deliveryNote.trim()) newErrors.deliveryNote = 'Delivery note is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const stockItem = {
        id: `STK_${Date.now()}`,
        ...formData,
        totalValue: formData.quantity * formData.unitCost,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('📦 Adding stock item:', stockItem);

      // API call to add stock item
      const response = await fetch('/api/stock/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stockItem)
      });

      if (!response.ok) {
        throw new Error('Failed to add stock item');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to add stock item');
      }

      onSuccess(stockItem);
      onClose();
      console.log('✅ Stock item added successfully');
    } catch (error) {
      console.error('Error adding stock item:', error);
      alert('Failed to add stock item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <CubeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add Stock Item</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Register new goods in warehouse inventory</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="e.g., Office Chairs, Desktop Computers"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                placeholder="Detailed description of the item..."
                required
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Quantity & Cost */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit Cost ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
                {errors.unitCost && <p className="text-red-500 text-xs mt-1">{errors.unitCost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Value
                </label>
                <input
                  type="text"
                  value={`$${(formData.quantity * formData.unitCost).toFixed(2)}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Supplier & Receipt Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier *
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Supplier company name"
                  required
                />
                {errors.supplier && <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Received Date *
                </label>
                <input
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Delivery Documentation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Note Number *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.deliveryNote}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryNote: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Delivery note reference"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateDeliveryNote}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Auto
                  </button>
                </div>
                {errors.deliveryNote && <p className="text-red-500 text-xs mt-1">{errors.deliveryNote}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Order Number
                </label>
                <input
                  type="text"
                  value={formData.purchaseOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseOrder: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="PO reference number"
                />
              </div>
            </div>

            {/* Storage & Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Warehouse Location *
                </label>
                <select
                  value={formData.warehouseLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, warehouseLocation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  required
                >
                  {warehouseLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Batch Number
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Batch tracking number"
                  />
                  <button
                    type="button"
                    onClick={generateBatchNumber}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimumLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumLevel: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Quality & Receipt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Received By *
                </label>
                <input
                  type="text"
                  value={formData.receivedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Name of person receiving goods"
                  required
                />
                {errors.receivedBy && <p className="text-red-500 text-xs mt-1">{errors.receivedBy}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiry Date (if applicable)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.qualityChecked}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualityChecked: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Quality inspection completed</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition Notes
                </label>
                <textarea
                  value={formData.conditionNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, conditionNotes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Notes about item condition, quality, or special handling requirements..."
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Stock Item Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    ${(formData.quantity * formData.unitCost).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Storage Location:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{formData.warehouseLocation}</span>
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
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <CubeIcon className="h-4 w-4" />
                    <span>Add to Stock</span>
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

export default AddStockItemModal;
