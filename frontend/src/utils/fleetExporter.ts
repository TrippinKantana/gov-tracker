/**
 * Fleet Export Utility
 * Professional export functionality for fleet data
 */

// Note: Install these packages for production:
// npm install jspdf html2canvas xlsx file-saver

interface FleetData {
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
  currentOperator?: string;
  fuelLevel?: number;
  mileage?: number;
  lastLocation?: string;
  gpsTrackerId?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  // Additional client fields
  serialNumber?: string;
  gsaCode?: string;
  engineNumber?: string;
  powerRating?: string;
  fuelType?: string;
  donor?: string;
  location?: string;
  assignment?: string;
  cost?: number;
  lifeCycle?: string;
  runningHours?: string;
  entryDate?: string;
  enteredBy?: string;
  registrationDate?: string;
}

/**
 * Generate Professional PDF Report
 */
export const exportFleetToPDF = async (fleet: FleetData): Promise<void> => {
  try {
    // Create PDF content as HTML (since we can't import jsPDF in this demo)
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fleet Report - ${fleet.plateNumber}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #1f2937;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 10px;
          }
          .title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .subtitle { 
            color: #6b7280; 
            font-size: 14px;
          }
          .section { 
            margin: 25px 0; 
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 15px;
            padding: 10px;
            background: #f3f4f6;
            border-left: 4px solid #2563eb;
          }
          .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px;
          }
          .field { 
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
          }
          .field-label { 
            font-weight: 600; 
            color: #374151; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .field-value { 
            font-size: 14px; 
            margin-top: 4px;
            color: #1f2937;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-active { background: #dcfce7; color: #166534; }
          .status-maintenance { background: #fef3c7; color: #92400e; }
          .status-parked { background: #dbeafe; color: #1e40af; }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏛️ GOVERNMENT OF LIBERIA</div>
          <div class="logo">General Services Agency</div>
          <div class="title">Fleet Information Report</div>
          <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Fleet Identification</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Plate Number</div>
              <div class="field-value">${fleet.plateNumber}</div>
            </div>
            <div class="field">
              <div class="field-label">GSA Code</div>
              <div class="field-value">${fleet.gsaCode || 'Not assigned'}</div>
            </div>
            <div class="field">
              <div class="field-label">VIN Number</div>
              <div class="field-value">${fleet.vinNumber || 'Not specified'}</div>
            </div>
            <div class="field">
              <div class="field-label">Serial Number</div>
              <div class="field-value">${fleet.serialNumber || 'Not specified'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Fleet Specifications</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Make & Model</div>
              <div class="field-value">${fleet.year} ${fleet.make} ${fleet.model}</div>
            </div>
            <div class="field">
              <div class="field-label">Type</div>
              <div class="field-value">${fleet.vehicleType}</div>
            </div>
            <div class="field">
              <div class="field-label">Color</div>
              <div class="field-value">${fleet.color || 'Not specified'}</div>
            </div>
            <div class="field">
              <div class="field-label">Engine Number</div>
              <div class="field-value">${fleet.engineNumber || 'Not specified'}</div>
            </div>
            <div class="field">
              <div class="field-label">Power Rating</div>
              <div class="field-value">${fleet.powerRating || 'Not specified'}</div>
            </div>
            <div class="field">
              <div class="field-label">Fuel Type</div>
              <div class="field-value">${fleet.fuelType || 'Not specified'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Assignment & Status</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Assigned MAC</div>
              <div class="field-value">${fleet.department}</div>
            </div>
            <div class="field">
              <div class="field-label">Current Operator</div>
              <div class="field-value">${fleet.currentOperator || 'Available'}</div>
            </div>
            <div class="field">
              <div class="field-label">Status</div>
              <div class="field-value">
                <span class="status-badge status-${fleet.status.toLowerCase()}">${fleet.status}</span>
              </div>
            </div>
            <div class="field">
              <div class="field-label">Current Location</div>
              <div class="field-value">${fleet.location || fleet.lastLocation || 'Not specified'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Financial & Procurement</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Cost/Value</div>
              <div class="field-value">$${fleet.cost?.toLocaleString() || 'Not specified'}</div>
            </div>
            <div class="field">
              <div class="field-label">Donor/Funding</div>
              <div class="field-value">${fleet.donor || 'Government Budget'}</div>
            </div>
            <div class="field">
              <div class="field-label">Life Cycle</div>
              <div class="field-value">${fleet.lifeCycle || 'Not specified'}</div>
            </div>
            <div class="field">
              <div class="field-label">Registration Date</div>
              <div class="field-value">${fleet.registrationDate ? new Date(fleet.registrationDate).toLocaleDateString() : 'Not specified'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Maintenance & Usage</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Current Mileage</div>
              <div class="field-value">${fleet.mileage?.toLocaleString() || 'Not recorded'} km</div>
            </div>
            <div class="field">
              <div class="field-label">Running Hours</div>
              <div class="field-value">${fleet.runningHours || 'Not recorded'}</div>
            </div>
            <div class="field">
              <div class="field-label">Fuel Level</div>
              <div class="field-value">${fleet.fuelLevel || 0}%</div>
            </div>
            <div class="field">
              <div class="field-label">Last Maintenance</div>
              <div class="field-value">${fleet.lastMaintenance ? new Date(fleet.lastMaintenance).toLocaleDateString() : 'Not recorded'}</div>
            </div>
            <div class="field">
              <div class="field-label">Next Maintenance</div>
              <div class="field-value">${fleet.nextMaintenance ? new Date(fleet.nextMaintenance).toLocaleDateString() : 'Not scheduled'}</div>
            </div>
            <div class="field">
              <div class="field-label">GPS Tracker</div>
              <div class="field-value">${fleet.gpsTrackerId || 'Not installed'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Administrative Records</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Entry Date</div>
              <div class="field-value">${fleet.entryDate ? new Date(fleet.entryDate).toLocaleDateString() : 'Not recorded'}</div>
            </div>
            <div class="field">
              <div class="field-label">Entered By</div>
              <div class="field-value">${fleet.enteredBy || 'Not recorded'}</div>
            </div>
            <div class="field">
              <div class="field-label">Fleet ID</div>
              <div class="field-value">${fleet.id}</div>
            </div>
            <div class="field">
              <div class="field-label">Assignment</div>
              <div class="field-value">${fleet.assignment || 'General use'}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p><strong>CONFIDENTIAL GOVERNMENT DOCUMENT</strong></p>
          <p>General Services Agency • Government of Liberia</p>
          <p>Generated by: ${fleet.enteredBy || 'System'} • Report ID: ${fleet.id}-${Date.now()}</p>
        </div>
      </body>
      </html>
    `;

    // Create and download PDF (simplified for demo)
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fleet-Report-${fleet.plateNumber}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Fleet PDF report generated:', fleet.plateNumber);
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
};

/**
 * Export Fleet Data to Excel
 */
export const exportFleetToExcel = async (fleet: FleetData): Promise<void> => {
  try {
    // Create Excel data structure
    const excelData = [
      ['GOVERNMENT OF LIBERIA - GENERAL SERVICES AGENCY'],
      ['Fleet Information Report'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [''],
      
      // Fleet Identification
      ['FLEET IDENTIFICATION'],
      ['Plate Number', fleet.plateNumber],
      ['GSA Code', fleet.gsaCode || 'Not assigned'],
      ['VIN Number', fleet.vinNumber || 'Not specified'],
      ['Serial Number', fleet.serialNumber || 'Not specified'],
      ['Fleet ID', fleet.id],
      [''],
      
      // Specifications
      ['FLEET SPECIFICATIONS'],
      ['Make', fleet.make],
      ['Model', fleet.model],
      ['Year', fleet.year.toString()],
      ['Type', fleet.vehicleType],
      ['Color', fleet.color || 'Not specified'],
      ['Engine Number', fleet.engineNumber || 'Not specified'],
      ['Power Rating', fleet.powerRating || 'Not specified'],
      ['Fuel Type', fleet.fuelType || 'Not specified'],
      [''],
      
      // Assignment
      ['ASSIGNMENT & STATUS'],
      ['Assigned MAC', fleet.department],
      ['Current Operator', fleet.currentOperator || 'Available'],
      ['Status', fleet.status],
      ['Location', fleet.location || fleet.lastLocation || 'Not specified'],
      ['Assignment', fleet.assignment || 'General use'],
      [''],
      
      // Financial
      ['FINANCIAL INFORMATION'],
      ['Cost/Value', fleet.cost ? `$${fleet.cost.toLocaleString()}` : 'Not specified'],
      ['Donor/Funding', fleet.donor || 'Government Budget'],
      ['Life Cycle', fleet.lifeCycle || 'Not specified'],
      [''],
      
      // Maintenance
      ['MAINTENANCE & USAGE'],
      ['Current Mileage', fleet.mileage ? `${fleet.mileage.toLocaleString()} km` : 'Not recorded'],
      ['Running Hours', fleet.runningHours || 'Not recorded'],
      ['Fuel Level', `${fleet.fuelLevel || 0}%`],
      ['Last Maintenance', fleet.lastMaintenance ? new Date(fleet.lastMaintenance).toLocaleDateString() : 'Not recorded'],
      ['Next Maintenance', fleet.nextMaintenance ? new Date(fleet.nextMaintenance).toLocaleDateString() : 'Not scheduled'],
      ['GPS Tracker ID', fleet.gpsTrackerId || 'Not installed'],
      [''],
      
      // Administrative
      ['ADMINISTRATIVE RECORDS'],
      ['Entry Date', fleet.entryDate ? new Date(fleet.entryDate).toLocaleDateString() : 'Not recorded'],
      ['Entered By', fleet.enteredBy || 'Not recorded'],
      ['Registration Date', fleet.registrationDate ? new Date(fleet.registrationDate).toLocaleDateString() : 'Not specified'],
      [''],
      
      // Footer
      ['REPORT INFORMATION'],
      ['Generated By', fleet.enteredBy || 'System'],
      ['Report Date', new Date().toLocaleDateString()],
      ['Report Time', new Date().toLocaleTimeString()],
      ['Report ID', `${fleet.id}-${Date.now()}`],
      [''],
      ['⚠️ CONFIDENTIAL GOVERNMENT DOCUMENT'],
      ['General Services Agency • Government of Liberia']
    ];

    // Convert to CSV format for download (Excel compatible)
    const csvContent = excelData.map(row => 
      Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : `"${row}"`
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fleet-Data-${fleet.plateNumber}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Fleet Excel report generated:', fleet.plateNumber);
  } catch (error) {
    console.error('❌ Error generating Excel:', error);
    throw error;
  }
};

/**
 * Export Fleet Data to JSON
 */
export const exportFleetToJSON = async (fleet: FleetData): Promise<void> => {
  try {
    const jsonData = {
      reportMetadata: {
        title: 'Fleet Information Report',
        organization: 'General Services Agency - Government of Liberia',
        generatedDate: new Date().toISOString(),
        reportId: `${fleet.id}-${Date.now()}`,
        confidential: true
      },
      fleetData: fleet
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fleet-JSON-${fleet.plateNumber}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Fleet JSON report generated:', fleet.plateNumber);
  } catch (error) {
    console.error('❌ Error generating JSON:', error);
    throw error;
  }
};

/**
 * Export Fleet Data to Text
 */
export const exportFleetToText = async (fleet: FleetData): Promise<void> => {
  try {
    const textContent = `
GOVERNMENT OF LIBERIA
GENERAL SERVICES AGENCY
Fleet Information Report

Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
Report ID: ${fleet.id}-${Date.now()}

===========================================
FLEET IDENTIFICATION
===========================================
Plate Number:      ${fleet.plateNumber}
GSA Code:          ${fleet.gsaCode || 'Not assigned'}
VIN Number:        ${fleet.vinNumber || 'Not specified'}
Serial Number:     ${fleet.serialNumber || 'Not specified'}
Fleet ID:          ${fleet.id}

===========================================
FLEET SPECIFICATIONS  
===========================================
Make:              ${fleet.make}
Model:             ${fleet.model}
Year:              ${fleet.year}
Type:              ${fleet.vehicleType}
Color:             ${fleet.color || 'Not specified'}
Engine Number:     ${fleet.engineNumber || 'Not specified'}
Power Rating:      ${fleet.powerRating || 'Not specified'}
Fuel Type:         ${fleet.fuelType || 'Not specified'}

===========================================
ASSIGNMENT & STATUS
===========================================
Assigned MAC:      ${fleet.department}
Current Operator:  ${fleet.currentOperator || 'Available'}
Status:            ${fleet.status}
Location:          ${fleet.location || fleet.lastLocation || 'Not specified'}
Assignment:        ${fleet.assignment || 'General use'}

===========================================
FINANCIAL INFORMATION
===========================================
Cost/Value:        $${fleet.cost?.toLocaleString() || 'Not specified'}
Donor/Funding:     ${fleet.donor || 'Government Budget'}
Life Cycle:        ${fleet.lifeCycle || 'Not specified'}

===========================================
MAINTENANCE & USAGE
===========================================
Current Mileage:   ${fleet.mileage?.toLocaleString() || 'Not recorded'} km
Running Hours:     ${fleet.runningHours || 'Not recorded'}
Fuel Level:        ${fleet.fuelLevel || 0}%
Last Maintenance:  ${fleet.lastMaintenance ? new Date(fleet.lastMaintenance).toLocaleDateString() : 'Not recorded'}
Next Maintenance:  ${fleet.nextMaintenance ? new Date(fleet.nextMaintenance).toLocaleDateString() : 'Not scheduled'}
GPS Tracker ID:    ${fleet.gpsTrackerId || 'Not installed'}

===========================================
ADMINISTRATIVE RECORDS
===========================================
Entry Date:        ${fleet.entryDate ? new Date(fleet.entryDate).toLocaleDateString() : 'Not recorded'}
Entered By:        ${fleet.enteredBy || 'Not recorded'}
Registration Date: ${fleet.registrationDate ? new Date(fleet.registrationDate).toLocaleDateString() : 'Not specified'}

===========================================
REPORT INFORMATION
===========================================
Generated By:      ${fleet.enteredBy || 'System'}
Report Date:       ${new Date().toLocaleDateString()}
Report Time:       ${new Date().toLocaleTimeString()}

⚠️  CONFIDENTIAL GOVERNMENT DOCUMENT
General Services Agency • Government of Liberia
    `;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fleet-Report-${fleet.plateNumber}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Fleet text report generated:', fleet.plateNumber);
  } catch (error) {
    console.error('❌ Error generating text report:', error);
    throw error;
  }
};

/**
 * Show export options menu
 */
export const showExportMenu = (fleet: FleetData, anchorElement: HTMLElement): void => {
  const menu = document.createElement('div');
  menu.className = 'fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2';
  menu.style.minWidth = '200px';
  
  // Position menu near the anchor element
  const rect = anchorElement.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.top = `${rect.bottom + 5}px`;

  menu.innerHTML = `
    <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2" data-format="pdf">
      <span>📄</span><span>Export as PDF</span>
    </button>
    <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2" data-format="excel">
      <span>📊</span><span>Export as Excel</span>
    </button>
    <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2" data-format="json">
      <span>🔧</span><span>Export as JSON</span>
    </button>
    <button class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2" data-format="text">
      <span>📝</span><span>Export as Text</span>
    </button>
  `;

  document.body.appendChild(menu);

  // Handle clicks
  menu.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button');
    if (!button) return;

    const format = button.getAttribute('data-format');
    document.body.removeChild(menu);

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
      alert(`Export failed: ${error.message}`);
    }
  });

  // Close menu when clicking outside
  const closeMenu = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 100);
};
