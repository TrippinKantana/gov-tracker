import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, TruckIcon, MapIcon, WrenchScrewdriverIcon, ArrowRightIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import GPSTrackingControls from './GPSTrackingControls';
import GPSDeviceAssignment from './GPSDeviceAssignment';
import MaintenanceManager from './MaintenanceManager';
import FleetExportButton from './FleetExportButton';
import { generateGSACode, parseGSACode, validateGSACode, getMACCode, getVehicleClassCode, checkGSACodeExists } from '../utils/gsaCodeGenerator';
import { useAuth } from '../contexts/AuthContext';
import { isDepartmentAdmin, hasValidMACAssignment } from '../utils/departmentFilter';

interface ViewVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string | null;
    onTrack?: (vehicleId: string) => void;
    onEdit?: (vehicleId: string) => void;
    onDelete?: (vehicleId: string) => void;
    onTransfer?: (vehicleId: string) => void;
}

interface VehicleDetails {
    id: string;
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    color?: string;
    vinNumber?: string;
    vehicleType: string;
    status: string;
    department: string;
    departmentId?: string;
    currentOperator?: string;
    operatorId?: string;
    gpsTracker?: string;
    fuelLevel?: number;
    mileage?: number;
    lastLocation?: string;
    lastUpdate?: string;
    lastMaintenance?: string;
    nextMaintenance?: string;
    createdAt?: string;
    updatedAt?: string;
    gsaCode?: string;
    serialNumber?: string;
    engineNumber?: string;
    powerRating?: string;
    fuelType?: string;
    runningHours?: string;
    cost?: number;
    donor?: string;
    lifeCycle?: string;
    entryDate?: string;
    enteredBy?: string;
    registrationDate?: string;
    location?: string;
    assignment?: string;
    maintenanceInterval?: number;
}

