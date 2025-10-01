import { useState, useEffect } from 'react';
import { PlusIcon, WrenchScrewdriverIcon, ClipboardDocumentCheckIcon, XMarkIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

interface MaintenanceRecord {
  id: string;
  facilityId: string;
  type: 'inspection' | 'maintenance' | 'repair' | 'security_audit' | 'safety_check';
  title: string;
  description: string;
  date: string;
  inspector: string;
  inspectorId?: string;
  status: 'scheduled' | 'completed' | 'overdue' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  findings?: string;
  actions?: string[];
  nextDueDate?: string;
  cost?: number;
  vendor?: string;
  notes?: string;
  attachments?: string[];
}

interface FacilityMaintenanceManagerProps {
  facilityId: string;
  facilityName: string;
  onMaintenanceUpdate: () => void;
}

const FacilityMaintenanceManager = ({ facilityId, facilityName, onMaintenanceUpdate }: FacilityMaintenanceManagerProps) => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'inspection' as const,
    title: '',
    description: '',
    date: '',
    inspector: '',
    status: 'scheduled' as const,
    priority: 'medium' as const,
    findings: '',
    actions: [] as string[],
    cost: 0,
    vendor: '',
    notes: ''
  });

  const maintenanceTypes = [
    { value: 'inspection', label: 'Facility Inspection', icon: '🔍' },
    { value: 'maintenance', label: 'Routine Maintenance', icon: '🔧' },
    { value: 'repair', label: 'Repair Work', icon: '🛠️' },
    { value: 'security_audit', label: 'Security Audit', icon: '🛡️' },
    { value: 'safety_check', label: 'Safety Check', icon: '⚠️' }
  ];

  const inspectorList = [
    'GSA Facility Inspector',
    'Security Audit Team',
    'Maintenance Contractor',
    'Safety Officer',
    'External Auditor',
    'Other'
  ];

  useEffect(() => {
    fetchMaintenanceRecords();
  }, [facilityId]);

  const fetchMaintenanceRecords = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with real API call
      const mockRecords: MaintenanceRecord[] = [
        {
          id: 'FM001',
          facilityId,
          type: 'inspection',
          title: 'Annual Safety Inspection',
          description: 'Comprehensive annual safety and compliance inspection',
          date: '2024-01-15',
          inspector: 'GSA Facility Inspector',
          status: 'completed',
          priority: 'high',
          findings: 'All safety systems operational. Minor issues with emergency lighting in east wing.',
          actions: ['Replace emergency lights', 'Update evacuation signs'],
          nextDueDate: '2025-01-15',
          cost: 1250.00,
          vendor: 'GSA Maintenance Services'
        },
        {
          id: 'FM002',
          facilityId,
          type: 'security_audit',
          title: 'Quarterly Security Review',
          description: 'Security systems and access control review',
          date: '2024-02-01',
          inspector: 'Security Audit Team',
          status: 'completed',
          priority: 'medium',
          findings: 'Access control systems functioning properly. Recommend updating visitor management system.',
          actions: ['Upgrade visitor badges', 'Review access logs'],
          cost: 0
        }
      ];
      
      setMaintenanceRecords(mockRecords);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMaintenanceRecord = async () => {
    try {
      const newMaintenanceRecord: MaintenanceRecord = {
        id: `FM${String(maintenanceRecords.length + 1).padStart(3, '0')}`,
        facilityId,
        ...newRecord,
        actions: newRecord.actions.filter(action => action.trim() !== '')
      };

      // Mock API call - replace with real implementation
      setMaintenanceRecords(prev => [newMaintenanceRecord, ...prev]);
      
      setShowAddModal(false);
      setNewRecord({
        type: 'inspection',
        title: '',
        description: '',
        date: '',
        inspector: '',
        status: 'scheduled',
        priority: 'medium',
        findings: '',
        actions: [],
        cost: 0,
        vendor: '',
        notes: ''
      });
      
      onMaintenanceUpdate();
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
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getNextInspectionInfo = () => {
    const completedInspections = maintenanceRecords.filter(r => r.status === 'completed' && r.type === 'inspection');
    if (completedInspections.length === 0) return null;

    const lastInspection = completedInspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const daysSinceInspection = Math.floor((Date.now() - new Date(lastInspection.date).getTime()) / (1000 * 60 * 60 * 24));
    
    // Standard government facility inspection intervals (annual for most facilities)
    const daysUntilNextInspection = Math.max(0, 365 - daysSinceInspection);

    return {
      lastInspection,
      daysSinceInspection,
      daysUntilNextInspection,
      isOverdue: daysUntilNextInspection === 0
    };
  };

  const nextInspectionInfo = getNextInspectionInfo();

  const addNewAction = () => {
    setNewRecord(prev => ({ ...prev, actions: [...prev.actions, ''] }));
  };

  const updateAction = (index: number, value: string) => {
    setNewRecord(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => i === index ? value : action)
    }));
  };

  const removeAction = (index: number) => {
    setNewRecord(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Inspection Schedule Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inspection Schedule</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Record</span>
          </button>
        </div>

        {nextInspectionInfo ? (
          <div className={`rounded-lg p-6 ${nextInspectionInfo.isOverdue ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'}`}>
            <div className="text-center mb-4">
              <p className={`text-3xl font-bold ${nextInspectionInfo.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {nextInspectionInfo.isOverdue ? 'OVERDUE' : `${nextInspectionInfo.daysUntilNextInspection} days`}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {nextInspectionInfo.isOverdue ? 'Facility inspection required' : 'Next facility inspection'}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {nextInspectionInfo.lastInspection.date ? new Date(nextInspectionInfo.lastInspection.date).toLocaleDateString() : 'Never'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Inspection</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {nextInspectionInfo.daysSinceInspection} days
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Since Inspection</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">Annual</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inspection Cycle</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 text-center">
            <ClipboardDocumentCheckIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">No Inspection History</h4>
            <p className="text-gray-600 dark:text-gray-400">Add the first inspection record to start tracking facility maintenance</p>
          </div>
        )}
      </div>

      {/* Maintenance History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Maintenance & Inspection History</h3>
        
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
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-2">
                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{record.title}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>
                            {record.priority}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{record.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Date:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Inspector:</span>
                            <p className="font-medium text-gray-900 dark:text-white">{record.inspector}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Type:</span>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {record.type.replace('_', ' ')}
                            </p>
                          </div>
                          {record.cost && record.cost > 0 && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                ${record.cost.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {record.findings && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Findings:</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.findings}</p>
                          </div>
                        )}
                        
                        {record.actions && record.actions.length > 0 && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Actions taken:</span>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {record.actions.map((action, index) => (
                                <li key={index} className="text-sm text-gray-600 dark:text-gray-400">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {record.notes && (
                          <div>
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
            <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">No Maintenance Records</h4>
            <p className="text-gray-600 dark:text-gray-400">Add maintenance and inspection records to track facility history</p>
          </div>
        )}
      </div>

      {/* Add Maintenance Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddModal(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Maintenance Record</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Record facility maintenance or inspection for {facilityName}</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maintenance Type
                    </label>
                    <select
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {maintenanceTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
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
                    Title
                  </label>
                  <input
                    type="text"
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                    placeholder="e.g., Annual Safety Inspection"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    placeholder="Brief description of the maintenance or inspection"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inspector/Technician
                    </label>
                    <select
                      value={newRecord.inspector}
                      onChange={(e) => setNewRecord({ ...newRecord, inspector: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select inspector</option>
                      {inspectorList.map(inspector => (
                        <option key={inspector} value={inspector}>{inspector}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={newRecord.status}
                      onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={newRecord.priority}
                      onChange={(e) => setNewRecord({ ...newRecord, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {(newRecord.status === 'completed' || newRecord.status === 'failed') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Findings
                    </label>
                    <textarea
                      value={newRecord.findings}
                      onChange={(e) => setNewRecord({ ...newRecord, findings: e.target.value })}
                      placeholder="What was found during the inspection/maintenance?"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actions Taken
                    </label>
                    <button
                      type="button"
                      onClick={addNewAction}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add Action</span>
                    </button>
                  </div>
                  {newRecord.actions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={action}
                        onChange={(e) => updateAction(index, e.target.value)}
                        placeholder="Action taken or required"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      Vendor/Service Provider
                    </label>
                    <input
                      type="text"
                      value={newRecord.vendor}
                      onChange={(e) => setNewRecord({ ...newRecord, vendor: e.target.value })}
                      placeholder="Company or person who performed work"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={newRecord.notes}
                    onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                    placeholder="Any additional notes or comments"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addMaintenanceRecord}
                    disabled={!newRecord.title || !newRecord.date || !newRecord.inspector}
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

export default FacilityMaintenanceManager;
