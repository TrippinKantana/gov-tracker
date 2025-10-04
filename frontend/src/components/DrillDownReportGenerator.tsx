/**
 * Drill-Down Report Generator
 * Professional granular reporting: MAC → Facility → Category → Specific Item → Report Type → Time Range
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
  CubeIcon,
  XMarkIcon,
  CheckIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { isDepartmentAdmin, hasValidMACAssignment } from '../utils/departmentFilter';

interface DrillDownReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportSelection {
  macId: string;
  macName: string;
  facilityId: string;
  facilityName: string;
  category: 'fleet' | 'assets' | 'facilities' | 'stock';
  specificItemId: string;
  specificItemName: string;
  reportType: string;
  timeRange: 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'previous_years' | 'custom';
  customStartDate: string;
  customEndDate: string;
  exportFormat: 'pdf' | 'excel' | 'csv';
}

const DrillDownReportGenerator = ({ isOpen, onClose }: DrillDownReportGeneratorProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data sources
  const [availableMACs, setAvailableMACs] = useState<any[]>([]);
  const [availableFacilities, setAvailableFacilities] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  
  const [selection, setSelection] = useState<ReportSelection>({
    macId: '',
    macName: '',
    facilityId: '',
    facilityName: '',
    category: 'fleet',
    specificItemId: '',
    specificItemName: '',
    reportType: '',
    timeRange: 'this_month',
    customStartDate: '',
    customEndDate: ''
  });

  // Initialize for MAC admin users
  useEffect(() => {
    if (isDepartmentAdmin(user) && hasValidMACAssignment(user)) {
      const userMAC = availableMACs.find(mac => mac.name === user?.department);
      if (userMAC) {
        setSelection(prev => ({ 
          ...prev, 
          macId: userMAC.id, 
          macName: userMAC.name 
        }));
        setCurrentStep(2); // Skip MAC selection for department admins
      }
    }
  }, [user, availableMACs]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadMACs();
    }
  }, [isOpen]);

  const loadMACs = async () => {
    try {
      const response = await fetch('/api/departments');
      const result = await response.json();
      if (result.success) {
        setAvailableMACs(result.departments);
      }
    } catch (error) {
      console.error('Error loading MACs:', error);
    }
  };

  const loadFacilities = async (macName: string) => {
    try {
      const response = await fetch('/api/facilities');
      const result = await response.json();
      if (result.success) {
        const filtered = result.facilities.filter((f: any) => f.department === macName);
        setAvailableFacilities(filtered);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
    }
  };

  const loadSpecificItems = async (category: string, macName: string, facilityId?: string) => {
    try {
      let endpoint = '';
      switch (category) {
        case 'fleet':
          endpoint = '/api/vehicles';
          break;
        case 'assets':
          endpoint = '/api/equipment';
          break;
        case 'facilities':
          endpoint = '/api/facilities';
          break;
        case 'personnel':
          endpoint = '/api/personnel';
          break;
      }

      const response = await fetch(endpoint);
      const result = await response.json();
      
      if (result.success) {
        let items = result[category] || result.vehicles || result.equipment || result.facilities || result.personnel || [];
        
        // Filter by MAC
        items = items.filter((item: any) => item.department === macName);
        
        // Filter by facility if specified
        if (facilityId && category !== 'facilities') {
          items = items.filter((item: any) => item.facilityId === facilityId);
        }
        
        setAvailableItems(items);
      }
    } catch (error) {
      console.error('Error loading specific items:', error);
    }
  };

  const getReportTypesForCategory = (category: string) => {
    switch (category) {
      case 'fleet':
        return [
          { id: 'maintenance', label: 'Maintenance History', description: 'Service records, parts replaced, costs' },
          { id: 'usage', label: 'Usage Report', description: 'Mileage, routes, utilization' },
          { id: 'purchase', label: 'Purchase History', description: 'Acquisition, depreciation, value' },
          { id: 'fuel', label: 'Fuel Consumption', description: 'Fuel usage, efficiency, costs' }
        ];
      case 'assets':
        return [
          { id: 'assignment', label: 'Assignment History', description: 'Who used it, when, where' },
          { id: 'condition', label: 'Condition Report', description: 'Maintenance, repairs, status' },
          { id: 'usage', label: 'Usage Logs', description: 'Utilization, performance data' },
          { id: 'purchase', label: 'Purchase History', description: 'Acquisition, warranty, value' }
        ];
      case 'facilities':
        return [
          { id: 'equipment', label: 'Equipment List', description: 'All equipment in facility' },
          { id: 'usage', label: 'Resource Usage', description: 'Capacity utilization, bookings' },
          { id: 'condition', label: 'Condition Report', description: 'Maintenance, installations' },
          { id: 'security', label: 'Security Report', description: 'Access logs, incidents' }
        ];
      case 'personnel':
        return [
          { id: 'assignments', label: 'Assignment History', description: 'Asset assignments, responsibilities' },
          { id: 'attendance', label: 'Attendance Report', description: 'Work schedule, presence' },
          { id: 'activity', label: 'Activity Logs', description: 'System usage, actions performed' },
          { id: 'clearance', label: 'Clearance Report', description: 'Security clearance, access rights' }
        ];
      default:
        return [];
    }
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2: return selection.macId !== '';
      case 3: return selection.facilityId !== '' || selection.category === 'facilities';
      case 4: return selection.category !== '';
      case 5: return selection.specificItemId !== '';
      case 6: return selection.reportType !== '';
      default: return true;
    }
  };

  const generateDrillDownReport = async () => {
    setIsGenerating(true);
    try {
      console.log('📊 Generating drill-down report:', selection);
      
      const reportRequest = {
        ...selection,
        generatedBy: user?.name || user?.email,
        generatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/reports/drill-down', {
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
        a.download = `${selection.specificItemName}-${selection.reportType}-report.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Drill-down report generated');
        onClose();
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('❌ Error generating drill-down report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
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
                <FunnelIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Drill-Down Report Generator</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generate detailed reports for specific items</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Progress Breadcrumb */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm">
              <span className={currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}>MAC</span>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              <span className={currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}>Facility</span>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              <span className={currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}>Category</span>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              <span className={currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}>Specific Item</span>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              <span className={currentStep >= 5 ? 'text-blue-600' : 'text-gray-400'}>Report Type</span>
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
              <span className={currentStep >= 6 ? 'text-blue-600' : 'text-gray-400'}>Time Range</span>
            </div>
            
            {/* Current Selection Display */}
            {selection.macName && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Selected:</span>
                {selection.macName && <span className="ml-2">{selection.macName}</span>}
                {selection.facilityName && <span className="ml-1">→ {selection.facilityName}</span>}
                {selection.category && <span className="ml-1">→ {selection.category.charAt(0).toUpperCase() + selection.category.slice(1)}</span>}
                {selection.specificItemName && <span className="ml-1">→ {selection.specificItemName}</span>}
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Step 1: Select MAC */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select MAC Unit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableMACs
                    .filter(mac => {
                      if (isDepartmentAdmin(user) && hasValidMACAssignment(user)) {
                        return mac.name === user?.department;
                      }
                      return true;
                    })
                    .map(mac => (
                      <button
                        key={mac.id}
                        onClick={() => {
                          setSelection(prev => ({ ...prev, macId: mac.id, macName: mac.name }));
                          loadFacilities(mac.name);
                          setCurrentStep(2);
                        }}
                        className="p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{mac.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{mac.code}</div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Facility */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Facility</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose specific facility or select "All Facilities"</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setSelection(prev => ({ ...prev, facilityId: 'all', facilityName: 'All Facilities' }));
                      setCurrentStep(3);
                    }}
                    className="p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">All Facilities</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Include all facilities in {selection.macName}</div>
                  </button>
                  
                  {availableFacilities.map(facility => (
                    <button
                      key={facility.id}
                      onClick={() => {
                        setSelection(prev => ({ ...prev, facilityId: facility.id, facilityName: facility.name }));
                        setCurrentStep(3);
                      }}
                      className="p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{facility.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{facility.type.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500 mt-1">{facility.address}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Select Category */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'fleet', label: 'Fleet', icon: TruckIcon, description: 'Individual vehicle reports' },
                    { id: 'assets', label: 'Assets', icon: ComputerDesktopIcon, description: 'Individual equipment reports' },
                    { id: 'facilities', label: 'Facilities', icon: BuildingOfficeIcon, description: 'Individual facility reports' },
                    { id: 'stock', label: 'Stock', icon: CubeIcon, description: 'Individual stock item reports' }
                  ].map(category => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelection(prev => ({ ...prev, category: category.id as any }));
                          loadSpecificItems(category.id, selection.macName, selection.facilityId !== 'all' ? selection.facilityId : undefined);
                          setCurrentStep(4);
                        }}
                        className="p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <div className="font-medium text-gray-900 dark:text-white">{category.label}</div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{category.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Select Specific Item */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Select Specific {selection.category.charAt(0).toUpperCase() + selection.category.slice(1)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose the exact item you want to generate a report for
                </p>
                
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {availableItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No {selection.category} items found in {selection.facilityName}
                    </div>
                  ) : (
                    availableItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          const itemName = item.plateNumber || item.name || item.fullName || item.id;
                          setSelection(prev => ({ 
                            ...prev, 
                            specificItemId: item.id, 
                            specificItemName: itemName 
                          }));
                          setCurrentStep(5);
                        }}
                        className="p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {selection.category === 'fleet' && `${item.year} ${item.make} ${item.model}`}
                              {selection.category === 'assets' && item.name}
                              {selection.category === 'facilities' && item.name}
                              {selection.category === 'personnel' && item.fullName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {selection.category === 'fleet' && `Plate: ${item.plateNumber}`}
                              {selection.category === 'assets' && `Serial: ${item.serialNumber}`}
                              {selection.category === 'facilities' && `Type: ${item.type}`}
                              {selection.category === 'personnel' && `Position: ${item.position}`}
                            </div>
                            {item.gsaCode && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                                {item.gsaCode}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {selection.category === 'fleet' && `${item.mileage || 0} km`}
                            {selection.category === 'assets' && item.condition}
                            {selection.category === 'facilities' && `${item.capacity || 0} capacity`}
                            {selection.category === 'stock' && `Qty: ${item.quantity || 0}`}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Select Report Type */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Select Report Type for "{selection.specificItemName}"
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getReportTypesForCategory(selection.category).map(reportType => (
                    <button
                      key={reportType.id}
                      onClick={() => {
                        setSelection(prev => ({ ...prev, reportType: reportType.id }));
                        setCurrentStep(6);
                      }}
                      className="p-4 text-left border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{reportType.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{reportType.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Select Time Range */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Time Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'this_month', label: 'This Month', description: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) },
                    { id: 'last_month', label: 'Last Month', description: new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long', year: 'numeric' }) },
                    { id: 'this_year', label: 'This Year', description: new Date().getFullYear().toString() },
                    { id: 'last_year', label: 'Last Year', description: (new Date().getFullYear() - 1).toString() },
                    { id: 'previous_years', label: 'Previous Years', description: 'Multi-year historical data' },
                    { id: 'custom', label: 'Custom Range', description: 'Select specific dates' }
                  ].map(timeRange => (
                    <button
                      key={timeRange.id}
                      onClick={() => setSelection(prev => ({ ...prev, timeRange: timeRange.id as any }))}
                      className={`p-4 text-left border-2 rounded-lg transition-colors ${
                        selection.timeRange === timeRange.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{timeRange.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{timeRange.description}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                {selection.timeRange === 'custom' && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={selection.customStartDate}
                          onChange={(e) => setSelection(prev => ({ ...prev, customStartDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={selection.customEndDate}
                          onChange={(e) => setSelection(prev => ({ ...prev, customEndDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Format Selection */}
                {selection.timeRange && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Export Format</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setSelection(prev => ({ ...prev, exportFormat: 'pdf' }))}
                        className={`p-3 text-left border-2 rounded-lg transition-colors ${
                          selection.exportFormat === 'pdf'
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">📄 PDF</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Professional layout, print-ready</div>
                      </button>
                      <button
                        onClick={() => setSelection(prev => ({ ...prev, exportFormat: 'excel' }))}
                        className={`p-3 text-left border-2 rounded-lg transition-colors ${
                          selection.exportFormat === 'excel'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">📊 Excel</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Editable spreadsheet format</div>
                      </button>
                      <button
                        onClick={() => setSelection(prev => ({ ...prev, exportFormat: 'csv' }))}
                        className={`p-3 text-left border-2 rounded-lg transition-colors ${
                          selection.exportFormat === 'csv'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">📋 CSV</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Universal data format</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Report Summary */}
                {selection.timeRange && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Summary</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div><strong>Item:</strong> {selection.specificItemName}</div>
                      <div><strong>Report:</strong> {getReportTypesForCategory(selection.category).find(r => r.id === selection.reportType)?.label}</div>
                      <div><strong>Period:</strong> {selection.timeRange === 'custom' ? `${selection.customStartDate} to ${selection.customEndDate}` : selection.timeRange.replace('_', ' ')}</div>
                      <div><strong>Location:</strong> {selection.macName} {selection.facilityName !== 'All Facilities' ? `→ ${selection.facilityName}` : ''}</div>
                      <div><strong>Format:</strong> {selection.exportFormat.toUpperCase()} {selection.exportFormat === 'pdf' ? '📄' : selection.exportFormat === 'excel' ? '📊' : '📋'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1 || (currentStep === 2 && isDepartmentAdmin(user))}
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
              
              {currentStep < 6 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToStep(currentStep + 1)}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={generateDrillDownReport}
                  disabled={isGenerating || !selection.timeRange}
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

export default DrillDownReportGenerator;
