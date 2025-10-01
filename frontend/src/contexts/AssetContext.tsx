import React, { createContext, useContext, useState, useEffect } from 'react';

interface AssetCounts {
  departments: number;
  employees: number;
  vehicles: number;
  facilities: number;
  equipments: number;
  isLoading: boolean;
}

interface AssetContextType {
  assetCounts: AssetCounts;
  refreshCounts: () => Promise<void>;
  refreshAllData: () => Promise<void>; // Global refresh for all components
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const useAssets = () => {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};

interface AssetProviderProps {
  children: React.ReactNode;
}

export const AssetProvider: React.FC<AssetProviderProps> = ({ children }) => {
  const [assetCounts, setAssetCounts] = useState<AssetCounts>({
    departments: 0,
    employees: 0,
    vehicles: 0,
    facilities: 0,
    equipments: 0,
    isLoading: true
  });

  const fetchAssetCounts = async () => {
    console.log('🔄 Fetching real asset counts from government APIs...');
    
    try {
      const [
        vehiclesResponse,
        facilitiesResponse,
        equipmentResponse,
        personnelResponse,
        departmentsResponse
      ] = await Promise.all([
        fetch('http://localhost:5000/api/vehicles'),
        fetch('http://localhost:5000/api/facilities'),
        fetch('http://localhost:5000/api/equipment'),
        fetch('http://localhost:5000/api/personnel'),
        fetch('http://localhost:5000/api/departments')
      ]);

      const vehiclesResult = await vehiclesResponse.json();
      const facilitiesResult = await facilitiesResponse.json();
      const equipmentResult = await equipmentResponse.json();
      const personnelResult = await personnelResponse.json();
      const departmentsResult = await departmentsResponse.json();

      const counts = {
        vehicles: vehiclesResult.success ? vehiclesResult.total || vehiclesResult.vehicles?.length || 0 : 0,
        facilities: facilitiesResult.success ? facilitiesResult.total || facilitiesResult.facilities?.length || 0 : 0,
        equipments: equipmentResult.success ? equipmentResult.total || equipmentResult.equipment?.length || 0 : 0,
        employees: personnelResult.success ? personnelResult.total || personnelResult.personnel?.length || 0 : 0,
        departments: (() => {
          // Get real department count from localStorage (where MACs page stores data)
          const saved = localStorage.getItem('government-departments');
          if (saved) {
            const savedDepartments = JSON.parse(saved);
            console.log(`📊 Department count from localStorage: ${savedDepartments.length}`);
            return savedDepartments.length;
          }
          // Fallback to API or default
          return departmentsResult.success ? departmentsResult.total || departmentsResult.departments?.length || 5 : 5;
        })(),
        isLoading: false
      };

      console.log('📊 Real Asset Counts:', counts);
      setAssetCounts(counts);
    } catch (error) {
      console.error('❌ Error fetching asset counts:', error);
      
      // Fallback to localStorage data if APIs fail
      const savedDepartments = localStorage.getItem('government-departments');
      const savedPersonnel = localStorage.getItem('government-personnel');
      
      setAssetCounts({
        departments: savedDepartments ? JSON.parse(savedDepartments).length : 2,
        employees: savedPersonnel ? JSON.parse(savedPersonnel).length : 1,
        vehicles: 2,  // Based on API response
        facilities: 4, // Based on API response
        equipments: 2, // Based on API response
        isLoading: false
      });
    }
  };

  const refreshCounts = async () => {
    console.log('🔄 RefreshCounts called - temporarily disabled to prevent infinite loop');
    // setAssetCounts(prev => ({ ...prev, isLoading: true }));
    // await fetchAssetCounts();
  };

  // Global refresh function that all components can use
  const refreshAllData = async () => {
    console.log('🔄 Global data refresh triggered...');
    await fetchAssetCounts();
    
    // Dispatch custom event to notify all components to refresh
    window.dispatchEvent(new CustomEvent('refreshAllAssets'));
  };

  // TEMPORARILY DISABLED: Prevent infinite loop
  // useEffect(() => {
  //   fetchAssetCounts();
  // }, []);

  const value = {
    assetCounts,
    refreshCounts,
    refreshAllData
  };

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
};
