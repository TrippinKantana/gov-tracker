// This is the generateStockReport method to replace generatePersonnelReport

async generateStockReport(doc, filters) {
  let currentY = 290;
  
  doc.fontSize(14)
     .text('STOCK INVENTORY REPORT', 50, currentY);
  
  currentY += 30;

  // Get real stock data from API
  const stockData = await this.fetchStockData(filters);
  
  if (stockData.length === 0) {
    doc.fontSize(12)
       .text('No stock data available for the selected criteria.', 50, currentY);
    return;
  }

  // Table headers
  const headers = ['Item Name', 'SKU', 'Category', 'Quantity', 'Unit', 'Location'];
  const columnWidths = [120, 80, 80, 60, 60, 120];
  let startX = 50;

  // Draw headers
  doc.fontSize(10);
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

  // Draw stock data
  stockData.forEach(item => {
    startX = 50;
    const itemData = [
      item.name || 'N/A',
      item.sku || item.id,
      item.category || 'General',
      (item.quantity || 0).toString(),
      item.unit || 'pcs',
      item.location || filters.macName || 'N/A'
    ];

    itemData.forEach((data, index) => {
      doc.text(data, startX, currentY, { width: columnWidths[index], align: 'center' });
      startX += columnWidths[index];
    });

    currentY += 20;
    
    // Check for page break
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }
  });

  // Summary
  currentY += 20;
  const totalQuantity = stockData.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockItems = stockData.filter(item => (item.quantity || 0) < (item.minimumLevel || 10));
  
  doc.fontSize(12)
     .text(`Total Items: ${stockData.length}`, 50, currentY)
     .text(`Total Quantity: ${totalQuantity}`, 50, currentY + 15)
     .text(`Low Stock Items: ${lowStockItems.length}`, 50, currentY + 30);
}

// And the fetchStockData method:

async fetchStockData(filters) {
  try {
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5000/api/stock/inventory');
    const result = await response.json();
    
    if (result.success && result.stock) {
      let stock = result.stock;
      
      // Filter by MAC/department if specified
      if (filters.macName) {
        stock = stock.filter(s => s.department === filters.macName || s.location === filters.macName);
      }
      
      return stock;
    }
    return [];
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return [];
  }
}
