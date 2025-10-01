import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SuccessConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  details?: {
    label: string;
    value: string;
  }[];
  actionLabel?: string;
  onAction?: () => void;
}

const SuccessConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  details = [], 
  actionLabel,
  onAction 
}: SuccessConfirmationDialogProps) => {
  if (!isOpen) return null;

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-2">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
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
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            
            {/* Details */}
            {details.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-3">Created Successfully</h4>
                <div className="space-y-2">
                  {details.map((detail, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-green-700 dark:text-green-400">{detail.label}:</span>
                      <span className="font-medium text-green-900 dark:text-green-300">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">Success!</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    The record has been added to the government asset tracking system and is now available for monitoring and management.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
            {actionLabel && (
              <button
                onClick={handleAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessConfirmationDialog;
