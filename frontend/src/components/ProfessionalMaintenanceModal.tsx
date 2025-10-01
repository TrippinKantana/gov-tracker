/**
 * Professional Maintenance Record Modal
 * Government-grade maintenance recording system
 * Logical flow: Service Details → Technical Assessment → Status Certification
 */

import { useState } from 'react';
import { XMarkIcon, WrenchScrewdriverIcon, TrashIcon } from '@heroicons/react/24/outline';

interface SparePartItem {
  id: string;
  name: string;
  cost: number;
  action: boolean;
  qualityChecked: boolean;
}

interface ProfessionalMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: any) => void;
  vehicleId: string;
  currentMileage: number;
}

const ProfessionalMaintenanceModal = ({ isOpen, onClose, onSuccess, vehicleId, currentMileage }: ProfessionalMaintenanceModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Service Details
    serviceDate: new Date().toISOString().split('T')[0],
    serviceMileage: currentMileage, // Editable actual odometer reading
    mechanicName: '',
    provider: 'GSA Motorpool',
    customProvider: '',
    spareParts: [] as SparePartItem[],
    
    // Step 2: Technical Assessment
    technicalAssessment: {
      interior: {
        'Seat Belt': false, 'Seats': false, 'Sun Visor': false, 'Switches': false, 
        'Dashboard': false, 'Gear Lever Free Play': false, 'Tools & Equipment': false
      },
      suspension: {
        'Shock Absorbers': false, 'Ball Joints': false, 'Brake Pipes': false, 'Fuel Pipes': false,
        'Fuel Tank': false, 'Speedo Cable': false, 'Hand Brake Cable': false, 'Exhaust System': false,
        'Suspension Springs': false, 'Tyres': false, 'Suspension Bushes': false
      },
      external: {
        'Paint': false, 'Dents': false, 'Cracks': false, 'Lenses': false, 'Head Lights': false,
        'RV Mirrors': false, 'Door Locks': false, 'Fuel Tank Cap': false, 'Door Glasses': false,
        'Wind Screen': false, 'Spare Wheel': false, 'Brake Disc': false, 'Front Bumper': false, 'Rear Bumper': false
      },
      engine: {
        'Oil Level': false, 'Oil Thickness': false, 'Oil Leakages': false, 'Coolant Level and Condition': false,
        'Radiator Leakages': false, 'Brake Fluid Level and Condition': false, 'Clutch Fluid Level and Condition': false,
        'Power Steering Fluid Level': false, 'Battery Water Level': false, 'Battery Condition': false,
        'Air Filter Condition': false, 'Drive Belt': false, 'Viscous Fan': false, 'Starting System': false,
        'Engine Noise Level': false, 'Smoke Color/Quantity': false
      },
      electrics: {
        'Horn': false, 'Wipers': false, 'Lights': false, 'Number Plate Lights': false, 'Instrument Panel Lights': false
      },
      transmission: {
        'Gear Engagement': false, 'Gearbox Noise': false, 'Differential Noise': false, 'Prop Shaft Uni-Joints': false
      }
    },
    
    // Step 3: Status
    vehicleStatus: 'runner' as 'runner' | 'non-runner',
    suitableForTRM: true,
    serviceNotes: ''
  });

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

  const addSparePart = (partName: string) => {
    const newPart: SparePartItem = {
      id: `part_${Date.now()}`,
      name: partName,
      cost: 0,
      action: false,
      qualityChecked: false
    };
    
    setFormData(prev => ({
      ...prev,
      spareParts: [...prev.spareParts, newPart]
    }));
  };

  const removeSparePart = (partId: string) => {
    setFormData(prev => ({
      ...prev,
      spareParts: prev.spareParts.filter(part => part.id !== partId)
    }));
  };

  const updateSparePart = (partId: string, updates: Partial<SparePartItem>) => {
    setFormData(prev => ({
      ...prev,
      spareParts: prev.spareParts.map(part => 
        part.id === partId ? { ...part, ...updates } : part
      )
    }));
  };

  const updateTechnicalAssessment = (section: string, item: string, checked: boolean) => {
    setFormData(prev => ({
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
    return formData.spareParts.reduce((sum, part) => sum + part.cost, 0);
  };

  const calculateNextMaintenanceMileage = () => {
    return (formData.serviceMileage || currentMileage) + 5000;
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2: return formData.mechanicName.trim() !== '' && formData.serviceMileage > 0 && formData.spareParts.length > 0;
      case 3: return true; // Can always proceed to assessment
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!formData.mechanicName.trim()) {
      alert('Mechanic name is required');
      return;
    }

    if (!formData.serviceMileage || formData.serviceMileage <= 0) {
      alert('Service mileage is required');
      return;
    }

    if (formData.spareParts.length === 0) {
      alert('At least one spare part or service must be selected');
      return;
    }

    setIsLoading(true);
    try {
      const maintenanceRecord = {
        id: `MR_${Date.now()}`,
        vehicleId,
        type: 'Comprehensive Service',
        description: `${formData.spareParts.length} parts/services performed by ${formData.mechanicName}`,
        date: formData.serviceDate,
        mileage: formData.serviceMileage, // Use actual service mileage
        cost: getTotalCost(),
        provider: formData.provider === 'custom' ? formData.customProvider : formData.provider,
        mechanicName: formData.mechanicName,
        spareParts: formData.spareParts,
        technicalAssessment: formData.technicalAssessment,
        vehicleStatus: formData.vehicleStatus,
        suitableForTRM: formData.suitableForTRM,
        notes: formData.serviceNotes,
        nextDueMileage: calculateNextMaintenanceMileage(),
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      console.log('🔧 Submitting professional maintenance record:', maintenanceRecord);
      
      // Save to API
      const response = await fetch(`/api/vehicles/${vehicleId}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(maintenanceRecord)
      });

      if (response.ok) {
        onSuccess(maintenanceRecord);
        console.log('✅ Professional maintenance record saved');
      } else {
        throw new Error('Failed to save maintenance record');
      }
    } catch (error) {
      console.error('Error saving maintenance record:', error);
      alert('Failed to save maintenance record');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vehicle Maintenance Record</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current: {currentMileage.toLocaleString()}km • Next Due: {calculateNextMaintenanceMileage().toLocaleString()}km
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: 'Service Details' },
                { step: 2, label: 'Technical Assessment' },
                { step: 3, label: 'Status Certification' }
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {step}
                  </div>
                  <span className={`ml-2 text-sm ${currentStep >= step ? 'text-blue-600' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {step < 3 && (
                    <div className={`w-24 h-1 mx-4 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Service Details & Parts */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Service Details</h3>
                
                {/* Service Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Date *
                    </label>
                    <input
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Mileage (km) *
                    </label>
                    <input
                      type="number"
                      value={formData.serviceMileage}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceMileage: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="Actual odometer reading"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Actual odometer reading at time of service
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mechanic Name *
                    </label>
                    <input
                      type="text"
                      value={formData.mechanicName}
                      onChange={(e) => setFormData(prev => ({ ...prev, mechanicName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="Name of mechanic"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Provider
                    </label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="GSA Motorpool">GSA Motorpool</option>
                      <option value="custom">Other Provider</option>
                    </select>
                    {formData.provider === 'custom' && (
                      <input
                        type="text"
                        value={formData.customProvider}
                        onChange={(e) => setFormData(prev => ({ ...prev, customProvider: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white mt-2"
                        placeholder="Enter provider name"
                      />
                    )}
                  </div>
                </div>

                {/* Maintenance Schedule Display */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Maintenance Schedule</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Fleet Mileage:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{currentMileage.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Service Mileage:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{(formData.serviceMileage || currentMileage).toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Next Due at:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{((formData.serviceMileage || currentMileage) + 5000).toLocaleString()} km</span>
                    </div>
                  </div>
                </div>

                {/* Spare Parts & Services */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Parts & Services Performed</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Cost: ${getTotalCost().toFixed(2)}
                    </div>
                  </div>

                  {/* Add Spare Parts */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">Select Parts & Services</h5>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                      {availableSpareParts.map(part => (
                        <button
                          key={part}
                          type="button"
                          onClick={() => addSparePart(part)}
                          disabled={formData.spareParts.some(p => p.name === part)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {part}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Parts */}
                  {formData.spareParts.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900 dark:text-white">Work Performed</h5>
                      {formData.spareParts.map(part => (
                        <div key={part.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-gray-900 dark:text-white">{part.name}</h6>
                            <button
                              type="button"
                              onClick={() => removeSparePart(part.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Cost ($)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={part.cost}
                                onChange={(e) => updateSparePart(part.id, { cost: parseFloat(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={part.action}
                                  onChange={(e) => updateSparePart(part.id, { action: e.target.checked })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-700 dark:text-gray-300">Action</span>
                              </label>
                              
                              <label className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={part.qualityChecked}
                                  onChange={(e) => updateSparePart(part.id, { qualityChecked: e.target.checked })}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-700 dark:text-gray-300">Quality OK</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Technical Assessment */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Technical Assessment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete inspection checklist for vehicle systems
                </p>
                
                {Object.entries(formData.technicalAssessment).map(([sectionName, items]) => (
                  <div key={sectionName} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 capitalize">
                      {sectionName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(items).map(([itemName, checked]) => (
                        <label key={itemName} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={checked}
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

            {/* Step 3: Status Certification */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Status Certification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Final vehicle condition assessment after maintenance
                </p>
                
                {/* Runner Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Vehicle Operational Status</h4>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="status"
                        value="runner"
                        checked={formData.vehicleStatus === 'runner'}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleStatus: e.target.value as any }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Runner (Operational)</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="status"
                        value="non-runner"
                        checked={formData.vehicleStatus === 'non-runner'}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehicleStatus: e.target.value as any }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Non-Runner (Requires Repair)</span>
                    </label>
                  </div>
                </div>

                {/* TRM Suitability */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Transport Request Management (TRM) Suitability</h4>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="trm"
                        checked={formData.suitableForTRM === true}
                        onChange={() => setFormData(prev => ({ ...prev, suitableForTRM: true }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Yes - Suitable for TRM</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="trm"
                        checked={formData.suitableForTRM === false}
                        onChange={() => setFormData(prev => ({ ...prev, suitableForTRM: false }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">No - Not suitable for TRM</span>
                    </label>
                  </div>
                </div>

                {/* Service Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Summary & Recommendations
                  </label>
                  <textarea
                    value={formData.serviceNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceNotes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Summary of work performed, issues found, recommendations for future maintenance..."
                  />
                </div>

                {/* Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Maintenance Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Parts/Services: {formData.spareParts.length}</div>
                    <div>Total Cost: ${getTotalCost().toFixed(2)}</div>
                    <div>Mechanic: {formData.mechanicName}</div>
                    <div>Provider: {formData.provider === 'custom' ? formData.customProvider : formData.provider}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                Cancel
              </button>
              
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToStep(currentStep + 1)}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <WrenchScrewdriverIcon className="h-4 w-4" />
                      <span>Complete Maintenance</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalMaintenanceModal;
