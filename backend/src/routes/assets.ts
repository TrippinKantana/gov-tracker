import express from 'express';

const router = express.Router();

// Get all assets
router.get('/', async (_req: express.Request, res: express.Response) => {
  try {
    // Mock data - replace with database query
    const assets = [
      {
        id: 'VH001',
        name: 'Toyota Hilux - Ministry Transport',
        type: 'vehicle',
        department: 'Ministry of Health',
        assignedTo: 'Dr. Sarah Johnson',
        status: 'active',
        location: { latitude: 6.2907, longitude: -10.7969, address: 'Monrovia Central' },
        lastUpdate: new Date().toISOString()
      }
    ];
    
    res.json({ success: true, assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
