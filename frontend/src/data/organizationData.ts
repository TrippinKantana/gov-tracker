// Shared organizational data for the Government Asset Tracking Platform

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

// Government Departments
export const departments: Department[] = [
  { id: 'DEPT001', name: 'Ministry of Health', code: 'MOH', type: 'ministry' },
  { id: 'DEPT002', name: 'Ministry of Agriculture', code: 'MOA', type: 'ministry' },
  { id: 'DEPT003', name: 'General Services Agency', code: 'GSA', type: 'agency' },
  { id: 'DEPT004', name: 'Ministry of Defense', code: 'MOD', type: 'ministry' },
  { id: 'DEPT005', name: 'Ministry of Education', code: 'MOE', type: 'ministry' },
  { id: 'DEPT006', name: 'Ministry of Information', code: 'MOI', type: 'ministry' }
];

// Government Facilities mapped to departments
export const facilities: Facility[] = [
  // Ministry of Health Facilities
  {
    id: 'FC001',
    name: 'Ministry of Health Headquarters',
    departmentId: 'DEPT001',
    department: 'Ministry of Health',
    type: 'ministry',
    address: 'Capitol Hill, Monrovia',
    rooms: ['Room 101', 'Room 201', 'Room 301', 'Director Office', 'Conference Room A']
  },
  {
    id: 'FC002',
    name: 'JFK Memorial Medical Center',
    departmentId: 'DEPT001',
    department: 'Ministry of Health',
    type: 'hospital',
    address: 'Sinkor, Monrovia',
    rooms: ['Ward A', 'Ward B', 'ICU', 'Emergency', 'Pharmacy', 'Lab']
  },
  {
    id: 'FC003',
    name: 'Rural Health Clinic - Kakata',
    departmentId: 'DEPT001',
    department: 'Ministry of Health',
    type: 'hospital',
    address: 'Kakata, Margibi County',
    rooms: ['Consultation Room', 'Pharmacy', 'Storage']
  },

  // Ministry of Agriculture Facilities
  {
    id: 'FC004',
    name: 'Agricultural Research Station',
    departmentId: 'DEPT002',
    department: 'Ministry of Agriculture',
    type: 'school',
    address: 'Suakoko, Bong County',
    rooms: ['Laboratory', 'Field Office', 'Storage Facility', 'Research Labs']
  },
  {
    id: 'FC005',
    name: 'Ministry of Agriculture HQ',
    departmentId: 'DEPT002',
    department: 'Ministry of Agriculture',
    type: 'ministry',
    address: 'Sinkor, Monrovia',
    rooms: ['Director Office', 'Planning Department', 'Field Operations', 'Conference Room']
  },

  // General Services Agency Facilities
  {
    id: 'FC006',
    name: 'Central Government Warehouse',
    departmentId: 'DEPT003',
    department: 'General Services Agency',
    type: 'warehouse',
    address: 'Bushrod Island, Monrovia',
    rooms: ['Warehouse A', 'Warehouse B', 'Office', 'Loading Dock']
  },
  {
    id: 'FC007',
    name: 'GSA Administrative Building',
    departmentId: 'DEPT003',
    department: 'General Services Agency',
    type: 'ministry',
    address: 'Broad Street, Monrovia',
    rooms: ['Director Office', 'HR Department', 'IT Department', 'Meeting Rooms']
  },

  // Ministry of Defense Facilities
  {
    id: 'FC008',
    name: 'Defense Ministry Headquarters',
    departmentId: 'DEPT004',
    department: 'Ministry of Defense',
    type: 'military_base',
    address: 'Camp Johnson Road, Monrovia',
    rooms: ['Command Center', 'Communications', 'Armory', 'Training Facility']
  },

  // Ministry of Education Facilities
  {
    id: 'FC009',
    name: 'University of Liberia Campus',
    departmentId: 'DEPT005',
    department: 'Ministry of Education',
    type: 'school',
    address: 'Capitol Hill, Monrovia',
    rooms: ['Administration Building', 'IT Center', 'Library', 'Lecture Halls']
  },
  {
    id: 'FC010',
    name: 'Ministry of Education HQ',
    departmentId: 'DEPT005',
    department: 'Ministry of Education',
    type: 'ministry',
    address: 'Sinkor, Monrovia',
    rooms: ['Director Office', 'Curriculum Department', 'Planning Office']
  }
];

// Government Employees mapped to departments
export const employees: Employee[] = [
  // Ministry of Health
  { id: 'EMP001', name: 'Dr. Sarah Johnson', badgeNumber: 'GSA-001', departmentId: 'DEPT001', department: 'Ministry of Health', position: 'Health Director', email: 'sarah.johnson@health.gov.lr' },
  { id: 'EMP002', name: 'Dr. Michael Brown', badgeNumber: 'GSA-002', departmentId: 'DEPT001', department: 'Ministry of Health', position: 'Medical Officer', email: 'michael.brown@health.gov.lr' },
  { id: 'EMP003', name: 'Nurse Janet Wilson', badgeNumber: 'GSA-003', departmentId: 'DEPT001', department: 'Ministry of Health', position: 'Senior Nurse', email: 'janet.wilson@health.gov.lr' },

  // Ministry of Agriculture
  { id: 'EMP004', name: 'John Doe', badgeNumber: 'GSA-004', departmentId: 'DEPT002', department: 'Ministry of Agriculture', position: 'Field Officer', email: 'john.doe@agriculture.gov.lr' },
  { id: 'EMP005', name: 'Dr. Robert Green', badgeNumber: 'GSA-005', departmentId: 'DEPT002', department: 'Ministry of Agriculture', position: 'Research Director', email: 'robert.green@agriculture.gov.lr' },

  // General Services Agency
  { id: 'EMP006', name: 'Mary Williams', badgeNumber: 'GSA-006', departmentId: 'DEPT003', department: 'General Services Agency', position: 'IT Coordinator', email: 'mary.williams@gsa.gov.lr' },
  { id: 'EMP007', name: 'John Wilson', badgeNumber: 'GSA-007', departmentId: 'DEPT003', department: 'General Services Agency', position: 'Warehouse Manager', email: 'john.wilson@gsa.gov.lr' },

  // Ministry of Defense
  { id: 'EMP008', name: 'General Robert Smith', badgeNumber: 'GSA-008', departmentId: 'DEPT004', department: 'Ministry of Defense', position: 'Defense Minister', email: 'robert.smith@defense.gov.lr' },
  { id: 'EMP009', name: 'Colonel James Davis', badgeNumber: 'GSA-009', departmentId: 'DEPT004', department: 'Ministry of Defense', position: 'Operations Commander', email: 'james.davis@defense.gov.lr' },

  // Ministry of Education
  { id: 'EMP010', name: 'Prof. Mary Davis', badgeNumber: 'GSA-010', departmentId: 'DEPT005', department: 'Ministry of Education', position: 'Education Director', email: 'mary.davis@education.gov.lr' }
];

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
