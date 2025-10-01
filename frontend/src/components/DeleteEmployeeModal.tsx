import { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: {
    id: string;
    fullName: string;
    badgeNumber: string;
    department: string;
    position?: string;
    assignedAssets?: number;
  } | null;
}

const DeleteEmployeeModal = ({ isOpen, onClose, onSuccess, employee }: DeleteEmployeeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDelete = async () => {
    if (!employee) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employee.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Employee deleted successfully');
        onSuccess();
        onClose();
      } else {
        throw new Error(result.message || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Employee</h2>
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
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this government employee? This action cannot be undone.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Employee:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{employee.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Badge Number:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{employee.badgeNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Department:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{employee.department}</span>
                  </div>
                  {employee.position && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Position:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{employee.position}</span>
                    </div>
                  )}
                  {employee.assignedAssets && employee.assignedAssets > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Assigned Assets:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{employee.assignedAssets} items</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Critical Warning</h4>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Deleting this government employee will permanently remove:
                    </p>
                    <ul className="text-sm text-red-600 dark:text-red-400 mt-2 list-disc list-inside space-y-1">
                      <li>Employee account and login credentials</li>
                      <li>Asset assignment history and records</li>
                      <li>Department access and role permissions</li>
                      <li>Contact information and emergency contacts</li>
                      <li>Employment history and performance data</li>
                    </ul>
                    {employee.assignedAssets && employee.assignedAssets > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                        ⚠️ This employee has {employee.assignedAssets} assigned assets that will need to be reassigned.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Deleting...' : 'Delete Employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteEmployeeModal;
