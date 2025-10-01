/**
 * Fleet Export Button Component
 * Professional export menu for fleet data
 */

import { useState } from 'react';
import { DocumentArrowDownIcon, DocumentTextIcon, TableCellsIcon, CodeBracketIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { exportFleetToPDF, exportFleetToExcel, exportFleetToJSON, exportFleetToText } from '../utils/fleetExporter';

interface FleetExportButtonProps {
  fleet: any;
  className?: string;
}

const FleetExportButton = ({ fleet, className = '' }: FleetExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel' | 'json' | 'text') => {
    setIsExporting(true);
    setShowMenu(false);
    
    try {
      switch (format) {
        case 'pdf':
          await exportFleetToPDF(fleet);
          break;
        case 'excel':
          await exportFleetToExcel(fleet);
          break;
        case 'json':
          await exportFleetToJSON(fleet);
          break;
        case 'text':
          await exportFleetToText(fleet);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {isExporting ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export Report</span>
          </>
        )}
      </button>

      {/* Export Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu - Positioned above button */}
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Export Options</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose format for {fleet.plateNumber}</p>
            </div>
            
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
            >
              <DocumentTextIcon className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">PDF Report</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Professional formatted document</div>
              </div>
            </button>
            
            <button
              onClick={() => handleExport('excel')}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
            >
              <TableCellsIcon className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Excel Spreadsheet</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">CSV format (Excel compatible)</div>
              </div>
            </button>
            
            <button
              onClick={() => handleExport('json')}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
            >
              <CodeBracketIcon className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">JSON Data</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Structured data format</div>
              </div>
            </button>
            
            <button
              onClick={() => handleExport('text')}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
            >
              <DocumentIcon className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Text Document</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Plain text format</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FleetExportButton;
