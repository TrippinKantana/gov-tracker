import express from 'express';
import { query, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const handleValidation = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return next();
};

// GET /api/search/global - Global search across all asset types
router.get('/global',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { q: searchQuery, limit = 20 } = req.query;
      
      if (!searchQuery) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const query = searchQuery.toString().toLowerCase();
      
      console.log(`🔍 Global search for: "${query}"`);
      
      const results: any[] = [];

      // Search vehicles (using mock data - in production, these would come from database)
      try {
        const mockVehicles = [
          {
            id: 'VH001',
            plateNumber: 'LBR-001-GOV',
            make: 'Toyota',
            model: 'Hilux',
            year: 2023,
            department: 'Ministry of Health',
            status: 'active',
            lastLocation: 'Ministry of Health HQ'
          },
          {
            id: 'VH002',
            plateNumber: 'LBR-002-GOV',
            make: 'Nissan',
            model: 'Patrol',
            year: 2022,
            department: 'Ministry of Defense',
            status: 'active',
            lastLocation: 'Defense Ministry HQ'
          }
        ];

        const vehicleMatches = mockVehicles.filter(vehicle => 
          vehicle.plateNumber.toLowerCase().includes(query) ||
          vehicle.make.toLowerCase().includes(query) ||
          vehicle.model.toLowerCase().includes(query) ||
          vehicle.department.toLowerCase().includes(query) ||
          vehicle.lastLocation?.toLowerCase().includes(query)
        );

        vehicleMatches.forEach(vehicle => {
          results.push({
            id: vehicle.id,
            name: `${vehicle.make} ${vehicle.model}`,
            type: 'vehicle',
            category: 'Vehicle',
            department: vehicle.department,
            location: vehicle.lastLocation,
            status: vehicle.status,
            plateNumber: vehicle.plateNumber,
            additionalInfo: `${vehicle.year} • ${vehicle.plateNumber}`
          });
        });
      } catch (error) {
        console.warn('Error searching vehicles:', error);
      }

      // Search equipment
      try {
        const mockEquipment = [
          {
            id: 'EQ001',
            name: 'Dell Laptop Computer',
            brand: 'Dell',
            model: 'Latitude 5520',
            serialNumber: 'DL123456789',
            department: 'IT Department',
            status: 'active',
            location: 'IT Office Room 205',
            facilityName: 'Government Technology Center'
          },
          {
            id: 'EQ002',
            name: 'HP Printer',
            brand: 'HP',
            model: 'LaserJet Pro',
            serialNumber: 'HP987654321',
            department: 'Ministry of Health',
            status: 'active',
            location: 'Admin Office',
            facilityName: 'Ministry of Health HQ'
          }
        ];

        const equipmentMatches = mockEquipment.filter(equipment => 
          equipment.name.toLowerCase().includes(query) ||
          equipment.brand.toLowerCase().includes(query) ||
          equipment.model.toLowerCase().includes(query) ||
          equipment.serialNumber.toLowerCase().includes(query) ||
          equipment.department.toLowerCase().includes(query) ||
          equipment.location.toLowerCase().includes(query)
        );

        equipmentMatches.forEach(equipment => {
          results.push({
            id: equipment.id,
            name: equipment.name,
            type: 'equipment',
            category: 'Equipment',
            department: equipment.department,
            location: equipment.location,
            status: equipment.status,
            serialNumber: equipment.serialNumber,
            additionalInfo: `${equipment.brand} ${equipment.model}`
          });
        });
      } catch (error) {
        console.warn('Error searching equipment:', error);
      }

      // Search facilities
      try {
        const mockFacilities = [
          {
            id: 'FAC001',
            name: 'Ministry of Health Headquarters',
            type: 'government_building',
            department: 'Ministry of Health',
            address: '123 Capitol Hill, Monrovia',
            status: 'operational'
          },
          {
            id: 'FAC002',
            name: 'Government Technology Center',
            type: 'office_building',
            department: 'IT Department',
            address: '456 Broad Street, Monrovia',
            status: 'operational'
          }
        ];

        const facilityMatches = mockFacilities.filter(facility => 
          facility.name.toLowerCase().includes(query) ||
          facility.type.toLowerCase().includes(query) ||
          facility.department.toLowerCase().includes(query) ||
          facility.address.toLowerCase().includes(query)
        );

        facilityMatches.forEach(facility => {
          results.push({
            id: facility.id,
            name: facility.name,
            type: 'facility',
            category: 'Facility',
            department: facility.department,
            location: facility.address,
            status: facility.status,
            additionalInfo: facility.type.replace('_', ' ')
          });
        });
      } catch (error) {
        console.warn('Error searching facilities:', error);
      }

      // Search employees
      try {
        const mockEmployees = [
          {
            id: 'EMP001',
            name: 'Dr. Sarah Johnson',
            position: 'Health Administrator',
            department: 'Ministry of Health',
            status: 'active',
            badgeNumber: 'GSA-001'
          },
          {
            id: 'EMP002',
            name: 'General Robert Smith',
            position: 'Defense Administrator',
            department: 'Ministry of Defense',
            status: 'active',
            badgeNumber: 'GSA-008'
          }
        ];

        const employeeMatches = mockEmployees.filter(employee => 
          employee.name.toLowerCase().includes(query) ||
          employee.position.toLowerCase().includes(query) ||
          employee.department.toLowerCase().includes(query) ||
          employee.badgeNumber.toLowerCase().includes(query)
        );

        employeeMatches.forEach(employee => {
          results.push({
            id: employee.id,
            name: employee.name,
            type: 'employee',
            category: 'Employee',
            department: employee.department,
            location: employee.position,
            status: employee.status,
            additionalInfo: `Badge: ${employee.badgeNumber}`
          });
        });
      } catch (error) {
        console.warn('Error searching employees:', error);
      }

      // Sort results by relevance (exact matches first, then partial matches)
      const sortedResults = results.sort((a, b) => {
        const aExactMatch = a.name.toLowerCase() === query || a.plateNumber?.toLowerCase() === query || a.serialNumber?.toLowerCase() === query;
        const bExactMatch = b.name.toLowerCase() === query || b.plateNumber?.toLowerCase() === query || b.serialNumber?.toLowerCase() === query;
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Then sort by type priority: vehicles > equipment > facilities > employees
        const typePriority = { vehicle: 1, equipment: 2, facility: 3, employee: 4 };
        return (typePriority[a.type as keyof typeof typePriority] || 5) - (typePriority[b.type as keyof typeof typePriority] || 5);
      });

      // Limit results
      const limitedResults = sortedResults.slice(0, Number(limit));

      console.log(`📊 Search results: ${limitedResults.length} matches found`);

      return res.json({
        success: true,
        results: limitedResults,
        total: limitedResults.length,
        query: searchQuery,
        searchTime: Date.now()
      });

    } catch (error) {
      console.error('Global search error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Search failed' 
      });
    }
  }
);

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions',
  [
    query('q').optional().isString(),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { q } = req.query;
      
      // Common search suggestions based on the application
      const suggestions = [
        'Toyota Hilux',
        'Ministry of Health',
        'Dell Computer',
        'Government Building',
        'LBR-001-GOV',
        'Active Vehicles',
        'Equipment Maintenance',
        'Dr. Sarah Johnson',
        'Monrovia',
        'GSA-001'
      ];

      let filteredSuggestions = suggestions;
      
      if (q) {
        const query = q.toString().toLowerCase();
        filteredSuggestions = suggestions.filter(suggestion => 
          suggestion.toLowerCase().includes(query)
        );
      }

      return res.json({
        success: true,
        suggestions: filteredSuggestions.slice(0, 10)
      });

    } catch (error) {
      console.error('Search suggestions error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get suggestions' 
      });
    }
  }
);

export default router;
