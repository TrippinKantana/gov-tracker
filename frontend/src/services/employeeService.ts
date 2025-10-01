import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  department: string;
  badgeNumber: string;
  email: string;
  phone: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: string;
  terminationDate?: string;
  salary?: number;
  address?: {
    street: string;
    city: string;
    county: string;
    country: string;
  };
  assignedAssets: {
    id: string;
    name: string;
    type: string;
    serialNumber: string;
    assignedDate: string;
  }[];
  assignedAssetsCount: number;
  supervisor?: {
    id: string;
    name: string;
    position: string;
  };
  lastSeen?: string;
  profilePicture?: string;
  notes?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  badgeNumber: string;
  email: string;
  phone: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  status: Employee['status'];
  hireDate: string;
  salary?: number;
  address?: {
    street: string;
    city: string;
    county: string;
    country: string;
  };
  supervisorId?: string;
  notes?: string;
  permissions?: string[];
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  id: string;
  terminationDate?: string;
}

class EmployeeService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/employees`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get all employees with filtering
  async getEmployees(filters?: {
    search?: string;
    department?: string;
    status?: string;
    position?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ employees: Employee[]; total: number }> {
    try {
      const response = await this.api.get('/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  // Get single employee by ID
  async getEmployeeById(id: string): Promise<Employee> {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data.employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  // Create new employee
  async createEmployee(employeeData: CreateEmployeeRequest): Promise<Employee> {
    try {
      const response = await this.api.post('/', employeeData);
      return response.data.employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Update employee
  async updateEmployee(employeeData: UpdateEmployeeRequest): Promise<Employee> {
    try {
      const response = await this.api.put(`/${employeeData.id}`, employeeData);
      return response.data.employee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete employee
  async deleteEmployee(id: string): Promise<void> {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Get employee employment history
  async getEmployeeHistory(id: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/${id}/history`);
      return response.data.history;
    } catch (error) {
      console.error('Error fetching employee history:', error);
      throw error;
    }
  }

  // Get employee assigned assets
  async getEmployeeAssets(id: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/${id}/assets`);
      return response.data.assets;
    } catch (error) {
      console.error('Error fetching employee assets:', error);
      throw error;
    }
  }

  // Assign asset to employee
  async assignAsset(employeeId: string, assetId: string): Promise<Employee> {
    try {
      const response = await this.api.post(`/${employeeId}/assign-asset`, { assetId });
      return response.data.employee;
    } catch (error) {
      console.error('Error assigning asset:', error);
      throw error;
    }
  }

  // Unassign asset from employee
  async unassignAsset(employeeId: string, assetId: string): Promise<Employee> {
    try {
      const response = await this.api.post(`/${employeeId}/unassign-asset`, { assetId });
      return response.data.employee;
    } catch (error) {
      console.error('Error unassigning asset:', error);
      throw error;
    }
  }

  // Get departments list
  async getDepartments(): Promise<string[]> {
    try {
      const response = await this.api.get('/departments');
      return response.data.departments;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // Get positions list
  async getPositions(): Promise<string[]> {
    try {
      const response = await this.api.get('/positions');
      return response.data.positions;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  // Get employees for supervisor dropdown
  async getSupervisors(): Promise<{ id: string; name: string; position: string }[]> {
    try {
      const response = await this.api.get('/supervisors');
      return response.data.supervisors;
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      throw error;
    }
  }
}

export const employeeService = new EmployeeService();
