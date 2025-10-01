import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Facility {
  id: string;
  facility_id?: string;
  name: string;
  type: 'ministry' | 'hospital' | 'school' | 'police_station' | 'military_base' | 'warehouse' | 'courthouse' | 'fire_station';
  address: string;
  location?: [number, number]; // [longitude, latitude]
  department: string;
  capacity?: number;
  status: 'operational' | 'maintenance' | 'under_construction' | 'closed';
  securityLevel: 'low' | 'medium' | 'high' | 'restricted';
  contactPerson: string;
  contactPhone: string;
  rooms?: FacilityRoom[];
  assignedVehicles?: number;
  assignedEquipment?: number;
  lastInspection?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacilityRoom {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity?: number;
  equipment?: string[];
}

export interface CreateFacilityRequest {
  name: string;
  type: Facility['type'];
  address: string;
  location?: [number, number];
  department: string;
  capacity?: number;
  status: Facility['status'];
  securityLevel: Facility['securityLevel'];
  contactPerson: string;
  contactPhone: string;
  notes?: string;
}

export interface UpdateFacilityRequest extends Partial<CreateFacilityRequest> {
  id: string;
}

export interface FacilityStats {
  totalFacilities: number;
  operational: number;
  maintenance: number;
  underConstruction: number;
  closed: number;
  totalCapacity: number;
  totalVehicles: number;
  totalEquipment: number;
}

class FacilityService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/facilities`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get all facilities with filtering
  async getFacilities(filters?: {
    search?: string;
    type?: string;
    status?: string;
    department?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ facilities: Facility[]; total: number }> {
    try {
      const response = await this.api.get('/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching facilities:', error);
      throw error;
    }
  }

  // Get single facility by ID
  async getFacilityById(id: string): Promise<Facility> {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data.facility;
    } catch (error) {
      console.error('Error fetching facility:', error);
      throw error;
    }
  }

  // Create new facility
  async createFacility(facilityData: CreateFacilityRequest): Promise<Facility> {
    try {
      const response = await this.api.post('/', facilityData);
      return response.data.facility;
    } catch (error) {
      console.error('Error creating facility:', error);
      throw error;
    }
  }

  // Update facility
  async updateFacility(facilityData: UpdateFacilityRequest): Promise<Facility> {
    try {
      const response = await this.api.put(`/${facilityData.id}`, facilityData);
      return response.data.facility;
    } catch (error) {
      console.error('Error updating facility:', error);
      throw error;
    }
  }

  // Delete facility
  async deleteFacility(id: string): Promise<void> {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting facility:', error);
      throw error;
    }
  }

  // Get facility statistics
  async getFacilityStats(): Promise<FacilityStats> {
    try {
      const response = await this.api.get('/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching facility stats:', error);
      throw error;
    }
  }

  // Get facility asset assignments
  async getFacilityAssets(id: string): Promise<{
    vehicles: any[];
    equipment: any[];
  }> {
    try {
      const response = await this.api.get(`/${id}/assets`);
      return response.data;
    } catch (error) {
      console.error('Error fetching facility assets:', error);
      throw error;
    }
  }

  // Get facility history/activity log
  async getFacilityHistory(id: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/${id}/history`);
      return response.data.history;
    } catch (error) {
      console.error('Error fetching facility history:', error);
      throw error;
    }
  }

  // Check if facility can be deleted (no assigned assets)
  async checkFacilityDeletion(id: string): Promise<{
    canDelete: boolean;
    assignedAssets: number;
    assignedVehicles: number;
    assignedEquipment: number;
  }> {
    try {
      const response = await this.api.get(`/${id}/check-deletion`);
      return response.data;
    } catch (error) {
      console.error('Error checking facility deletion:', error);
      throw error;
    }
  }
}

export const facilityService = new FacilityService();
