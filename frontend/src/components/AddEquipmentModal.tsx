/**
 * Add Equipment Modal - Same Structure as Add Fleet
 * Professional equipment registration form
 */

import { useState, useEffect } from 'react';
import { XMarkIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { generateAssetGSACode, EQUIPMENT_CLASS_CODES, getMACCode } from '../utils/gsaCodeGenerator';

interface AddEquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (equipmentData?: any) => void;
}

interface EquipmentFormData {
    // MAC Assignment
    department: string;
    departmentId: string;

    // Equipment Identification
    name: string;
    serialNumber: string;
    gsaCode: string;
    model: string;
    brand: string;
    category: string;

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

    // Technical Specifications
    specifications: string;
    powerRating: string;
    connectivity: string;
    operatingSystem: string;

    // Administrative Records
    entryDate: string;
    enteredBy: string;
    warrantyExpiry: string;
    maintenanceInterval: number; // months
    lastMaintenance: string;
    status: 'active' | 'inactive' | 'maintenance' | 'retired';
    condition: 'excellent' | 'good' | 'fair' | 'poor';

    // Additional Information
    notes: string;
}

const AddEquipmentModal = ({ isOpen, onClose, onSuccess }: AddEquipmentModalProps) => {
    const [equipmentClass, setEquipmentClass] = useState<string>('Computer');
    const [generatedGSACode, setGeneratedGSACode] = useState<string>('');
    const [formData, setFormData] = useState<EquipmentFormData>({
        // MAC Assignment
        department: '',
        departmentId: '',

        // Equipment Identification
        name: '',
        serialNumber: '',
        gsaCode: '',
        model: '',
        brand: '',
        category: 'Computer',

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

        // Technical Specifications
        specifications: '',
        powerRating: '',
        connectivity: '',
        operatingSystem: '',

        // Administrative Records
        entryDate: new Date().toISOString().split('T')[0],
        enteredBy: '',
        warrantyExpiry: '',
        maintenanceInterval: 12, // months
        lastMaintenance: '',
        status: 'active',
        condition: 'excellent',

        // Additional Information
        notes: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [availableMACs, setAvailableMACs] = useState<any[]>([]);

    // Get recommended maintenance interval based on equipment class
    const getMaintenanceInterval = (equipmentClass: string): number => {
        const intervals = {
            'Computer': 12,              // Annual maintenance
            'Printer': 6,                // Semi-annual (high usage)
            'Server': 3,                 // Quarterly (critical)
            'Network Equipment': 6,      // Semi-annual
            'Audio Visual': 6,           // Semi-annual calibration
            'Medical Equipment': 3,      // Quarterly (regulatory)
            'Laboratory Equipment': 3,   // Quarterly calibration  
            'Communication Equipment': 6,// Semi-annual
            'Security Equipment': 3,     // Quarterly (critical)
            'Other Equipment': 12        // Annual default
        };
        return intervals[equipmentClass as keyof typeof intervals] || 12;
    };

    // Load real MACs from API
    useEffect(() => {
        const loadMACs = async () => {
            try {
                const response = await fetch('/api/departments');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.departments) {
                        setAvailableMACs(data.departments);
                        console.log('✅ Loaded real MACs for equipment dropdown:', data.departments.length);
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

    // Generate GSA code when MAC or equipment class changes
    useEffect(() => {
        const generateGSACodeForEquipment = async () => {
            if (formData.department && equipmentClass) {
                try {
                    const gsaCode = await generateAssetGSACode(formData.department, 'equipment', equipmentClass);
                    setGeneratedGSACode(gsaCode);
                    setFormData(prev => ({ ...prev, gsaCode }));
                } catch (error) {
                    console.error('Error generating GSA code:', error);
                }
            }
        };

        generateGSACodeForEquipment();
    }, [formData.department, equipmentClass]);

    // Update maintenance interval when equipment class changes
    useEffect(() => {
        const recommendedInterval = getMaintenanceInterval(equipmentClass);
        setFormData(prev => ({ ...prev, maintenanceInterval: recommendedInterval }));
    }, [equipmentClass]);

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
        if (!formData.name.trim()) newErrors.name = 'Equipment name is required';
        if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial number is required';
        if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        if (!formData.departmentId) newErrors.department = 'MAC is required';
        if (!formData.entryDate) newErrors.entryDate = 'Data entry date is required';
        if (!formData.enteredBy.trim()) newErrors.enteredBy = 'Entered by is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🖥️ Equipment form submitted');

        if (!validateForm()) {
            console.log('❌ Equipment form validation failed');
            return;
        }

        setIsLoading(true);
        try {
            const equipmentData = {
                id: `EQ${Date.now()}`,
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('🖥️ Creating equipment:', equipmentData);

            // TODO: Call equipment API
            await new Promise(resolve => setTimeout(resolve, 1000));

            onSuccess(equipmentData);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Error creating equipment:', error);
            setErrors({ general: 'Failed to create equipment. Please try again.' });
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
            category: 'Computer',
            cost: 0,
            donor: '',
            lifeCycle: 'New',
            purchaseDate: '',
            location: '',
            assignment: '',
            currentUser: '',
            officeRoom: '',
            specifications: '',
            powerRating: '',
            connectivity: '',
            operatingSystem: '',
            entryDate: new Date().toISOString().split('T')[0],
            enteredBy: '',
            warrantyExpiry: '',
            maintenanceInterval: 12,
            lastMaintenance: '',
            status: 'active',
            condition: 'excellent',
            notes: ''
        });
        setErrors({});
        setEquipmentClass('Computer');
        setGeneratedGSACode('');
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
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white/20 rounded-lg p-2">
                                    <ComputerDesktopIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Add Office Equipment
                                    </h3>
                                    <p className="text-sm text-purple-100">
                                        Register new equipment with comprehensive details
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
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
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
                                                Equipment Class *
                                            </label>
                                            <select
                                                value={equipmentClass}
                                                onChange={(e) => setEquipmentClass(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                {Object.keys(EQUIPMENT_CLASS_CODES).map(className => (
                                                    <option key={className} value={className}>{className}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Determines GSA code classification
                                            </p>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                GSA Code (Auto-Generated)
                                            </label>
                                            <input
                                                type="text"
                                                value={generatedGSACode}
                                                disabled
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono text-lg"
                                                placeholder="Select MAC and Equipment Class to generate"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Format: GSA-{getMACCode(formData.department) || 'MAC'}-{EQUIPMENT_CLASS_CODES[equipmentClass as keyof typeof EQUIPMENT_CLASS_CODES] || '01'}-Count
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Basic Equipment Details */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Equipment Details</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Equipment identification and basic information</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Equipment Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., Dell Laptop, HP Printer"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., Dell, HP, Canon"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., Latitude 5520, LaserJet Pro"
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
                                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Equipment serial number"
                                            />
                                            {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Category
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="Computer">Computer</option>
                                                <option value="Printer">Printer</option>
                                                <option value="Network Equipment">Network Equipment</option>
                                                <option value="Audio Visual">Audio Visual</option>
                                                <option value="Communication Equipment">Communication Equipment</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentFormData['status'] })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="retired">Retired</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Technical Specifications */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Technical Specifications</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Technical details and specifications</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Specifications
                                            </label>
                                            <textarea
                                                value={formData.specifications}
                                                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., Intel i7, 16GB RAM, 512GB SSD"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Power Rating
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.powerRating}
                                                onChange={(e) => setFormData({ ...formData, powerRating: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., 65W, 120V"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Connectivity
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.connectivity}
                                                onChange={(e) => setFormData({ ...formData, connectivity: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., WiFi, Bluetooth, USB-C"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Operating System
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.operatingSystem}
                                                onChange={(e) => setFormData({ ...formData, operatingSystem: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., Windows 11, macOS, Linux"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Financial & Procurement */}
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial & Procurement</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Cost and procurement information</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Cost (USD)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.cost}
                                                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Donor/Funding Source
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.donor}
                                                onChange={(e) => setFormData({ ...formData, donor: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., World Bank, USAID"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Life Cycle
                                            </label>
                                            <select
                                                value={formData.lifeCycle}
                                                onChange={(e) => setFormData({ ...formData, lifeCycle: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="New">New</option>
                                                <option value="Used">Used</option>
                                                <option value="Refurbished">Refurbished</option>
                                                <option value="End of Life">End of Life</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Purchase Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.purchaseDate}
                                                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Warranty Expiry
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.warrantyExpiry}
                                                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Assignment & Location */}
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assignment & Location</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Current assignment and location details</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Current Location
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Current equipment location"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Office/Room
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.officeRoom}
                                                onChange={(e) => setFormData({ ...formData, officeRoom: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., Room 201, IT Office"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Assigned to person/department"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Current User
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.currentUser}
                                                onChange={(e) => setFormData({ ...formData, currentUser: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Person currently using equipment"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 6: Administrative Records */}
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Administrative Records</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Entry and administrative information</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Data Entry Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.entryDate}
                                                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            />
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Person entering data"
                                            />
                                            {errors.enteredBy && <p className="text-red-500 text-xs mt-1">{errors.enteredBy}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Condition
                                            </label>
                                            <select
                                                value={formData.condition}
                                                onChange={(e) => setFormData({ ...formData, condition: e.target.value as EquipmentFormData['condition'] })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="excellent">Excellent</option>
                                                <option value="good">Good</option>
                                                <option value="fair">Fair</option>
                                                <option value="poor">Poor</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Maintenance Interval (months)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="60"
                                                value={formData.maintenanceInterval}
                                                onChange={(e) => setFormData({ ...formData, maintenanceInterval: parseInt(e.target.value) || 12 })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="12"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Auto-set based on equipment class. Critical: 3mo, Standard: 6-12mo
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Last Maintenance Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.lastMaintenance}
                                                onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Date of last maintenance service
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 7: Additional Information */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Notes and additional remarks</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Notes
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-600 dark:text-white"
                                            placeholder="Additional notes about this equipment..."
                                        />
                                    </div>
                                </div>

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
                                            className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    <span>Adding Equipment...</span>
                                                </>
                                            ) : (
                                                <span>Add Equipment</span>
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

export default AddEquipmentModal;
