import { useState, useEffect } from 'react';
import { PlusIcon, WrenchScrewdriverIcon, CalendarIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import ProfessionalMaintenanceModal from './ProfessionalMaintenanceModal';

interface MaintenanceRecord {
  id: string;
  type: string;
  description: string;
  date: string;
  mileage: number;
  cost: number;
  provider: string;
  status: 'scheduled' | 'completed' | 'overdue';
  nextDueDate?: string;
  nextDueMileage?: number;
  notes?: string;
  parts?: string[];
}

interface MaintenanceManagerProps {
  vehicleId: string;
  currentMileage: number;
  onMaintenanceUpdate: () => void;
}

const MaintenanceManager = ({ vehicleId, currentMileage, onMaintenanceUpdate }: MaintenanceManagerProps) => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Calculate next maintenance due based on mileage
  const calculateNextMaintenanceMileage = () => {
    const lastMaintenance = maintenanceRecords
      .filter(r => r.status === 'completed')
      .sort((a, b) => b.mileage - a.mileage)[0];
    
    const baselineMileage = lastMaintenance?.mileage || 0;
    return baselineMileage + 5000;
  };

  const isMaintenanceDue = () => {
    return currentMileage >= calculateNextMaintenanceMileage();
  };
  const [newRecord, setNewRecord] = useState({
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    mileage: currentMileage,
    cost: 0,
    mechanicName: '',
    provider: 'GSA Motorpool',
    customProvider: '',
    parts: [] as string[],
    spareParts: [] as Array<{id: string, name: string, cost: number, action: boolean, qualityChecked: boolean}>,
    technicalAssessment: {
      interior: {
        'Seat Belt': false,
        'Seats': false,
        'Sun Visor': false,
        'Switches': false,
        'Dashboard': false,
        'Gear Lever Free Play': false,
        'Tools & Equipment': false
      },
      suspension: {
        'Shock Absorbers': false,
        'Ball Joints': false,
        'Brake Pipes': false,
        'Fuel Pipes': false,
        'Fuel Tank': false,
        'Speedo Cable': false,
        'Hand Brake Cable': false,
        'Exhaust System': false,
        'Suspension Springs': false,
        'Tyres': false,
        'Suspension Bushes': false
      },
      external: {
        'Paint': false,
        'Dents': false,
        'Cracks': false,
        'Lenses': false,
        'Head Lights': false,
        'RV Mirrors': false,
        'Door Locks': false,
        'Fuel Tank Cap': false,
        'Door Glasses': false,
        'Wind Screen': false,
        'Spare Wheel': false,
        'Brake Disc': false,
        'Front Bumper': false,
        'Rear Bumper': false
      },
      engine: {
        'Oil Level': false,
        'Oil Thickness': false,
        'Oil Leakages': false,
        'Coolant Level and Condition': false,
        'Radiator Leakages': false,
        'Brake Fluid Level and Condition': false,
        'Clutch Fluid Level and Condition': false,
        'Power Steering Fluid Level': false,
        'Battery Water Level': false,
        'Battery Condition': false,
        'Air Filter Condition': false,
        'Drive Belt': false,
        'Viscous Fan': false,
        'Starting System': false,
        'Engine Noise Level': false,
        'Smoke Color/Quantity': false
      },
      electrics: {
        'Horn': false,
        'Wipers': false,
        'Lights': false,
        'Number Plate Lights': false,
        'Instrument Panel Lights': false
      },
      transmission: {
        'Gear Engagement': false,
        'Gearbox Noise': false,
        'Differential Noise': false,
        'Prop Shaft Uni-Joints': false
      }
    },
    status: 'runner' as 'runner' | 'non-runner',
    suitableForTRM: true,
    notes: ''
  });

  const [activeModalTab, setActiveModalTab] = useState<'service' | 'assessment' | 'status'>('service');

  // Spare parts management functions
  const addSparePart = (partName: string) => {
    const newPart = {
      id: `part_${Date.now()}`,
      name: partName,
      cost: 0,
      action: false,
      qualityChecked: false
    };
    
    setNewRecord(prev => ({
      ...prev,
      spareParts: [...prev.spareParts, newPart]
    }));
  };

  const removeSparePart = (partId: string) => {
    setNewRecord(prev => ({
      ...prev,
      spareParts: prev.spareParts.filter(part => part.id !== partId)
    }));
  };

  const updateSparePart = (partId: string, updates: any) => {
    setNewRecord(prev => ({
      ...prev,
      spareParts: prev.spareParts.map(part => 
        part.id === partId ? { ...part, ...updates } : part
      )
    }));
  };

  const updateTechnicalAssessment = (section: string, item: string, checked: boolean) => {
    setNewRecord(prev => ({
      ...prev,
      technicalAssessment: {
        ...prev.technicalAssessment,
        [section]: {
          ...prev.technicalAssessment[section as keyof typeof prev.technicalAssessment],
          [item]: checked
        }
      }
    }));
  };

  const getTotalCost = () => {
    return newRecord.spareParts.reduce((sum, part) => sum + part.cost, 0);
  };

  const maintenanceTypes = [
    'Oil Change',
    'Tire Rotation',
    'Brake Inspection',
    'Air Filter Replacement',
    'Transmission Service',
    'Battery Replacement',
    'Engine Tune-up',
    'Annual Inspection',
    'Emergency Repair',
    'Comprehensive Service',
    'Other'
  ];

  const availableSpareParts = [
    'Tyres', 'Cleanliness', 'Air Filter', 'Primary Fuel Filter', 'Main Fuel Filter',
    'Oil Filter', 'Drive Belts', 'Timing Belts', 'Front Shocks', 'Rear Shocks',
    'Suspension Bushes', 'Windscreen', 'Wipers', 'Engine Oil', 'Steering System',
    'Propeller Shaft', 'Wheel Bearing', 'Brake Fluid', 'Battery', 'Radio',
    'Gearbox Oil', 'Transfer Case Oil', 'Differential Gear Oil', 'Radiator Coolant',
    'Power Steering Coolant', 'Clutch Fluid', 'Lenses/Bulbs', 'Side Clearance',
    'Headlamps', 'Indicators', 'Licence Plate Lights', 'Tail Lamps', 'Reverse Lights',
    'Mirrors', 'Hand Brake', 'Brake Discs', 'Brake Drums', 'Brake Linings',
    'Brake Pads', 'Fuel Level'
  ];

  const technicalAssessmentItems = {
    interior: ['Seat Belt', 'Seats', 'Sun Visor', 'Switches', 'Dashboard', 'Gear Lever Free Play', 'Tools & Equipment'],
    suspension: ['Shock Absorbers', 'Ball Joints', 'Brake Pipes', 'Fuel Pipes', 'Fuel Tank', 'Speedo Cable', 'Hand Brake Cable', 'Exhaust System', 'Suspension Springs', 'Tyres', 'Suspension Bushes'],
    external: ['Paint', 'Dents', 'Cracks', 'Lenses', 'Head Lights', 'RV Mirrors', 'Door Locks', 'Fuel Tank Cap', 'Door Glasses', 'Wind Screen', 'Spare Wheel', 'Brake Disc', 'Front Bumper', 'Rear Bumper'],
    engine: ['Oil Level', 'Oil Thickness', 'Oil Leakages', 'Coolant Level and Condition', 'Radiator Leakages', 'Brake Fluid Level and Condition', 'Clutch Fluid Level and Condition', 'Power Steering Fluid Level', 'Battery Water Level', 'Battery Condition', 'Air Filter Condition', 'Drive Belt', 'Viscous Fan', 'Starting System', 'Engine Noise Level', 'Smoke Color/Quantity'],
    electrics: ['Horn', 'Wipers', 'Lights', 'Number Plate Lights', 'Instrument Panel Lights'],
    transmission: ['Gear Engagement', 'Gearbox Noise', 'Differential Noise', 'Prop Shaft Uni-Joints']
  };

  const governmentProviders = [
    'GSA Motor Pool',
    'Government Fleet Services',
    'Authorized Government Contractor',
    'Emergency Service Provider',
    'Other'
  ];

  useEffect(() => {
    fetchMaintenanceRecords();
  }, [vehicleId]);

  const fetchMaintenanceRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/maintenance`);
      const result = await response.json();
      if (result.success) {
        setMaintenanceRecords(result.maintenance || []);
      }
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMaintenanceRecord = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newRecord,
          status: 'completed',
          parts: newRecord.parts.filter(part => part.trim() !== '')
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowAddModal(false);
        setNewRecord({
          type: '',
          description: '',
          date: '',
          mileage: currentMileage,
          cost: 0,
          provider: '',
          notes: '',
          parts: []
        });
        await fetchMaintenanceRecords();
        onMaintenanceUpdate();
      } else {
        alert('Failed to add maintenance record: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding maintenance record:', error);
      alert('Failed to add maintenance record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getNextServiceInfo = () => {
    if (!maintenanceRecords || !Array.isArray(maintenanceRecords)) return null;
    
    const completedRecords = maintenanceRecords.filter(r => r.status === 'completed');
    if (completedRecords.length === 0) return null;

    const lastService = completedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const daysSinceService = Math.floor((Date.now() - new Date(lastService.date).getTime()) / (1000 * 60 * 60 * 24));
    const mileageSinceService = currentMileage - lastService.mileage;
    
    // Government fleet maintenance intervals (mileage-based)
    const mileageUntilNextService = Math.max(0, 5000 - mileageSinceService); // 5000km interval
    
    return {
      lastService,
      daysSinceService,
      mileageSinceService,
      mileageUntilNextService,
      nextDueMileage: lastService.mileage + 5000,
      isOverdue: mileageUntilNextService === 0
    };
  };

  const nextServiceInfo = getNextServiceInfo();
  const safeMaintenanceRecords = maintenanceRecords || [];

  return (
    <div className="space-y-6">
      {/* Service Schedule Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Maintenance Schedule</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Record</span>
          </button>
        </div>

        {nextServiceInfo ? (
          <div className={`rounded-lg p-6 ${nextServiceInfo.isOverdue ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
            <div className="text-center mb-4">
              <p className={`text-3xl font-bold ${nextServiceInfo.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {nextServiceInfo.isOverdue ? 'OVERDUE' : `${nextServiceInfo.mileageUntilNextService.toLocaleString()} km`}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {nextServiceInfo.isOverdue ? 'Maintenance service required' : 'Until next maintenance'}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {nextServiceInfo.lastService.date ? new Date(nextServiceInfo.lastService.date).toLocaleDateString() : 'Never'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Service</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {nextServiceInfo.daysSinceService} days
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Since Service</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {nextServiceInfo.mileageSinceService.toLocaleString()} km
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Since Service</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
            <WrenchScrewdriverIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">No Maintenance History</h4>
            <p className="text-gray-600 dark:text-gray-400">Add the first maintenance record to start tracking service intervals</p>
          </div>
        )}
      </div>

      {/* Maintenance History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Service History</h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading maintenance records...</p>
          </div>
        ) : maintenanceRecords.length > 0 ? (
          <div className="space-y-4">
            {maintenanceRecords
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((record) => (
                <div key={record.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-2">
                        <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{record.type}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{record.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Date:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Mileage:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {record.mileage?.toLocaleString() || 'Not recorded'} km
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              ${record.cost?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Provider:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{record.provider}</p>
                          </div>
                        </div>
                        
                        {record.parts && record.parts.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Parts replaced:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {record.parts.map((part, index) => (
                                <span key={index} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm">
                                  {part}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {record.notes && (
                          <div className="mt-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Notes:</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">No Maintenance Records</h4>
            <p className="text-gray-600 dark:text-gray-400">Add maintenance records to track vehicle service history</p>
          </div>
        )}
      </div>

      {/* Professional Maintenance Modal */}
      <ProfessionalMaintenanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(record) => {
          setMaintenanceRecords(prev => [record, ...prev]);
          setShowAddModal(false);
          onMaintenanceUpdate();
        }}
        vehicleId={vehicleId}
        currentMileage={currentMileage}
      />

      {/* Backup: Enhanced modal (disabled) */}
      {false && showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddModal(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Maintenance Record</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current: {currentMileage.toLocaleString()}km • Next Due: {(currentMileage + 5000).toLocaleString()}km
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Section Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'service', label: 'Service Details & Parts', icon: '🔧' },
                    { id: 'assessment', label: 'Technical Assessment', icon: '🔍' },
                    { id: 'status', label: 'Vehicle Status', icon: '✅' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveModalTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeModalTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Tab Content */}
                {activeModalTab === 'basic' && (
                  <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Type
                    </label>
                    <select
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select service type</option>
                      {maintenanceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Date
                    </label>
                    <input
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    placeholder="Brief description of work performed"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mileage (km)
                    </label>
                    <input
                      type="number"
                      value={newRecord.mileage}
                      onChange={(e) => setNewRecord({ ...newRecord, mileage: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newRecord.cost}
                      onChange={(e) => setNewRecord({ ...newRecord, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Provider
                    </label>
                    <select
                      value={newRecord.provider}
                      onChange={(e) => setNewRecord({ ...newRecord, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="GSA Motorpool">GSA Motorpool</option>
                      <option value="custom">Other Provider</option>
                    </select>
                    {newRecord.provider === 'custom' && (
                      <input
                        type="text"
                        value={newRecord.customProvider}
                        onChange={(e) => setNewRecord({ ...newRecord, customProvider: e.target.value })}
                        placeholder="Enter provider name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mt-2"
                      />
                    )}
                  </div>
                </div>

                {/* Add Mechanic Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mechanic Name *
                  </label>
                  <input
                    type="text"
                    value={newRecord.mechanicName}
                    onChange={(e) => setNewRecord({ ...newRecord, mechanicName: e.target.value })}
                    placeholder="Name of mechanic performing maintenance"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Maintenance Interval Display */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Maintenance Schedule</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Current Mileage:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{currentMileage.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Next Due at:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{(currentMileage + 5000).toLocaleString()} km</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    placeholder="Additional notes about the service"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                  </div>
                )}

                {/* Spare Parts Tab */}
                {activeModalTab === 'parts' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Spare Parts Management</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Cost: ${getTotalCost().toFixed(2)}
                      </div>
                    </div>

                    {/* Add Spare Parts */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Available Spare Parts</h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {availableSpareParts.map(part => (
                          <button
                            key={part}
                            type="button"
                            onClick={() => addSparePart(part)}
                            disabled={newRecord.spareParts.some(p => p.name === part)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {part}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Spare Parts */}
                    {newRecord.spareParts.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Selected Spare Parts</h4>
                        {newRecord.spareParts.map(part => (
                          <div key={part.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900 dark:text-white">{part.name}</h5>
                              <button
                                type="button"
                                onClick={() => removeSparePart(part.id)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Cost ($)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={part.cost}
                                  onChange={(e) => updateSparePart(part.id, { cost: parseFloat(e.target.value) || 0 })}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                                />
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={part.action}
                                    onChange={(e) => updateSparePart(part.id, { action: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">Action</span>
                                </label>
                                
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={part.qualityChecked}
                                    onChange={(e) => updateSparePart(part.id, { qualityChecked: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">Quality Checked</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Technical Assessment Tab */}
                {activeModalTab === 'assessment' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Technical Assessment</h3>
                    
                    {Object.entries(technicalAssessmentItems).map(([sectionName, items]) => (
                      <div key={sectionName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 capitalize">
                          {sectionName}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {items.map((itemName: string) => (
                            <label key={itemName} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={newRecord.technicalAssessment[sectionName as keyof typeof newRecord.technicalAssessment][itemName] || false}
                                onChange={(e) => updateTechnicalAssessment(sectionName, itemName, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{itemName}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Tab */}
                {activeModalTab === 'status' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vehicle Status Assessment</h3>
                    
                    {/* Runner Status */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Vehicle Condition</h4>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="status"
                            value="runner"
                            checked={newRecord.status === 'runner'}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, status: e.target.value as any }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Runner</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="status"
                            value="non-runner"
                            checked={newRecord.status === 'non-runner'}
                            onChange={(e) => setNewRecord(prev => ({ ...prev, status: e.target.value as any }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Non-Runner</span>
                        </label>
                      </div>
                    </div>

                    {/* TRM Suitability */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Suitable for TRM?</h4>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="trm"
                            checked={newRecord.suitableForTRM === true}
                            onChange={() => setNewRecord(prev => ({ ...prev, suitableForTRM: true }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="trm"
                            checked={newRecord.suitableForTRM === false}
                            onChange={() => setNewRecord(prev => ({ ...prev, suitableForTRM: false }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addMaintenanceRecord}
                    disabled={!newRecord.type || !newRecord.date || !newRecord.description}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MaintenanceManager;
