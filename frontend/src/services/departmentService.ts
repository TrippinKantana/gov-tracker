import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Department {
  id: string;
  name: string;
  code: string;
  type: 'ministry' | 'agency' | 'bureau' | 'commission' | 'authority';
  headOfDepartment: string;
  email: string;
  phone: string;
  address: string;
  budget: number;
  status: 'active' | 'inactive' | 'restructuring';
  employeeCount: number;
  vehicleCount: number;
  facilityCount: number;
  equipmentCount: number;
  establishedDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  type: Department['type'];
  headOfDepartment: string;
  email: string;
  phone: string;
  address: string;
  budget: number;
  status: Department['status'];
  establishedDate: string;
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
  id: string;
}

export interface DepartmentAssets {
  employees: {
    total: number;
    active: number;
    inactive: number;
  };
  vehicles: {
    total: number;
    active: number;
    maintenance: number;
  };
  facilities: {
    total: number;
    operational: number;
    maintenance: number;
  };
  equipment: {
    total: number;
    active: number;
    available: number;
    maintenance: number;
  };
}

class DepartmentService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/departments`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get all departments with filtering
  async getDepartments(filters?: {
    search?: string;
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ departments: Department[]; total: number }> {
    try {
      const response = await this.api.get('/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  // Get single department by ID
  async getDepartmentById(id: string): Promise<Department> {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data.department;
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  }

  // Create new department
  async createDepartment(departmentData: CreateDepartmentRequest): Promise<Department> {
    try {
      const response = await this.api.post('/', departmentData);
      return response.data.department;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  // Update department
  async updateDepartment(departmentData: UpdateDepartmentRequest): Promise<Department> {
    try {
      const response = await this.api.put(`/${departmentData.id}`, departmentData);
      return response.data.department;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  // Delete department
  async deleteDepartment(id: string): Promise<void> {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  // Get department asset summary
  async getDepartmentAssets(id: string): Promise<DepartmentAssets> {
    try {
      const response = await this.api.get(`/${id}/assets`);
      return response.data.assets;
    } catch (error) {
      console.error('Error fetching department assets:', error);
      throw error;
    }
  }
}

export const departmentService = new DepartmentService();
