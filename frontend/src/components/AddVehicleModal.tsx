/**
 * User-Friendly Add Vehicle Modal
 * Organized sections for better UX
 */

import { useState, useEffect } from 'react';
import { XMarkIcon, TruckIcon, PencilIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { generateAssetGSACode, VEHICLE_CLASS_CODES, getMACCode, generateGSACode, getVehicleClassCode, checkGSACodeExists, validateGSACode } from '../utils/gsaCodeGenerator';

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
    entryDate: string;
    enteredBy: string;
    registrationDate: string;
    lastMaintenance: string;
    maintenanceInterval: number;
    notes: string;

    // Additional Client Required Fields
    serialNumber: string;
    gsaCode: string;
    engineNumber: string;
    powerRating: string;
    fuelType: string;
    donor: string;
    location: string;
    assignment: string;
    facilityId: string;
    facilityName: string;
    cost: number;
    lifeCycle: string;
    runningHours: string;
}

const AddVehicleModal = ({ isOpen, onClose, onSuccess }: AddVehicleModalProps) => {
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
        maintenanceInterval: 5000,
        notes: '',

        // Additional Client Required Fields
        serialNumber: '',
        gsaCode: '',
        engineNumber: '',
        powerRating: '',
        fuelType: 'Petrol',
        donor: '',
        location: '',
        assignment: '',
        facilityId: '',
        facilityName: '',
        cost: 0,
        lifeCycle: 'New',
        runningHours: '0'
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [vehicleClass, setVehicleClass] = useState<string>('Sedan');
    const [generatedGSACode, setGeneratedGSACode] = useState<string>('');
    const [availableMACs, setAvailableMACs] = useState<any[]>([]);
    const [manualOverride, setManualOverride] = useState(false);
    const [manualCount, setManualCount] = useState('');
    const [hasManualGSACode, setHasManualGSACode] = useState(false);
    const [availablePersonnel, setAvailablePersonnel] = useState<any[]>([]);
    const [availableFacilities, setAvailableFacilities] = useState<any[]>([]);
    const [assignmentSearch, setAssignmentSearch] = useState('');
    const [operatorSearch, setOperatorSearch] = useState('');
    const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false);
  const [showOperatorDropdown, setShowOperatorDropdown] = useState(false);

    // Load real MACs and Personnel from API
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load MACs
                const macsResponse = await fetch('/api/departments');
                if (macsResponse.ok) {
                    const macsData = await macsResponse.json();
                    if (macsData.success && macsData.departments) {
                        setAvailableMACs(macsData.departments);
                        console.log('✅ Loaded real MACs for dropdown:', macsData.departments.length);
                    }
                }

                // Load Personnel
                const personnelResponse = await fetch('/api/personnel');
                if (personnelResponse.ok) {
                    const personnelData = await personnelResponse.json();
                    if (personnelData.success && personnelData.personnel) {
                        setAvailablePersonnel(personnelData.personnel);
                        console.log('✅ Loaded personnel for assignment dropdown:', personnelData.personnel.length);
                    }
                }

                // Load Facilities
                const facilitiesResponse = await fetch('/api/facilities');
                if (facilitiesResponse.ok) {
                    const facilitiesData = await facilitiesResponse.json();
                    if (facilitiesData.success && facilitiesData.facilities) {
                        setAvailableFacilities(facilitiesData.facilities);
                        console.log('✅ Loaded facilities for assignment dropdown:', facilitiesData.facilities.length);
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    // Generate GSA code when MAC or vehicle class changes
    useEffect(() => {
        const generateGSACodeForVehicle = async () => {
            if (formData.department && vehicleClass && !manualOverride) {
                try {
                    let gsaCode: string;

                    if (hasManualGSACode && manualCount) {
                        // Use manual count but update MAC and vehicle class
                        const macCode = getMACCode(formData.department);
                        const classCode = getVehicleClassCode(vehicleClass);
                        const count = parseInt(manualCount) || 1;

                        gsaCode = generateGSACode({
                            prefix: 'GSA',
                            macCode,
                            classCode,
                            count
                        });
                    } else {
                        // Auto-generate everything
                        gsaCode = await generateAssetGSACode(formData.department, 'vehicle', vehicleClass);
                    }

                    setGeneratedGSACode(gsaCode);
                    setFormData(prev => ({ ...prev, gsaCode }));
                } catch (error) {
                    console.error('Error generating GSA code:', error);
                }
            }
        };

        generateGSACodeForVehicle();
    }, [formData.department, vehicleClass, manualOverride, hasManualGSACode, manualCount]);

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

    const handleManualOverride = () => {
        if (!generatedGSACode) return;

        // Extract current count from generated GSA code
        const parts = generatedGSACode.split('-');
        if (parts.length === 4) {
            setManualCount(parts[3]);
        }
        setManualOverride(true);
    };

    const handleManualCountSave = async () => {
        if (!formData.department || !vehicleClass || !manualCount.trim()) return;

        try {
            const count = parseInt(manualCount);
            if (isNaN(count) || count < 1 || count > 999) {
                alert('Count must be a number between 1 and 999');
                return;
            }

            const macCode = getMACCode(formData.department);
            const classCode = getVehicleClassCode(vehicleClass);

            const newGSACode = generateGSACode({
                prefix: 'GSA',
                macCode,
                classCode,
                count
            });

            // Validate the new GSA code
            if (!validateGSACode(newGSACode)) {
                alert('Invalid GSA code format');
                return;
            }

            // Check if GSA code already exists
            const codeExists = await checkGSACodeExists(newGSACode, 'vehicle');
            if (codeExists) {
                alert('GSA code already exists. Please choose a different count number.');
                return;
            }

            // Update the form with manual GSA code
            setGeneratedGSACode(newGSACode);
            setFormData(prev => ({ ...prev, gsaCode: newGSACode }));
            setHasManualGSACode(true); // Mark that we have a manual GSA code
            // Keep the manual count for future MAC/class changes
            setManualOverride(false);
        } catch (error) {
            console.error('Error updating GSA code:', error);
            alert('Error updating GSA code. Please try again.');
        }
    };

    const handleManualCountCancel = () => {
        setManualOverride(false);
        setManualCount('');
    };

    const handleResetToAutoGenerate = () => {
        setHasManualGSACode(false);
        setManualOverride(false);
        setManualCount('');
        // This will trigger the useEffect to regenerate the GSA code automatically
    };

    // Personnel selection functions
    const handleAssignmentSelect = (person: any) => {
        setFormData(prev => ({ ...prev, assignment: person.fullName }));
        setAssignmentSearch(person.fullName);
        setShowAssignmentDropdown(false);
    };

    const handleOperatorSelect = (person: any) => {
        setFormData(prev => ({ ...prev, currentOperator: person.fullName }));
        setOperatorSearch(person.fullName);
        setShowOperatorDropdown(false);
    };

    const getFilteredPersonnel = (searchTerm: string) => {
        if (!searchTerm) return availablePersonnel.slice(0, 5); // Show first 5 if no search

        return availablePersonnel.filter(person => {
            if (!person) return false;

            const fullName = (person.fullName || '').toLowerCase();
            const department = (person.department || '').toLowerCase();
            const position = (person.position || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            return fullName.includes(search) ||
                department.includes(search) ||
                position.includes(search);
        }).slice(0, 5); // Limit to 5 results
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.personnel-dropdown')) {
                setShowAssignmentDropdown(false);
                setShowOperatorDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // Required fields validation
        if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number is required';
        if (!formData.make.trim()) newErrors.make = 'Make is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        if (!formData.vinNumber.trim()) newErrors.vinNumber = 'VIN number is required';
        if (!formData.departmentId) newErrors.department = 'MAC is required';
        // Temporarily disable facility requirement until fully implemented
        // if (!formData.facilityId) newErrors.facilityId = 'Facility assignment is required';
        if (!formData.entryDate) newErrors.entryDate = 'Data entry date is required';
        if (!formData.enteredBy.trim()) newErrors.enteredBy = 'Entered by is required';
        if (!formData.registrationDate) newErrors.registrationDate = 'Registration date is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚗 Add Fleet form submitted!');
        console.log('🚗 Form data:', formData);

        const isValid = validateForm();
        console.log('🚗 Form validation result:', isValid);
        console.log('🚗 Validation errors:', errors);

        if (!isValid) {
            console.log('❌ Form validation failed, not submitting');
            return;
        }

        setIsLoading(true);
        try {
            const vehicleId = `VH${String(Math.floor(Math.random() * 900) + 100)}`;

            const vehicleData = {
                id: vehicleId,
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('🚗 Creating fleet with GSA code:', vehicleData);

            // Post to real API
            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });

            const result = await response.json();
            if (result.success) {
                console.log('✅ Fleet created successfully:', result.vehicle);
                onSuccess(result.vehicle || vehicleData);
                resetForm();
                onClose();
            } else {
                throw new Error(result.message || 'Failed to create fleet');
            }
        } catch (error) {
            console.error('Error creating fleet:', error);
            if (error instanceof Error) {
                setErrors({ general: error.message });
            } else {
                setErrors({ general: 'Failed to create fleet. Please try again.' });
            }
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
            entryDate: new Date().toISOString().split('T')[0],
            enteredBy: '',
            registrationDate: '',
            lastMaintenance: '',
            maintenanceInterval: 5000,
            notes: '',
            serialNumber: '',
            gsaCode: '',
            engineNumber: '',
            powerRating: '',
            fuelType: 'Petrol',
            donor: '',
            location: '',
            assignment: '',
            facilityId: '',
            facilityName: '',
            cost: 0,
            lifeCycle: 'New',
            runningHours: '0'
        });
        setErrors({});
        setVehicleClass('Sedan');
        setGeneratedGSACode('');
        setManualOverride(false);
        setManualCount('');
        setHasManualGSACode(false);
        setAssignmentSearch('');
        setOperatorSearch('');
        setShowAssignmentDropdown(false);
        setShowOperatorDropdown(false);
    };

    // Get facilities filtered by selected MAC
    const getFilteredFacilities = () => {
        if (!formData.department) return [];
        return availableFacilities.filter(facility => 
            facility.department === formData.department
        );
    };

    const handleFacilityChange = (facilityId: string) => {
        const selectedFacility = availableFacilities.find(f => f.id === facilityId);
        if (selectedFacility) {
            setFormData(prev => ({
                ...prev,
                facilityId,
                facilityName: selectedFacility.name,
                location: selectedFacility.address || selectedFacility.name
            }));
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />

                <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white/20 rounded-lg p-2">
                                    <TruckIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Add Government Fleet
                                    </h3>
                                    <p className="text-sm text-blue-100">
                                        Register new fleet with comprehensive details
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

                    {/* Form Content - Organized Sections */}
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                            {errors.general && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                                    <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                                </div>
                            )}

                            <div className="space-y-8">

                                {/* Section 1: Assignment & Location (Must be first for GSA code generation) */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="">Select MAC</option>
                                                {availableMACs.map(dept => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Vehicle Class *
                                            </label>
                                            <select
                                                value={vehicleClass}
                                                onChange={(e) => setVehicleClass(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                {Object.keys(VEHICLE_CLASS_CODES).map(className => (
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
                                            <div className="flex items-center space-x-2">
                                                {!manualOverride ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={generatedGSACode}
                                                            disabled
                                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono text-lg"
                                                            placeholder="Select MAC and Vehicle Class to generate"
                                                        />
                                                        {generatedGSACode && (
                                                            <div className="flex space-x-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleManualOverride}
                                                                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded transition-colors"
                                                                    title="Manual Override for Paper Records"
                                                                >
                                                                    <PencilIcon className="h-5 w-5" />
                                                                </button>
                                                                {hasManualGSACode && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleResetToAutoGenerate}
                                                                        className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 p-2 rounded transition-colors"
                                                                        title="Reset to Auto-Generate"
                                                                    >
                                                                        <ArrowPathIcon className="h-5 w-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 flex items-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600">
                                                            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 font-mono">
                                                                {generatedGSACode?.split('-').slice(0, 3).join('-')}-
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={manualCount}
                                                                onChange={(e) => setManualCount(e.target.value)}
                                                                className="w-12 text-lg font-semibold text-blue-600 dark:text-blue-400 font-mono bg-transparent border-none outline-none text-center"
                                                                placeholder="001"
                                                                maxLength={3}
                                                            />
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <button
                                                                type="button"
                                                                onClick={handleManualCountSave}
                                                                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-2 rounded transition-colors"
                                                                title="Save Manual Count"
                                                            >
                                                                <CheckIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleManualCountCancel}
                                                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <XMarkIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Format: GSA-{getMACCode(formData.department) || 'MAC'}-{VEHICLE_CLASS_CODES[vehicleClass as keyof typeof VEHICLE_CLASS_CODES] || '02'}-Count
                                                </p>
                                                {generatedGSACode && !hasManualGSACode && (
                                                    <p className="text-xs text-orange-600 dark:text-orange-400">
                                                        📝 Click pencil for manual count (paper records import)
                                                    </p>
                                                )}
                                                {hasManualGSACode && (
                                                    <p className="text-xs text-green-600 dark:text-green-400">
                                                        Manual GSA Code Set | Click arrow to reset to auto-generate
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Basic Fleet Details */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Fleet Details</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Fleet identification and basic information</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Plate Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.plateNumber}
                                                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., LBR-001-GOV"
                                            />
                                            {errors.plateNumber && <p className="text-red-500 text-xs mt-1">{errors.plateNumber}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Make *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.make}
                                                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., Toyota, Nissan"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., Hilux, Patrol"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., White, Blue"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Technical Specifications */}
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Technical Specifications</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Engine, serial numbers, and technical details</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                VIN Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.vinNumber}
                                                onChange={(e) => setFormData({ ...formData, vinNumber: e.target.value.toUpperCase() })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="17-character VIN"
                                                maxLength={17}
                                            />
                                            {errors.vinNumber && <p className="text-red-500 text-xs mt-1">{errors.vinNumber}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Serial # *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.serialNumber}
                                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Fleet serial number"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Engine # *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.engineNumber}
                                                onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value.toUpperCase() })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Engine number"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                                <option value="Electric">Electric</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Financial & Procurement */}
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial & Procurement</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Cost, donor, and procurement information</p>
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="New">New</option>
                                                <option value="Used">Used</option>
                                                <option value="Refurbished">Refurbished</option>
                                                <option value="End of Life">End of Life</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Personnel Assignment */}
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personnel Assignment</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Facility assignment and personnel responsible for this fleet</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Facility Assignment *
                                            </label>
                                            <select
                                                value={formData.facilityId}
                                                onChange={(e) => handleFacilityChange(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                disabled={!formData.department}
                                            >
                                                <option value="">
                                                    {!formData.department ? 'Select MAC first' : 'Select Facility'}
                                                </option>
                                                {getFilteredFacilities().map(facility => (
                                                    <option key={facility.id} value={facility.id}>
                                                        {facility.name} - {facility.type.replace('_', ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Facility where this vehicle will be stationed
                                            </p>
                                            {errors.facilityId && <p className="text-red-500 text-xs mt-1">{errors.facilityId}</p>}
                                        </div>

                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Assignment (Personnel)
                                            </label>
                                            <input
                                                type="text"
                                                value={assignmentSearch || formData.assignment || ''}
                                                onChange={(e) => {
                                                    setAssignmentSearch(e.target.value);
                                                    setShowAssignmentDropdown(true);
                                                    if (!e.target.value) {
                                                        setFormData({ ...formData, assignment: '' });
                                                    }
                                                }}
                                                onFocus={() => setShowAssignmentDropdown(true)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Search personnel to assign fleet..."
                                            />
                                            {showAssignmentDropdown && (
                                                <div className="personnel-dropdown absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {getFilteredPersonnel(assignmentSearch).length > 0 ? (
                                                        getFilteredPersonnel(assignmentSearch).map((person) => (
                                                            <button
                                                                key={person.id}
                                                                type="button"
                                                                onClick={() => handleAssignmentSelect(person)}
                                                                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                                                            >
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">{person.fullName}</p>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{person.position} - {person.department}</p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400">No personnel found</div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAssignmentDropdown(false)}
                                                        className="w-full px-3 py-2 text-center text-gray-400 hover:text-gray-600 border-t border-gray-200 dark:border-gray-600"
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Current Operator (Personnel)
                                            </label>
                                            <input
                                                type="text"
                                                value={operatorSearch || formData.currentOperator || ''}
                                                onChange={(e) => {
                                                    setOperatorSearch(e.target.value);
                                                    setShowOperatorDropdown(true);
                                                    if (!e.target.value) {
                                                        setFormData({ ...formData, currentOperator: '' });
                                                    }
                                                }}
                                                onFocus={() => setShowOperatorDropdown(true)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Search personnel as current operator..."
                                            />
                                            {showOperatorDropdown && (
                                                <div className="personnel-dropdown absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {getFilteredPersonnel(operatorSearch).length > 0 ? (
                                                        getFilteredPersonnel(operatorSearch).map((person) => (
                                                            <button
                                                                key={person.id}
                                                                type="button"
                                                                onClick={() => handleOperatorSelect(person)}
                                                                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                                                            >
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">{person.fullName}</p>
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{person.position} - {person.department}</p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400">No personnel found</div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowOperatorDropdown(false)}
                                                        className="w-full px-3 py-2 text-center text-gray-400 hover:text-gray-600 border-t border-gray-200 dark:border-gray-600"
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Administrative Records */}
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Administrative Records</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Dates, status, and maintenance information</p>
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            />
                                            {errors.entryDate && <p className="text-red-500 text-xs mt-1">{errors.entryDate}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Registration Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.registrationDate}
                                                onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            />
                                            {errors.registrationDate && <p className="text-red-500 text-xs mt-1">{errors.registrationDate}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Entered By *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.enteredBy}
                                                onChange={(e) => setFormData({ ...formData, enteredBy: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Person entering data"
                                            />
                                            {errors.enteredBy && <p className="text-red-500 text-xs mt-1">{errors.enteredBy}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Status
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleFormData['status'] })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="active">Active - In use</option>
                                                <option value="parked">Parked - Available</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="alert">Alert - Needs attention</option>
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="e.g., 1500 hrs"
                                            />
                                        </div>

                                        <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Maintenance Interval (km)
                                        </label>
                                        <input
                                        type="number"
                                        min="1000"
                                        max="50000"
                                        step="500"
                                        value={formData.maintenanceInterval}
                                        onChange={(e) => setFormData({ ...formData, maintenanceInterval: parseInt(e.target.value) || 5000 })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            placeholder="5000"
                                            />
                                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                 Maintenance required every X kilometers
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
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Date of last maintenance service
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 6: Notes & Remarks */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Notes and additional remarks</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Remarks
                                            </label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                                placeholder="Additional notes about this fleet..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
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
                                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            <span>Adding Fleet...</span>
                                        </>
                                    ) : (
                                        <span>Add to Fleet</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AddVehicleModal
