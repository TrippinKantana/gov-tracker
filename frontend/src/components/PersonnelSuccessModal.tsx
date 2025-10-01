/**
 * Personnel Success Confirmation Modal
 * Custom success dialog for personnel creation
 */

import { XMarkIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';

interface PersonnelSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: {
    fullName: string;
    email?: string;
    phone?: string;
    position: string;
    department: string;
    badgeNumber: string;
  } | null;
}

const PersonnelSuccessModal = ({ isOpen, onClose, personnel }: PersonnelSuccessModalProps) => {
  if (!isOpen || !personnel) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 rounded-lg p-2">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Personnel Added Successfully
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    New government personnel registered
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-3">
                <UserIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {personnel.fullName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {personnel.position} • {personnel.department}
                </p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                    Personnel Successfully Created
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    {personnel.fullName} has been added to the government personnel system and is now available for asset assignments.
                  </p>
                </div>
              </div>
            </div>

            {/* Personnel Details */}
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name:</span>
                <span className="text-sm text-gray-900 dark:text-white">{personnel.fullName}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Badge Number:</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">{personnel.badgeNumber}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Position:</span>
                <span className="text-sm text-gray-900 dark:text-white">{personnel.position}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Department:</span>
                <span className="text-sm text-gray-900 dark:text-white">{personnel.department}</span>
              </div>
              
              {personnel.email && (
                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{personnel.email}</span>
                </div>
              )}
              
              {personnel.phone && (
                <div className="flex justify-between py-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{personnel.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
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

export default PersonnelSuccessModal;
