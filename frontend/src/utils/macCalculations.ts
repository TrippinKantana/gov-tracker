/**
 * MAC Asset Count Calculations
 * Calculate real asset counts from actual data
 */

export interface AssetCounts {
  employeeCount: number
  vehicleCount: number
  facilityCount: number
  equipmentCount: number
}

/**
 * Calculate real asset counts for a MAC from actual data
 */
export const calculateMACAssetCounts = async (macId: string, macName: string): Promise<AssetCounts> => {
  try {
    console.log(`📊 Calculating real counts for MAC: ${macName} (${macId})`);
    
    // Fetch real data from APIs
    const [vehiclesResponse, facilitiesResponse, equipmentResponse, employeesResponse] = await Promise.all([
      fetch('/api/vehicles').catch(() => ({ ok: false })),
      fetch('/api/facilities').catch(() => ({ ok: false })),
      fetch('/api/equipment').catch(() => ({ ok: false })),
      fetch('/api/employees').catch(() => ({ ok: false }))
    ]);

    let vehicleCount = 0;
    let facilityCount = 0;
    let equipmentCount = 0;
    let employeeCount = 0;

    // Count vehicles assigned to this MAC
    if (vehiclesResponse.ok) {
      const vehicles = await vehiclesResponse.json();
      vehicleCount = vehicles.filter((v: any) => 
        v.department === macName || v.departmentId === macId
      ).length;
    }

    // Count facilities assigned to this MAC
    if (facilitiesResponse.ok) {
      const facilities = await facilitiesResponse.json();
      facilityCount = facilities.filter((f: any) => 
        f.department === macName || f.departmentId === macId
      ).length;
    }

    // Count equipment assigned to this MAC
    if (equipmentResponse.ok) {
      const equipment = await equipmentResponse.json();
      equipmentCount = equipment.filter((e: any) => 
        e.department === macName || e.departmentId === macId
      ).length;
    }

    // Count employees assigned to this MAC
    if (employeesResponse.ok) {
      const employees = await employeesResponse.json();
      employeeCount = employees.filter((e: any) => 
        e.department === macName || e.departmentId === macId
      ).length;
    }

    const counts = { employeeCount, vehicleCount, facilityCount, equipmentCount };
    console.log(`📊 Real counts for ${macName}:`, counts);
    
    return counts;

  } catch (error) {
    console.error(`❌ Error calculating counts for MAC ${macName}:`, error);
    
    // Fallback to zero counts if API fails
    return {
      employeeCount: 0,
      vehicleCount: 0,
      facilityCount: 0,
      equipmentCount: 0
    };
  }
};

/**
 * Update MAC with real asset counts
 */
export const updateMACWithRealCounts = async (mac: any) => {
  const realCounts = await calculateMACAssetCounts(mac.id, mac.name);
  
  return {
    ...mac,
    employeeCount: realCounts.employeeCount,
    vehicleCount: realCounts.vehicleCount,
    facilityCount: realCounts.facilityCount,
    equipmentCount: realCounts.equipmentCount
  };
};

/**
 * Refresh all MAC counts from real data
 */
export const refreshAllMACCounts = async (macs: any[]) => {
  console.log('🔄 Refreshing all MAC counts from real API data...');
  
  const updatedMACs = await Promise.all(
    macs.map(mac => updateMACWithRealCounts(mac))
  );
  
  console.log('✅ All MAC counts refreshed');
  return updatedMACs;
};
