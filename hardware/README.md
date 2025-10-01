# Hardware Integration Documentation

## Overview

This directory contains integration code for various tracking hardware used in the Government Asset Tracking Platform:

1. **BW32 GPS Tracker** - Primary vehicle/asset GPS tracking device
2. **LoRaWAN Sensors** - Long-range, low-power asset monitoring 
3. **Bluetooth Beacons** - Short-range asset proximity detection

## Hardware Specifications

### BW32 GPS Tracker
- **Model**: Benway BW32 Mini GPS Tracker
- **Positioning**: GPS, Beidou, AGPS (5-10m accuracy)
- **Connectivity**: 2G/4G GSM, GPRS (850/900/1800/1900 MHz)
- **Power**: 9-40V input, 55mAh battery backup
- **Weight**: 30g compact design
- **Features**:
  - Real-time positioning with -159dBm GPS sensitivity
  - Remote engine cutoff capability
  - SOS emergency alerts with voice monitoring
  - Geo-fence boundary alerts
  - ACC ignition detection
  - Over-speed warnings
  - Historical route playback

### LoRaWAN Network
- **Range**: Up to 10-15km in rural areas, 2-5km urban
- **Battery Life**: 2-10 years depending on transmission frequency
- **Use Cases**: 
  - Remote facility monitoring
  - Equipment in areas without cellular coverage
  - Long-term asset deployment
  - Environmental sensors

### Bluetooth Integration
- **Range**: 10-100m depending on class
- **Use Cases**:
  - Indoor asset tracking
  - Proximity-based check-in/out
  - Short-range device pairing
  - Warehouse inventory management

## Data Flow Architecture

```
BW32 Tracker → 2G/4G Network → Hardware API → PostgreSQL
LoRaWAN Sensor → LoRaWAN Gateway → Hardware API → PostgreSQL  
Bluetooth Beacon → Mobile App/Gateway → Hardware API → PostgreSQL
```

All hardware data is processed through standardized API endpoints and stored in the PostgreSQL database with PostGIS for geospatial indexing.

## Integration Files

- `bw32-integration.ts` - BW32 GPS tracker communication protocol
- `lorawan-gateway.ts` - LoRaWAN network gateway interface
- `bluetooth-handler.ts` - Bluetooth device management
- `hardware-protocols.ts` - Common protocols and message parsing
- `device-manager.ts` - Device registration and lifecycle management
