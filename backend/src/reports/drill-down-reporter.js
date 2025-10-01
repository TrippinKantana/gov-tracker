/**
 * Drill-Down Report Generator
 * Generates detailed reports for specific individual items
 */

const PDFDocument = require('pdfkit');
const fetch = require('node-fetch');

class DrillDownReporter {
  constructor() {}

  /**
   * Generate drill-down report for specific item
   */
  async generateReport(selection) {
    const {
      macName,
      facilityName,
      category,
      specificItemId,
      specificItemName,
      reportType,
      timeRange,
      customStartDate,
      customEndDate
    } = selection;

    console.log('📊 Generating drill-down report for:', specificItemName, reportType);

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Add header
    this.addReportHeader(doc, {
      title: `${this.getReportTypeTitle(reportType)} Report`,
      subtitle: `${specificItemName} - ${macName}`,
      facility: facilityName !== 'All Facilities' ? facilityName : null,
      period: this.formatTimeRange(timeRange, customStartDate, customEndDate),
      generatedAt: new Date().toLocaleString()
    });

    // Generate specific report content
    await this.generateSpecificReport(doc, selection);

    // Finalize document
    doc.end();
    return doc;
  }

  /**
   * Add professional government header
   */
  addReportHeader(doc, info) {
    // Government Header
    doc.fontSize(18)
       .text('Republic of Liberia', 50, 50, { align: 'center' })
       .fontSize(14)
       .text('General Services Agency', 50, 75, { align: 'center' })
       .fontSize(12)
       .text('Asset Tracking & Management System', 50, 95, { align: 'center' });

    // Add horizontal line
    doc.moveTo(50, 120)
       .lineTo(550, 120)
       .stroke();

    // Report Title
    doc.fontSize(16)
       .text(info.title, 50, 140, { align: 'center' })
       .fontSize(12)
       .text(info.subtitle, 50, 165, { align: 'center' });

    if (info.facility) {
      doc.fontSize(10)
         .text(`Facility: ${info.facility}`, 50, 185, { align: 'center' });
    }

    // Report Details
    const startY = 210;
    doc.fontSize(10)
       .text(`Report Period: ${info.period}`, 50, startY)
       .text(`Generated On: ${info.generatedAt}`, 50, startY + 15)
       .text(`Report ID: RPT-${Date.now()}`, 50, startY + 30);

    // Add another line
    doc.moveTo(50, startY + 50)
       .lineTo(550, startY + 50)
       .stroke();

    return startY + 70; // Return Y position for content
  }

  /**
   * Generate specific report content based on category and type
   */
  async generateSpecificReport(doc, selection) {
    const { category, reportType, specificItemId } = selection;
    let currentY = 290;

    switch (category) {
      case 'fleet':
        await this.generateFleetSpecificReport(doc, selection, currentY);
        break;
      case 'assets':
        await this.generateAssetSpecificReport(doc, selection, currentY);
        break;
      case 'facilities':
        await this.generateFacilitySpecificReport(doc, selection, currentY);
        break;
      case 'personnel':
        await this.generatePersonnelSpecificReport(doc, selection, currentY);
        break;
    }
  }

  /**
   * Generate fleet-specific reports
   */
  async generateFleetSpecificReport(doc, selection, startY) {
    const { reportType, specificItemId } = selection;
    let currentY = startY;

    switch (reportType) {
      case 'maintenance':
        await this.generateMaintenanceHistory(doc, specificItemId, currentY);
        break;
      case 'usage':
        await this.generateUsageReport(doc, specificItemId, currentY);
        break;
      case 'purchase':
        await this.generatePurchaseHistory(doc, specificItemId, currentY);
        break;
      case 'fuel':
        await this.generateFuelConsumption(doc, specificItemId, currentY);
        break;
    }
  }

