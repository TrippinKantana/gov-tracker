import express from 'express';

const router = express.Router();

// Get tracking data for assets
router.get('/:assetId', async (req: express.Request, res: express.Response) => {
  try {
    const { assetId } = req.params;
    
    // Mock tracking data - replace with database query
    const trackingData = [
      {
        timestamp: new Date().toISOString(),
        location: { latitude: 6.2907, longitude: -10.7969 },
        speed: 0,
        batteryLevel: 85,
        status: 'parked'
      }
    ];
    
    res.json({ success: true, assetId, trackingData });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