const ViewVehicleModal = ({ isOpen, onClose, vehicleId, onTrack, onEdit, onDelete, onTransfer }: ViewVehicleModalProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isViewOnly = isDepartmentAdmin(user) && hasValidMACAssignment(user);
    const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'maintenance' | 'statistics'>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [editingGSACode, setEditingGSACode] = useState(false);
    const [manualCount, setManualCount] = useState('');

    useEffect(() => {
        if (isOpen && vehicleId) {
            fetchVehicleDetails();
        }
    }, [isOpen, vehicleId]);

    const fetchVehicleDetails = async () => {
        if (!vehicleId) return;

        setIsLoading(true);
        setError('');
        try {
            // Fetch real vehicle data from API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Vehicle not found');
                } else if (response.status >= 500) {
                    throw new Error('Server error - please try again later');
                } else {
                    throw new Error(`Failed to fetch vehicle details (${response.status})`);
                }
            }

            const result = await response.json();
            if (result.success && result.vehicle) {
                setVehicle(result.vehicle);
            } else {
                throw new Error('Invalid vehicle data received from server');
            }
        } catch (error) {
            console.error('Error fetching vehicle details:', error);

            if (error.name === 'AbortError') {
                setError('Request timeout - please check your connection and try again');
            } else if (error.message.includes('fetch')) {
                setError('Unable to connect to server - please check if the backend is running');
            } else {
                setError(error.message || 'Failed to load vehicle details');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'parked': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'alert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getFuelLevelColor = (level?: number) => {
        if (!level) return 'bg-gray-400';
        if (level > 50) return 'bg-green-500';
        if (level > 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const handleGSACodeEdit = () => {
        if (!vehicle?.gsaCode) return;

        const parsed = parseGSACode(vehicle.gsaCode);
        if (parsed) {
            setManualCount(parsed.count.toString().padStart(3, '0'));
        }
        setEditingGSACode(true);
    };

    const handleGSACodeSave = async () => {
        if (!vehicle || !manualCount.trim()) return;

        try {
            const count = parseInt(manualCount);
            if (isNaN(count) || count < 1 || count > 999) {
                alert('Count must be a number between 1 and 999');
                return;
            }

            const macCode = getMACCode(vehicle.department);
            const classCode = getVehicleClassCode(vehicle.vehicleType);

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
            const codeExists = await checkGSACodeExists(newGSACode, 'vehicle', vehicle.id);
            if (codeExists) {
                alert('GSA code already exists. Please choose a different count number.');
                return;
            }

            // Update vehicle with new GSA code
            const response = await fetch(`/api/vehicles/${vehicle.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...vehicle,
                    gsaCode: newGSACode
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setVehicle(prev => prev ? { ...prev, gsaCode: newGSACode } : null);
                    setEditingGSACode(false);
                    setManualCount('');
                } else {
                    alert(result.message || 'Failed to update GSA code');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 409) {
                    alert('GSA code already exists. Please choose a different count number.');
                } else {
                    alert(errorData.message || 'Failed to update GSA code');
                }
            }
        } catch (error) {
            console.error('Error updating GSA code:', error);
            alert('Error updating GSA code. Please try again.');
        }
    };

    const handleGSACodeCancel = () => {
        setEditingGSACode(false);
        setManualCount('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-500 rounded-lg p-2">
                                <TruckIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fleet Details</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Government fleet information</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading fleet details...</span>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <p className="text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {vehicle && (
                            <>
                                {/* Tabs */}
                                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                        <button
                                            onClick={() => setActiveTab('overview')}
                                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                                }`}
                                        >
                                            Fleet Overview
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('tracking')}
                                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'tracking'
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                                }`}
                                        >
                                            GPS Tracking
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('maintenance')}
                                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'maintenance'
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                                }`}
                                        >
                                            Maintenance
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('statistics')}
                                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'statistics'
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                                }`}
                                        >
                                            Usage Statistics
                                        </button>
                                    </nav>
                                </div>

                                {/* Tab Content */}
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                    {/* Main Content Area */}
                                    <div className="lg:col-span-3">

                                        {/* Overview Tab */}
                                        {activeTab === 'overview' && (
                                            <div className="space-y-6">
                                                {/* Fleet Information */}
                                                <div className="space-y-6">
                                                    {/* Basic Fleet Details */}
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Fleet Information</h3>
                                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fleet</label>
                                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Plate Number</label>
                                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{vehicle.plateNumber}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">GSA Code</label>
                                                                    <div className="flex items-center space-x-2">
                                                                        {!editingGSACode ? (
                                                                            <>
                                                                                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 font-mono">
                                                                                    {vehicle.gsaCode || 'Not assigned'}
                                                                                </p>
                                                                                {vehicle.gsaCode && (
                                                                                    <button
                                                                                        onClick={handleGSACodeEdit}
                                                                                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded transition-colors"
                                                                                        title="Edit GSA Code Count"
                                                                                    >
                                                                                        <PencilIcon className="h-4 w-4" />
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <div className="flex items-center space-x-1">
                                                                                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 font-mono">
                                                                                        {vehicle.gsaCode?.split('-').slice(0, 3).join('-')}-
                                                                                    </span>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={manualCount}
                                                                                        onChange={(e) => setManualCount(e.target.value)}
                                                                                        className="w-12 text-lg font-semibold text-blue-600 dark:text-blue-400 font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 text-center"
                                                                                        placeholder="001"
                                                                                        maxLength={3}
                                                                                    />
                                                                                </div>
                                                                                <div className="flex space-x-1">
                                                                                    <button
                                                                                        onClick={handleGSACodeSave}
                                                                                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1 rounded transition-colors"
                                                                                        title="Save Changes"
                                                                                    >
                                                                                        <CheckIcon className="h-4 w-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={handleGSACodeCancel}
                                                                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded transition-colors"
                                                                                        title="Cancel"
                                                                                    >
                                                                                        <XMarkIcon className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    {vehicle.gsaCode && (
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                            Click pencil icon to manually override count for paper records import
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</label>
                                                                    <p className="text-gray-900 dark:text-white capitalize">{vehicle.vehicleType}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Color</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.color || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                                                        {vehicle.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Technical Specifications */}
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Technical Specifications</h3>
                                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">VIN Number</label>
                                                                    <p className="text-gray-900 dark:text-white font-mono text-sm">{vehicle.vinNumber || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Serial Number</label>
                                                                    <p className="text-gray-900 dark:text-white font-mono text-sm">{vehicle.serialNumber || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Engine Number</label>
                                                                    <p className="text-gray-900 dark:text-white font-mono text-sm">{vehicle.engineNumber || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Power Rating</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.powerRating || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuel Type</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.fuelType || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Running Hours</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.runningHours || 'Not recorded'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Financial & Procurement */}
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financial & Procurement</h3>
                                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost/Value</label>
                                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                        ${vehicle.cost?.toLocaleString() || 'Not specified'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Donor/Funding</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.donor || 'Government Budget'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Life Cycle</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.lifeCycle || 'Not specified'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Administrative Records */}
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Administrative Records</h3>
                                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Entry Date</label>
                                                                    <p className="text-gray-900 dark:text-white">
                                                                        {vehicle.entryDate ? new Date(vehicle.entryDate).toLocaleDateString() : 'Not recorded'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Entered By</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.enteredBy || 'Not recorded'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Registration Date</label>
                                                                    <p className="text-gray-900 dark:text-white">
                                                                        {vehicle.registrationDate ? new Date(vehicle.registrationDate).toLocaleDateString() : 'Not specified'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Location</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.location || vehicle.lastLocation || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Assignment</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.assignment || 'General use'}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Maintenance Interval</label>
                                                                    <p className="text-gray-900 dark:text-white">{vehicle.maintenanceInterval || 90} days</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MACs Assignment */}
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">MACs Assignment</h3>
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-sm font-medium text-blue-700 dark:text-blue-300">Primary Assignment</label>
                                                                <p className="text-xl font-semibold text-gray-900 dark:text-white">{vehicle.department}</p>
                                                                <p className="text-sm text-blue-600 dark:text-blue-400">Ministry/Agency/Commission Owner</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Operator</label>
                                                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                                                    {vehicle.currentOperator || 'Available for Assignment'}
                                                                </p>
                                                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                                                    {vehicle.currentOperator ? 'Person using fleet' : 'Ready for deployment'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* GPS Tracking Tab */}
                                        {activeTab === 'tracking' && (
                                            <div className="space-y-6">
                                                <GPSDeviceAssignment
                                                    vehicleId={vehicle.id}
                                                    currentTrackerId={vehicle.gpsTracker}
                                                    onAssignmentChange={(trackerId) => {
                                                        setVehicle(prev => prev ? { ...prev, gpsTracker: trackerId || undefined } : null);
                                                    }}
                                                />

                                                {vehicle.gpsTracker && (
                                                    <GPSTrackingControls
                                                        vehicleId={vehicle.id}
                                                        trackerId={vehicle.gpsTracker}
                                                        vehicleName={`${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`}
                                                        onLocationUpdate={(data) => {
                                                            console.log('GPS update received for fleet:', data);
                                                            // Update fleet location and fuel data if available
                                                            setVehicle(prev => prev ? {
                                                                ...prev,
                                                                lastLocation: `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
                                                                lastUpdate: new Date().toISOString(),
                                                                fuelLevel: data.fuelLevel || prev.fuelLevel
                                                            } : null);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* Maintenance Tab */}
                                        {activeTab === 'maintenance' && (
                                            <MaintenanceManager
                                                vehicleId={vehicle.id}
                                                currentMileage={vehicle.mileage || 0}
                                                onMaintenanceUpdate={fetchVehicleDetails}
                                            />
                                        )}

                                        {/* Statistics Tab */}
                                        {activeTab === 'statistics' && (
                                            <div className="space-y-6">
                                                {/* Mileage Statistics */}
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Mileage & Usage Statistics</h3>
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                                {vehicle.mileage?.toLocaleString() || '0'}
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Total km</p>
                                                        </div>
                                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">125</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">km Today</p>
                                                        </div>
                                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                                                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">8.5</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">L/100km</p>
                                                        </div>
                                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">42</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">km/h Avg</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Usage Patterns */}
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Usage Patterns</h3>
                                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="space-y-3">
                                                                <h4 className="font-medium text-gray-900 dark:text-white">Daily Usage</h4>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Most active time:</span>
                                                                        <span className="text-gray-900 dark:text-white">9:00 AM - 5:00 PM</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Average daily usage:</span>
                                                                        <span className="text-gray-900 dark:text-white">6.5 hours</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Idle time:</span>
                                                                        <span className="text-gray-900 dark:text-white">1.5 hours</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h4 className="font-medium text-gray-900 dark:text-white">Performance</h4>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Fuel efficiency trend:</span>
                                                                        <span className="text-green-600 dark:text-green-400">↗️ Improving</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Speed compliance:</span>
                                                                        <span className="text-green-600 dark:text-green-400">98%</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600 dark:text-gray-400">Geo-fence compliance:</span>
                                                                        <span className="text-green-600 dark:text-green-400">100%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sidebar with Quick Info & Actions */}
                                    <div className="space-y-6">
                                        {/* Quick Stats */}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Info</h3>
                                            <div className="space-y-4">
                                                {/* Fuel Level */}
                                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuel Level</span>
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{vehicle.fuelLevel || 0}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${getFuelLevelColor(vehicle.fuelLevel)}`}
                                                            style={{ width: `${vehicle.fuelLevel || 0}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Status */}
                                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                                    <div className="text-center">
                                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                                                            {vehicle.status}
                                                        </span>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Current Status</p>
                                                    </div>
                                                </div>

                                                {/* Department */}
                                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                                    <div className="text-center">
                                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{vehicle.department}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Department</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Spacer - Actions moved to footer */}
                                        <div></div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer - Horizontal Action Buttons */}
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                        <div className="flex flex-wrap gap-3 mb-4">
                            {/* Primary Actions */}
                            <button
                                onClick={() => {
                                    console.log(`🗺️ Navigating to live map to track fleet: ${vehicle?.plateNumber}`);
                                    navigate('/map', {
                                        state: {
                                            trackVehicle: vehicle?.id,
                                            vehicleName: vehicle?.plateNumber,
                                            vehicleCoordinates: [vehicle?.longitude || -10.7969, vehicle?.latitude || 6.2907],
                                            autoFocus: true,
                                            debugInfo: `Tracking ${vehicle?.plateNumber} from fleet details modal`,
                                            timestamp: new Date().toISOString()
                                        }
                                    });
                                    onClose();
                                }}
                                className="flex-1 min-w-[140px] bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <MapIcon className="h-4 w-4" />
                                <span className="text-sm">Track on Map</span>
                            </button>

                            {!isViewOnly && (
                                <>
                                    <button
                                        onClick={() => {
                                            if (onEdit && vehicle) onEdit(vehicle.id);
                                            onClose();
                                        }}
                                        className="flex-1 min-w-[120px] bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <WrenchScrewdriverIcon className="h-4 w-4" />
                                        <span className="text-sm">Edit</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (onTransfer && vehicle) onTransfer(vehicle.id);
                                            onClose();
                                        }}
                                        className="flex-1 min-w-[140px] bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <ArrowRightIcon className="h-4 w-4" />
                                        <span className="text-sm">Transfer</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (onDelete && vehicle) onDelete(vehicle.id);
                                            onClose();
                                        }}
                                        className="flex-1 min-w-[120px] bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                        <span className="text-sm">Delete</span>
                                    </button>
                                </>
                            )}

                            {/* Export Button - Always available */}
                            {vehicle && (
                                <div className="flex-1 min-w-[140px]">
                                    <FleetExportButton
                                        fleet={vehicle}
                                        className=""
                                    />
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewVehicleModal;
