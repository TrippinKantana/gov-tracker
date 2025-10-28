// Shared organizational data for the Government Asset Tracking Platform
// All data now comes from the database via API calls

export interface Department {
  id: string;
  name: string;
  code: string;
  type: 'ministry' | 'agency' | 'bureau' | 'commission' | 'authority';
}

export interface Facility {
  id: string;
  name: string;
  departmentId: string;
  department: string;
  type: 'ministry' | 'hospital' | 'school' | 'police_station' | 'military_base' | 'warehouse';
  address: string;
  rooms?: string[];
}

export interface Employee {
  id: string;
  name: string;
  badgeNumber: string;
  departmentId: string;
  department: string;
  position: string;
  email: string;
}

// Empty arrays - all data now comes from database
export const departments: Department[] = [];
export const facilities: Facility[] = [];
export const employees: Employee[] = [];

// Helper functions
export const getFacilitiesByDepartment = (departmentId: string): Facility[] => {
  return facilities.filter(facility => facility.departmentId === departmentId);
};

export const getEmployeesByDepartment = (departmentId: string): Employee[] => {
  return employees.filter(employee => employee.departmentId === departmentId);
};

export const getDepartmentById = (id: string): Department | undefined => {
  return departments.find(dept => dept.id === id);
};

export const getFacilityById = (id: string): Facility | undefined => {
  return facilities.find(facility => facility.id === id);
};

export const getEmployeeById = (id: string): Employee | undefined => {
  return employees.find(employee => employee.id === id);
};
