/**
 * Test script for pdfmake report generator
 * Generates beautiful PDF reports for demonstration
 */

const PdfMakeReportGenerator = require('./src/reports/pdfmake-generator');
const fs = require('fs');
const path = require('path');

async function testPdfMakeReports() {
  console.log('🚀 Testing pdfmake report generator...');
  
  // Initialize the generator
  const generator = new PdfMakeReportGenerator({ pool: null });
  
  // Test filters
  const testFilters = {
    macId: null,
    facilityId: null,
    reportType: 'fleet',
    reportPeriod: 'year_to_date',
    customStartDate: null,
    customEndDate: null,
    reportMode: 'summary',
    includeInactive: false,
    macName: 'Ministry of Health',
    facilityName: 'Central Hospital',
    dateRange: { label: 'Year to Date 2025' },
    generatedBy: 'cyrus@wearelantern.net'
  };

  try {
    // Generate Fleet Report
    console.log('📊 Generating Fleet Report...');
    const fleetPdf = await generator.generateReport({
      ...testFilters,
      reportType: 'fleet'
    });
    
    // Save to file
    const fleetStream = fs.createWriteStream('beautiful-fleet-report.pdf');
    fleetPdf.pipe(fleetStream);
    fleetPdf.end();
    
    console.log('✅ Fleet Report saved as: beautiful-fleet-report.pdf');
    
    // Generate Assets Report
    console.log('📊 Generating Assets Report...');
    const assetsPdf = await generator.generateReport({
      ...testFilters,
      reportType: 'assets'
    });
    
    const assetsStream = fs.createWriteStream('beautiful-assets-report.pdf');
    assetsPdf.pipe(assetsStream);
    assetsPdf.end();
    
    console.log('✅ Assets Report saved as: beautiful-assets-report.pdf');
    
    // Generate Stock Report
    console.log('📊 Generating Stock Report...');
    const stockPdf = await generator.generateReport({
      ...testFilters,
      reportType: 'stock'
    });
    
    const stockStream = fs.createWriteStream('beautiful-stock-report.pdf');
    stockPdf.pipe(stockStream);
    stockPdf.end();
    
    console.log('✅ Stock Report saved as: beautiful-stock-report.pdf');
    
    // Generate Comprehensive Report
    console.log('📊 Generating Comprehensive Report...');
    const comprehensivePdf = await generator.generateReport({
      ...testFilters,
      reportType: 'all'
    });
    
    const comprehensiveStream = fs.createWriteStream('beautiful-comprehensive-report.pdf');
    comprehensivePdf.pipe(comprehensiveStream);
    comprehensivePdf.end();
    
    console.log('✅ Comprehensive Report saved as: beautiful-comprehensive-report.pdf');
    
    console.log('\n🎉 All reports generated successfully!');
    console.log('📁 Check the backend directory for the PDF files.');
    console.log('\n📋 Generated files:');
    console.log('   • beautiful-fleet-report.pdf');
    console.log('   • beautiful-assets-report.pdf');
    console.log('   • beautiful-stock-report.pdf');
    console.log('   • beautiful-comprehensive-report.pdf');
    
  } catch (error) {
    console.error('❌ Error generating reports:', error);
  }
}

// Run the test
testPdfMakeReports();
