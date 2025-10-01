/**
 * Comprehensive Report Generator
 * Supports filtering, multiple categories, and time-based reporting
 */

import { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon, 
  CalendarIcon, 
  FunnelIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ComputerDesktopIcon,
  BuildingOfficeIcon,
  UsersIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { isDepartmentAdmin, hasValidMACAssignment } from '../utils/departmentFilter';

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportFilters {
  macId: string;
  facilityId: string;
  reportType: 'fleet' | 'assets' | 'facilities' | 'personnel' | 'all';
  reportPeriod: 'current_month' | 'last_month' | 'ytd' | 'last_year' | 'custom' | 'previous_years';
  customStartDate: string;
  customEndDate: string;
  reportMode: 'full' | 'filtered';
  includeInactive: boolean;
}

const ReportGenerator = ({ isOpen, onClose }: ReportGeneratorProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [availableMACs, setAvailableMACs] = useState<any[]>([]);
  const [availableFacilities, setAvailableFacilities] = useState<any[]>([]);
  const [macCounts, setMacCounts] = useState<Record<string, any>>({});
  
  const [filters, setFilters] = useState<ReportFilters>({
    macId: '',
    facilityId: '',
    reportType: 'fleet',
    reportPeriod: 'current_month',
    customStartDate: '',
    customEndDate: '',
    reportMode: 'filtered',
    includeInactive: false
  });

  // Initialize filters for MAC admin users
  useEffect(() => {
    if (isDepartmentAdmin(user) && hasValidMACAssignment(user)) {
      // Auto-select MAC for department admin
      const userMAC = availableMACs.find(mac => mac.name === user?.department);
      if (userMAC) {
        setFilters(prev => ({ ...prev, macId: userMAC.id }));
      }
    }
  }, [user, availableMACs]);

  // Load MACs and Facilities
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
    }
  }, [isOpen]);

  const loadDropdownData = async () => {
    try {
      // Load MACs
      const macsResponse = await fetch('/api/departments');
      if (macsResponse.ok) {
        const macsData = await macsResponse.json();
        if (macsData.success) {
          setAvailableMACs(macsData.departments);
          
          // Load real counts for each MAC
          await loadMACCounts(macsData.departments);
        }
      }

      // Load Facilities
      const facilitiesResponse = await fetch('/api/facilities');
      if (facilitiesResponse.ok) {
        const facilitiesData = await facilitiesResponse.json();
        if (facilitiesData.success) {
          setAvailableFacilities(facilitiesData.facilities);
        }
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const loadMACCounts = async (macs: any[]) => {
    try {
      console.log('🔢 Loading real counts for MACs...');
      const counts: Record<string, any> = {};

      // Load all data once
      const [vehiclesRes, facilitiesRes, equipmentRes, personnelRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/facilities'),
        fetch('/api/equipment'),
        fetch('/api/personnel')
      ]);

      const vehiclesData = vehiclesRes.ok ? (await vehiclesRes.json()).vehicles || [] : [];
      const facilitiesData = facilitiesRes.ok ? (await facilitiesRes.json()).facilities || [] : [];
      const equipmentData = equipmentRes.ok ? (await equipmentRes.json()).equipment || [] : [];
      const personnelData = personnelRes.ok ? (await personnelRes.json()).personnel || [] : [];

      console.log('📊 API Data loaded:', {
        vehicles: vehiclesData.length,
        facilities: facilitiesData.length,
        equipment: equipmentData.length,
        personnel: personnelData.length
      });

      // Calculate counts for each MAC
      macs.forEach(mac => {
        const fleetCount = vehiclesData.filter((v: any) => v.department === mac.name).length;
        const facilitiesCount = facilitiesData.filter((f: any) => f.department === mac.name).length;
        const assetsCount = equipmentData.filter((e: any) => e.department === mac.name).length;
        const personnelCount = personnelData.filter((p: any) => p.department === mac.name).length;
        
        counts[mac.id] = {
          fleet: fleetCount,
          facilities: facilitiesCount,
          assets: assetsCount,
          personnel: personnelCount
        };
        
        console.log(`📊 ${mac.name} real counts:`, {
          fleet: fleetCount,
          facilities: facilitiesCount,
          assets: assetsCount,
          personnel: personnelCount
        });
      });

      setMacCounts(counts);
      console.log('✅ MAC counts loaded:', counts);
    } catch (error) {
      console.error('Error loading MAC counts:', error);
    }
  };

  const getFilteredFacilities = () => {
    if (!filters.macId) return [];
    const selectedMAC = availableMACs.find(mac => mac.id === filters.macId);
    if (!selectedMAC) return [];
    
    return availableFacilities.filter(facility => 
      facility.department === selectedMAC.name
    );
  };

  const getDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (filters.reportPeriod) {
      case 'current_month':
        return {
          start: new Date(year, month, 1),
          end: new Date(year, month + 1, 0),
          label: `${now.toLocaleString('default', { month: 'long' })} ${year}`
        };
      case 'last_month':
        const lastMonth = month === 0 ? 11 : month - 1;
        const lastMonthYear = month === 0 ? year - 1 : year;
        return {
          start: new Date(lastMonthYear, lastMonth, 1),
          end: new Date(lastMonthYear, lastMonth + 1, 0),
          label: `${new Date(lastMonthYear, lastMonth).toLocaleString('default', { month: 'long' })} ${lastMonthYear}`
        };
      case 'ytd':
        return {
          start: new Date(year, 0, 1),
          end: now,
          label: `Year to Date ${year}`
        };
      case 'last_year':
        return {
          start: new Date(year - 1, 0, 1),
          end: new Date(year - 1, 11, 31),
          label: `${year - 1} Full Year`
        };
      case 'custom':
        return {
          start: new Date(filters.customStartDate),
          end: new Date(filters.customEndDate),
          label: `${filters.customStartDate} to ${filters.customEndDate}`
        };
      default:
        return {
          start: new Date(year, month, 1),
          end: new Date(year, month + 1, 0),
          label: 'Current Month'
        };
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const dateRange = getDateRange();
      const selectedMAC = availableMACs.find(mac => mac.id === filters.macId);
      const selectedFacility = availableFacilities.find(f => f.id === filters.facilityId);
      
      const reportRequest = {
        ...filters,
        macName: selectedMAC?.name,
        facilityName: selectedFacility?.name,
        dateRange,
        generatedBy: user?.name || user?.email,
        generatedAt: new Date().toISOString()
      };

      console.log('📊 Generating report with filters:', reportRequest);

      // Generate report via API  
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportRequest)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filters.reportType}-report-${dateRange.label.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Report generated successfully');
        onClose();
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2: return filters.macId !== '';
      case 3: return filters.reportType !== '';
      case 4: return filters.reportPeriod !== '';
      case 5: return filters.reportMode !== '';
      default: return true;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'fleet': return <TruckIcon className="h-5 w-5" />;
      case 'assets': return <ComputerDesktopIcon className="h-5 w-5" />;
      case 'facilities': return <BuildingOfficeIcon className="h-5 w-5" />;
      case 'personnel': return <UsersIcon className="h-5 w-5" />;
      default: return <ClipboardDocumentListIcon className="h-5 w-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 rounded-lg p-2">
                <DocumentArrowDownIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Report Generator</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate comprehensive government asset reports</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {currentStep > step ? <CheckIcon className="h-4 w-4" /> : step}
                  </div>
                  {step < 5 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep}: {
                currentStep === 1 ? 'Select MAC' :
                currentStep === 2 ? 'Select Facility (Optional)' :
                currentStep === 3 ? 'Choose Report Type' :
                currentStep === 4 ? 'Select Time Period' :
                'Configure & Generate'
              }
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6">
            {/* Step 1: MAC Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select MAC Unit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableMACs.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      Loading MACs...
                    </div>
                  ) : (
                    availableMACs
                      .filter(mac => {
                        // If MAC admin, only show their MAC
                        if (isDepartmentAdmin(user) && hasValidMACAssignment(user)) {
                          return mac.name === user?.department;
                        }
                        return true;
                      })
                      .map(mac => (
                        <button
                          key={mac.id}
                          onClick={() => setFilters(prev => ({ ...prev, macId: mac.id }))}
                          className={`p-4 text-left border-2 rounded-lg transition-colors ${
                            filters.macId === mac.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{mac.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{mac.code}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {macCounts[mac.id] ? (
                              <>
                                {macCounts[mac.id].fleet} Fleet • {macCounts[mac.id].facilities} Facilities • 
                                {macCounts[mac.id].assets} Assets • {macCounts[mac.id].personnel} Personnel
                              </>
                            ) : (
                              'Loading counts...'
                            )}
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Facility Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Facility (Optional)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select a specific facility to narrow the report scope, or skip for all facilities
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, facilityId: '' }))}
                    className={`p-4 text-left border-2 rounded-lg transition-colors ${
                      filters.facilityId === ''
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">All Facilities</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Include data from all facilities</div>
                  </button>
                  
                  {getFilteredFacilities().map(facility => (
                    <button
                      key={facility.id}
                      onClick={() => setFilters(prev => ({ ...prev, facilityId: facility.id }))}
                      className={`p-4 text-left border-2 rounded-lg transition-colors ${
                        filters.facilityId === facility.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{facility.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{facility.type.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{facility.address}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Report Type */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose Report Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'fleet', label: 'Fleet Report', icon: TruckIcon, description: 'Vehicle details, maintenance, usage' },
                    { id: 'assets', label: 'Assets Report', icon: ComputerDesktopIcon, description: 'Equipment inventory, condition, assignments' },
                    { id: 'facilities', label: 'Facilities Report', icon: BuildingOfficeIcon, description: 'Building details, capacity, equipment' },
                    { id: 'personnel', label: 'Personnel Report', icon: UsersIcon, description: 'Staff details, roles, assignments' },
                    { id: 'all', label: 'Comprehensive Report', icon: ClipboardDocumentListIcon, description: 'All categories combined' }
                  ].map(type => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setFilters(prev => ({ ...prev, reportType: type.id as any }))}
                        className={`p-4 text-left border-2 rounded-lg transition-colors ${
                          filters.reportType === type.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <div className="font-medium text-gray-900 dark:text-white">{type.label}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{type.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Time Period */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Report Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'current_month', label: 'Current Month', description: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) },
                    { id: 'last_month', label: 'Last Month', description: new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long', year: 'numeric' }) },
                    { id: 'ytd', label: 'Year-to-Date', description: `January 1 - ${new Date().toLocaleDateString()}` },
                    { id: 'last_year', label: 'Last Year', description: `${new Date().getFullYear() - 1} Full Year` },
                    { id: 'custom', label: 'Custom Date Range', description: 'Select specific start and end dates' },
                    { id: 'previous_years', label: 'Previous Years', description: 'Multi-year historical report' }
                  ].map(period => (
                    <button
                      key={period.id}
                      onClick={() => setFilters(prev => ({ ...prev, reportPeriod: period.id as any }))}
                      className={`p-4 text-left border-2 rounded-lg transition-colors ${
                        filters.reportPeriod === period.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{period.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{period.description}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                {filters.reportPeriod === 'custom' && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={filters.customStartDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={filters.customEndDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Report Configuration */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configure Report</h3>
                
                {/* Report Mode */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Report Mode</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, reportMode: 'filtered' }))}
                      className={`p-4 text-left border-2 rounded-lg transition-colors ${
                        filters.reportMode === 'filtered'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">Filtered Report</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Based on applied filters</div>
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, reportMode: 'full' }))}
                      className={`p-4 text-left border-2 rounded-lg transition-colors ${
                        filters.reportMode === 'full'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">Full Report</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">All available data</div>
                    </button>
                  </div>
                </div>

                {/* Additional Options */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Additional Options</h4>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.includeInactive}
                      onChange={(e) => setFilters(prev => ({ ...prev, includeInactive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Include inactive/retired items</span>
                  </label>
                </div>

                {/* Report Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div><strong>MAC:</strong> {availableMACs.find(m => m.id === filters.macId)?.name || 'Not selected'}</div>
                    <div><strong>Facility:</strong> {filters.facilityId ? availableFacilities.find(f => f.id === filters.facilityId)?.name : 'All facilities'}</div>
                    <div><strong>Type:</strong> {filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)} Report</div>
                    <div><strong>Period:</strong> {getDateRange().label}</div>
                    <div><strong>Mode:</strong> {filters.reportMode === 'full' ? 'Full Report' : 'Filtered Report'}</div>
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
              
              {currentStep < 5 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToStep(currentStep + 1)}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      <span>Generate Report</span>
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

export default ReportGenerator;
