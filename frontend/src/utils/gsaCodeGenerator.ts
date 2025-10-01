/**
 * GSA Code Generator Utility
 * Generates government asset codes in format: GSA-MAC-Class-Count
 */

export interface GSACodeComponents {
    prefix: string; // Always "GSA"
    macCode: string; // MAC code (MOH, MOJ, etc.)
    classCode: string; // Asset class code
    count: number; // Count for this MAC and class
}

// MAC Codes mapping
export const MAC_CODES = {
    'Ministry of Health': 'MOH',
    'Ministry of Justice': 'MOJ',
    'Ministry of Agriculture': 'MOA',
    'Ministry of Defense': 'MOD',
    'Ministry of Education': 'MOE',
    'General Services Agency': 'GSA',
    'Ministry of Finance': 'MOF',
    'Ministry of Public Works': 'MPW',
    'Ministry of Transport': 'MOT',
    'Ministry of Internal Affairs': 'MIA'
};

// Vehicle Class Codes
export const VEHICLE_CLASS_CODES = {
    'Yellow Machine': '01',
    'Sedan': '02',
    'SUV': '03',
    'Bus': '04',
    'Pickup': '05',
    'Truck': '06',
    'Tractor': '07'
};

// Equipment Class Codes
export const EQUIPMENT_CLASS_CODES = {
    'Computer': '01',
    'Printer': '02',
    'Server': '03',
    'Network Equipment': '04',
    'Audio Visual': '05',
    'Medical Equipment': '06',
    'Laboratory Equipment': '07',
    'Communication Equipment': '08',
    'Security Equipment': '09',
    'Other Equipment': '10'
};

// Furniture Class Codes
export const FURNITURE_CLASS_CODES = {
    'Desk': '01',
    'Chair': '02',
    'Table': '03',
    'Cabinet': '04',
    'Shelf': '05',
    'Sofa': '06',
    'Bed': '07',
    'Storage': '08',
    'Conference Table': '09',
    'Other Furniture': '10'
};

/**
 * Generate GSA Code
 */
export const generateGSACode = (components: GSACodeComponents): string => {
    const { prefix, macCode, classCode, count } = components;
    return `${prefix}-${macCode}-${classCode}-${count.toString().padStart(3, '0')}`;
};

/**
 * Parse GSA Code back to components
 */
export const parseGSACode = (gsaCode: string): GSACodeComponents | null => {
    const parts = gsaCode.split('-');
    if (parts.length !== 4) return null;

    return {
        prefix: parts[0],
        macCode: parts[1],
        classCode: parts[2],
        count: parseInt(parts[3]) || 0
    };
};

/**
 * Get MAC code from MAC name
 */
export const getMACCode = (macName: string): string => {
    return MAC_CODES[macName as keyof typeof MAC_CODES] || '';
};

/**
 * Get vehicle class code from vehicle type
 */
export const getVehicleClassCode = (vehicleType: string): string => {
    // Map common vehicle types to class codes
    const typeMapping: { [key: string]: string } = {
        'car': '02', // Sedan
        'sedan': '02',
        'suv': '03',
        'bus': '04',
        'pickup': '05',
        'truck': '06',
        'van': '05', // Treat as pickup
        'motorcycle': '01', // Treat as Yellow Machine
        'tractor': '07'
    };

    return typeMapping[vehicleType.toLowerCase()] || '02'; // Default to Sedan
};

/**
 * Count actual assets assigned to a MAC by class
 * Returns the REAL count of assets for proper GSA code generation
 */
