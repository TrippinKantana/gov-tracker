import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Equipment {
  id: string;
  name: string;
  type: 'laptop' | 'desktop' | 'tablet' | 'phone' | 'printer' | 'projector' | 'server' | 'radio' | 'camera' | 'desk' | 'chair' | 'table' | 'storage' | 'bookshelf' | 'cabinet' | 'sofa' | 'other';
  category?: 'equipment' | 'furniture';
  brand: string;
  model: string;
  serialNumber: string;
  department: string;
  assignedTo?: string;
  assignedEmployee?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  facility?: {
    id: string;
    name: string;
    room?: string;
  };
  status: 'active' | 'available' | 'maintenance' | 'retired' | 'lost';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  purchaseDate: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  lastMaintenance?: string;
  location: string;
  notes?: string;
  // Depreciation fields
  usefulLife?: number; // years
  salvageValue?: number; // estimated end-of-life value
}

export interface CreateEquipmentRequest {
  name: string;
  type: Equipment['type'];
  brand: string;
  model: string;
  serialNumber: string;
  department: string;
  assignedEmployeeId?: string;
  facilityId?: string;
  status: Equipment['status'];
  condition: Equipment['condition'];
  purchaseDate: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  location: string;
  notes?: string;
  // Depreciation fields
  usefulLife?: number;
  salvageValue?: number;
  category?: 'equipment' | 'furniture';
}

export interface UpdateEquipmentRequest extends Partial<CreateEquipmentRequest> {
  id: string;
}

class EquipmentService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/equipment`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get all equipment with filtering
  async getEquipment(filters?: {
    search?: string;
    type?: string;
    status?: string;
    department?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ equipment: Equipment[]; total: number }> {
    try {
      const response = await this.api.get('/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  }

  // Get single equipment by ID
  async getEquipmentById(id: string): Promise<Equipment> {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data.equipment;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  }

  // Create new equipment
  async createEquipment(equipmentData: CreateEquipmentRequest): Promise<Equipment> {
    try {
      const response = await this.api.post('/', equipmentData);
      return response.data.equipment;
    } catch (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
  }

  // Update equipment
  async updateEquipment(equipmentData: UpdateEquipmentRequest): Promise<Equipment> {
    try {
      const response = await this.api.put(`/${equipmentData.id}`, equipmentData);
      return response.data.equipment;
    } catch (error) {
      console.error('Error updating equipment:', error);
      throw error;
    }
  }

  // Delete equipment
  async deleteEquipment(id: string): Promise<void> {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      throw error;
    }
  }

  // Get equipment history/tracking
  async getEquipmentHistory(id: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/${id}/history`);
      return response.data.history;
    } catch (error) {
      console.error('Error fetching equipment history:', error);
      throw error;
    }
  }

  // Assign equipment to employee
  async assignEquipment(equipmentId: string, employeeId: string, facilityId?: string): Promise<Equipment> {
    try {
      const response = await this.api.post(`/${equipmentId}/assign`, {
        employeeId,
        facilityId
      });
      return response.data.equipment;
    } catch (error) {
      console.error('Error assigning equipment:', error);
      throw error;
    }
  }

  // Unassign equipment
  async unassignEquipment(equipmentId: string): Promise<Equipment> {
    try {
      const response = await this.api.post(`/${equipmentId}/unassign`);
      return response.data.equipment;
    } catch (error) {
      console.error('Error unassigning equipment:', error);
      throw error;
    }
  }
}

export const equipmentService = new EquipmentService();
