import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  type: 'car' | 'truck' | 'motorcycle' | 'bus' | 'van';
  department: string;
  assignedTo?: string;
  assignedEmployee?: {
    id: string;
    name: string;
    badgeNumber: string;
  };
  homeFacility?: {
    id: string;
    name: string;
    address: string;
  };
  status: 'active' | 'maintenance' | 'out_of_service' | 'available';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  fuelLevel: number;
  mileage: number;
  lastLocation: string;
  gpsTracker: string; // BW32 device ID
  lastUpdate: string;
  purchaseDate: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  lastMaintenance?: string;
  notes?: string;
}

export interface CreateVehicleRequest {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  type: Vehicle['type'];
  department: string;
  assignedEmployeeId?: string;
  facilityId?: string;
  status: Vehicle['status'];
  condition: Vehicle['condition'];
  fuelLevel: number;
  mileage: number;
  gpsTracker: string;
  purchaseDate: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  notes?: string;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  id: string;
}

class VehicleService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/vehicles`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get all vehicles with filtering
  async getVehicles(filters?: {
    search?: string;
    type?: string;
    status?: string;
    department?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ vehicles: Vehicle[]; total: number }> {
    try {
      const response = await this.api.get('/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  // Get single vehicle by ID
  async getVehicleById(id: string): Promise<Vehicle> {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data.vehicle;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  // Create new vehicle
  async createVehicle(vehicleData: CreateVehicleRequest): Promise<Vehicle> {
    try {
      const response = await this.api.post('/', vehicleData);
      return response.data.vehicle;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // Update vehicle
  async updateVehicle(vehicleData: UpdateVehicleRequest): Promise<Vehicle> {
    try {
      const response = await this.api.put(`/${vehicleData.id}`, vehicleData);
      return response.data.vehicle;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Delete vehicle
  async deleteVehicle(id: string): Promise<void> {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  // Get vehicle tracking history
  async getVehicleHistory(id: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/${id}/history`);
      return response.data.history;
    } catch (error) {
      console.error('Error fetching vehicle history:', error);
      throw error;
    }
  }

  // Assign vehicle to employee
  async assignVehicle(vehicleId: string, employeeId: string, facilityId?: string): Promise<Vehicle> {
    try {
      const response = await this.api.post(`/${vehicleId}/assign`, {
        employeeId,
        facilityId
      });
      return response.data.vehicle;
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      throw error;
    }
  }

  // Unassign vehicle
  async unassignVehicle(vehicleId: string): Promise<Vehicle> {
    try {
      const response = await this.api.post(`/${vehicleId}/unassign`);
      return response.data.vehicle;
    } catch (error) {
      console.error('Error unassigning vehicle:', error);
      throw error;
    }
  }
}

export const vehicleService = new VehicleService();