  /**
   * Generate maintenance history for specific vehicle
   */
  async generateMaintenanceHistory(doc, vehicleId, startY) {
    let currentY = startY;

    doc.fontSize(14)
       .text('MAINTENANCE HISTORY', 50, currentY);
    
    currentY += 30;

    try {
      // Fetch real maintenance data
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}/maintenance`);
      const result = await response.json();
      
      if (result.success && result.maintenance && result.maintenance.length > 0) {
        const maintenanceRecords = result.maintenance;
        
        // Table headers
        doc.fontSize(10);
        const headers = ['Date', 'Mileage', 'Service Type', 'Cost', 'Provider', 'Status'];
        const columnWidths = [80, 60, 120, 60, 100, 60];
        let startX = 50;

        // Draw headers
        headers.forEach((header, index) => {
          doc.text(header, startX, currentY, { width: columnWidths[index], align: 'center' });
          startX += columnWidths[index];
        });

        currentY += 20;
        
        // Draw header line
        doc.moveTo(50, currentY)
           .lineTo(530, currentY)
           .stroke();

        currentY += 10;

        // Draw maintenance data
        maintenanceRecords.forEach(record => {
          startX = 50;
          const recordData = [
            new Date(record.date).toLocaleDateString(),
            `${record.mileage} km`,
            record.type || 'Service',
            `$${record.cost || 0}`,
            record.provider || 'GSA',
            record.status || 'Completed'
          ];

          recordData.forEach((data, index) => {
            doc.text(data, startX, currentY, { width: columnWidths[index], align: 'center' });
            startX += columnWidths[index];
          });

          currentY += 15;
        });

        // Summary
        currentY += 20;
        const totalCost = maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
        const lastService = maintenanceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        doc.fontSize(12)
           .text(`Total Maintenance Records: ${maintenanceRecords.length}`, 50, currentY)
           .text(`Total Maintenance Cost: $${totalCost.toFixed(2)}`, 50, currentY + 15)
           .text(`Last Service: ${new Date(lastService.date).toLocaleDateString()} at ${lastService.mileage} km`, 50, currentY + 30);
      } else {
        doc.fontSize(12)
           .text('No maintenance records found for this vehicle.', 50, currentY);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      doc.fontSize(12)
         .text('Error loading maintenance data.', 50, currentY);
    }
  }

  /**
   * Generate other report types (placeholder implementations)
   */
  async generateUsageReport(doc, vehicleId, startY) {
    doc.fontSize(14)
       .text('USAGE REPORT', 50, startY)
       .fontSize(12)
       .text('Mileage tracking, route analysis, utilization data', 50, startY + 30)
       .text('(Implementation ready for GPS integration)', 50, startY + 50);
  }

  async generatePurchaseHistory(doc, vehicleId, startY) {
    doc.fontSize(14)
       .text('PURCHASE HISTORY', 50, startY)
       .fontSize(12)
       .text('Acquisition details, depreciation, current value', 50, startY + 30)
       .text('(Implementation ready for financial integration)', 50, startY + 50);
  }

  async generateFuelConsumption(doc, vehicleId, startY) {
    doc.fontSize(14)
       .text('FUEL CONSUMPTION REPORT', 50, startY)
       .fontSize(12)
       .text('Fuel usage patterns, efficiency metrics, cost analysis', 50, startY + 30)
       .text('(Implementation ready for fuel tracking integration)', 50, startY + 50);
  }

  /**
   * Generate asset-specific reports
   */
  async generateAssetSpecificReport(doc, selection, startY) {
    doc.fontSize(14)
       .text(`${selection.reportType.toUpperCase()} REPORT`, 50, startY)
       .fontSize(12)
       .text(`Detailed ${selection.reportType} information for ${selection.specificItemName}`, 50, startY + 30)
       .text('(Asset-specific reporting ready for implementation)', 50, startY + 50);
  }

  /**
   * Generate facility-specific reports
   */
  async generateFacilitySpecificReport(doc, selection, startY) {
    doc.fontSize(14)
       .text(`${selection.reportType.toUpperCase()} REPORT`, 50, startY)
       .fontSize(12)
       .text(`Detailed ${selection.reportType} information for ${selection.specificItemName}`, 50, startY + 30)
       .text('(Facility-specific reporting ready for implementation)', 50, startY + 50);
  }

  /**
   * Generate personnel-specific reports
   */
  async generatePersonnelSpecificReport(doc, selection, startY) {
    doc.fontSize(14)
       .text(`${selection.reportType.toUpperCase()} REPORT`, 50, startY)
       .fontSize(12)
       .text(`Detailed ${selection.reportType} information for ${selection.specificItemName}`, 50, startY + 30)
       .text('(Personnel-specific reporting ready for implementation)', 50, startY + 50);
  }

  /**
   * Utility functions
   */
  getReportTypeTitle(type) {
    return type.toUpperCase().replace('_', ' ');
  }

  formatTimeRange(timeRange, customStart, customEnd) {
    if (!timeRange) return 'All Time';
    
    switch (timeRange) {
      case 'this_month':
        return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'last_month':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'this_year':
        return new Date().getFullYear().toString();
      case 'last_year':
        return (new Date().getFullYear() - 1).toString();
      case 'custom':
        return `${customStart || 'Start'} to ${customEnd || 'End'}`;
      default:
        return typeof timeRange === 'string' ? timeRange.replace('_', ' ') : 'All Time';
    }
  }
}

module.exports = DrillDownReporter;