export const getActualAssetCount = async (
    macName: string,
    assetType: 'vehicle' | 'equipment' | 'furniture',
    classCode: string
): Promise<number> => {
    try {
        console.log(`🔢 Counting actual ${assetType}s for MAC: ${macName}, Class: ${classCode}`);

        // Get the appropriate API endpoint based on asset type
        let apiEndpoint = '';
        switch (assetType) {
            case 'vehicle':
                apiEndpoint = '/api/vehicles';
                break;
            case 'equipment':
                apiEndpoint = '/api/equipment';
                break;
            case 'furniture':
                apiEndpoint = '/api/furniture';
                break;
        }

        const response = await fetch(apiEndpoint);
        if (response.ok) {
            const data = await response.json();
            const assets = data.vehicles || data.equipment || data.furniture || [];

            // Count assets assigned to this MAC
            const macAssets = assets.filter((asset: any) => asset.department === macName);

            // For vehicles, filter by vehicle class
            if (assetType === 'vehicle') {
                const vehiclesByClass = macAssets.filter((vehicle: any) => {
                    const vehicleClassCode = getVehicleClassCode(vehicle.vehicleType || 'car');
                    return vehicleClassCode === classCode;
                });

                const count = vehiclesByClass.length + 1; // +1 for the new vehicle being added
                console.log(`📊 ${macName} has ${vehiclesByClass.length} existing ${assetType}s in class ${classCode}, new count will be: ${count}`);
                return count;
            }

            // For equipment/furniture, filter by the equipment/furniture class
            const assetsByClass = macAssets.filter((asset: any) => {
                // This would need to match against the actual equipment/furniture class
                // For now, count all assets of this type for this MAC
                return true;
            });

            const count = assetsByClass.length + 1; // +1 for the new asset being added
            console.log(`📊 ${macName} has ${assetsByClass.length} existing ${assetType}s, new count will be: ${count}`);
            return count;
        }

        console.log(`⚠️ API not available, defaulting to count 1 for ${macName}`);
        return 1; // Default to 1 if API not available

    } catch (error) {
        console.error('Error counting actual assets:', error);
        return 1;
    }
};

/**
 * Generate complete GSA code for an asset
 */
export const generateAssetGSACode = async (
    macName: string,
    assetType: 'vehicle' | 'equipment' | 'furniture',
    classType: string,
    manualCount?: number
): Promise<string> => {
    const macCode = getMACCode(macName);

    let classCode = '';
    switch (assetType) {
        case 'vehicle':
            classCode = getVehicleClassCode(classType);
            break;
        case 'equipment':
            classCode = EQUIPMENT_CLASS_CODES[classType as keyof typeof EQUIPMENT_CLASS_CODES] || '10';
            break;
        case 'furniture':
            classCode = FURNITURE_CLASS_CODES[classType as keyof typeof FURNITURE_CLASS_CODES] || '10';
            break;
    }

    // Use manual count if provided, otherwise get actual count
    const count = manualCount || await getActualAssetCount(macName, assetType, classCode);

    return generateGSACode({
        prefix: 'GSA',
        macCode,
        classCode,
        count
    });
};

/**
 * Check if GSA code already exists in the system
 */
export const checkGSACodeExists = async (
    gsaCode: string,
    assetType: 'vehicle' | 'equipment' | 'furniture',
    excludeId?: string
): Promise<boolean> => {
    try {
        let apiEndpoint = '';
        switch (assetType) {
            case 'vehicle':
                apiEndpoint = '/api/vehicles';
                break;
            case 'equipment':
                apiEndpoint = '/api/equipment';
                break;
            case 'furniture':
                apiEndpoint = '/api/furniture';
                break;
        }

        const response = await fetch(apiEndpoint);
        if (response.ok) {
            const data = await response.json();
            const assets = data.vehicles || data.equipment || data.furniture || [];

            // Check if GSA code exists (excluding current asset if editing)
            const existingAsset = assets.find((asset: any) =>
                asset.gsaCode === gsaCode && asset.id !== excludeId
            );

            return !!existingAsset;
        }

        return false;
    } catch (error) {
        console.error('Error checking GSA code existence:', error);
        return false;
    }
};

/**
 * Validate GSA Code format
 */
export const validateGSACode = (gsaCode: string): boolean => {
    const regex = /^GSA-[A-Z]{2,4}-\d{2}-\d{3}$/;
    return regex.test(gsaCode);
};

/**
 * Get human readable description of GSA code
 */
export const getGSACodeDescription = (gsaCode: string): string => {
    const components = parseGSACode(gsaCode);
    if (!components) return 'Invalid GSA Code';

    const macName = Object.keys(MAC_CODES).find(key =>
        MAC_CODES[key as keyof typeof MAC_CODES] === components.macCode
    ) || components.macCode;

    return `${macName} - Asset #${components.count} in class ${components.classCode}`;
};
