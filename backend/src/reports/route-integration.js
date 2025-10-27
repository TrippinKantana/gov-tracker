/**
 * Example route integration for beautiful pdfmake reports
 * Replace your existing report routes with this
 */

const express = require('express');
const PdfMakeReportGenerator = require('./pdfmake-generator');

const router = express.Router();

// Initialize the beautiful report generator
const reportGenerator = new PdfMakeReportGenerator({ pool: null }); // Replace with your DB pool

/**
 * Generate beautiful PDF report
 * GET /api/reports/generate?type=fleet&mac=Ministry of Health
 */
router.get('/generate', async (req, res) => {
  try {
    const {
      type = 'fleet',
      mac = 'All Departments',
      facility = 'All Facilities',
      period = 'year_to_date',
      generatedBy = 'System User'
    } = req.query;

    // Prepare filters
    const filters = {
      macId: null,
      facilityId: null,
      reportType: type,
      reportPeriod: period,
      customStartDate: null,
      customEndDate: null,
      reportMode: 'summary',
      includeInactive: false,
      macName: mac,
      facilityName: facility,
      dateRange: { label: 'Year to Date 2025' },
      generatedBy: generatedBy
    };

    console.log('🎨 Generating beautiful report:', { type, mac, facility });

    // Generate the beautiful PDF
    const pdfDoc = await reportGenerator.generateReport(filters);
    
    // Set response headers
    const filename = `beautiful-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the PDF to the client
    pdfDoc.pipe(res);
    pdfDoc.end();
    
    console.log('✅ Beautiful PDF generated successfully:', filename);
    
  } catch (error) {
    console.error('❌ Error generating beautiful PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * Generate comprehensive report (all categories)
 * GET /api/reports/comprehensive
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const {
      mac = 'All Departments',
      facility = 'All Facilities',
      period = 'year_to_date',
      generatedBy = 'System User'
    } = req.query;

    const filters = {
      macId: null,
      facilityId: null,
      reportType: 'all',
      reportPeriod: period,
      customStartDate: null,
      customEndDate: null,
      reportMode: 'summary',
      includeInactive: false,
      macName: mac,
      facilityName: facility,
      dateRange: { label: 'Year to Date 2025' },
      generatedBy: generatedBy
    };

    console.log('🎨 Generating comprehensive beautiful report');

    const pdfDoc = await reportGenerator.generateReport(filters);
    
    const filename = `beautiful-comprehensive-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    pdfDoc.pipe(res);
    pdfDoc.end();
    
    console.log('✅ Comprehensive beautiful PDF generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating comprehensive PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive report',
      message: error.message
    });
  }
});

/**
 * Get available report types
 * GET /api/reports/types
 */
router.get('/types', (req, res) => {
  res.json({
    success: true,
    types: [
      {
        id: 'fleet',
        name: 'Fleet Report',
        description: 'Vehicle inventory and status'
      },
      {
        id: 'assets',
        name: 'Assets Report',
        description: 'Equipment and furniture inventory'
      },
      {
        id: 'stock',
        name: 'Stock Report',
        description: 'Inventory and supplies'
      },
      {
        id: 'facilities',
        name: 'Facilities Report',
        description: 'Building and facility status'
      },
      {
        id: 'all',
        name: 'Comprehensive Report',
        description: 'All categories combined'
      }
    ]
  });
});

module.exports = router;
