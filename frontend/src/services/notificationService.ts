/**
 * Comprehensive Notification System for Government Asset Tracking
 * Handles maintenance alerts, sound notifications, and email alerts
 */

export interface Notification {
  id: string;
  type: 'maintenance' | 'alert' | 'warning' | 'info' | 'emergency';
  category: 'vehicle' | 'equipment' | 'facility' | 'system';
  title: string;
  message: string;
  assetId: string;
  assetName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isEmailSent: boolean;
  soundPlayed: boolean;
  createdAt: Date;
  dueDate?: Date;
  actionRequired?: string;
  location?: string;
  department?: string;
  metadata?: {
    maintenanceType?: string;
    daysOverdue?: number;
    lastServiceDate?: string;
    nextServiceDate?: string;
    mileage?: number;
    cost?: number;
    vendor?: string;
  };
}

export interface NotificationSettings {
  enableSound: boolean;
  enableEmail: boolean;
  enableDesktop: boolean;
  soundVolume: number;
  emailRecipients: string[];
  maintenanceThresholds: {
    vehicleMaintenanceDays: number;
    equipmentMaintenanceDays: number;
    facilityInspectionDays: number;
    vehicleMileageInterval: number;
  };
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private settings: NotificationSettings = {
    enableSound: true,
    enableEmail: true,
    enableDesktop: true,
    soundVolume: 0.7,
    emailRecipients: [],
    maintenanceThresholds: {
      vehicleMaintenanceDays: 90,      // 90 days for vehicle maintenance
      equipmentMaintenanceDays: 180,    // 180 days for equipment maintenance  
      facilityInspectionDays: 365,      // Annual facility inspections
      vehicleMileageInterval: 5000      // 5000km for vehicle service
    }
  };

  // Audio context for sound notifications
  private audioContext: AudioContext | null = null;
  private soundGenerator: any = null;

  constructor() {
    console.log('NotificationService: Initializing service...');
    this.initializeAudio();
    this.loadSettings();
    this.loadNotifications();
    this.startMaintenanceMonitoring();
    console.log('NotificationService: Service initialized with', this.notifications.length, 'notifications');
  }

  private async initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load sound generator script
      await this.loadSoundGenerator();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }

  private async loadSoundGenerator() {
    try {
      // Load the sound generator script
      const script = document.createElement('script');
      script.src = '/sounds/notification-generator.js';
      document.head.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
      
      if ((window as any).NotificationSoundGenerator) {
        this.soundGenerator = new (window as any).NotificationSoundGenerator(this.audioContext);
      }
    } catch (error) {
      console.warn('Failed to load sound generator:', error);
    }
  }

  private playSound(type: 'maintenance' | 'critical' | 'warning' | 'info') {
    if (!this.settings.enableSound || !this.audioContext || !this.soundGenerator) return;

    try {
      // Resume audio context if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Set volume
      const masterGain = this.audioContext.createGain();
      masterGain.gain.value = this.settings.soundVolume;
      masterGain.connect(this.audioContext.destination);

      // Play appropriate sound
      switch (type) {
        case 'critical':
          this.soundGenerator.generateCriticalAlert();
          break;
        case 'maintenance':
          this.soundGenerator.generateMaintenanceAlert();
          break;
        case 'warning':
          this.soundGenerator.generateWarning();
          break;
        case 'info':
          this.soundGenerator.generateInfo();
          break;
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  private loadSettings() {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
  }

  private saveSettings() {
    localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
  }

  // Maintenance monitoring system
  private startMaintenanceMonitoring() {
    // Check for maintenance alerts every hour
    setInterval(() => {
      this.checkMaintenanceAlerts();
    }, 60 * 60 * 1000); // 1 hour

    // Initial check
    this.checkMaintenanceAlerts();
  }

  private async checkMaintenanceAlerts() {
    console.log('🔍 Checking for maintenance alerts...');
    
    try {
      // Check vehicle maintenance
      await this.checkVehicleMaintenanceAlerts();
      
      // Check equipment maintenance
      await this.checkEquipmentMaintenanceAlerts();
      
      // Check facility inspections
      await this.checkFacilityMaintenanceAlerts();
      
    } catch (error) {
      console.error('Error checking maintenance alerts:', error);
    }
  }

  private async checkVehicleMaintenanceAlerts() {
    try {
      const response = await fetch('/api/vehicles');
      const result = await response.json();
      
      if (result.success && result.vehicles) {
        for (const vehicle of result.vehicles) {
          // Check date-based maintenance
          if (vehicle.lastMaintenance) {
            const lastMaintenanceDate = new Date(vehicle.lastMaintenance);
            const daysSinceMaintenance = Math.floor((Date.now() - lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceMaintenance >= this.settings.maintenanceThresholds.vehicleMaintenanceDays) {
              await this.createMaintenanceNotification({
                category: 'vehicle',
                assetId: vehicle.id,
                assetName: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
                title: 'Vehicle Maintenance Due',
                message: `Vehicle maintenance is ${daysSinceMaintenance > this.settings.maintenanceThresholds.vehicleMaintenanceDays ? 'overdue' : 'due'}`,
                severity: daysSinceMaintenance > this.settings.maintenanceThresholds.vehicleMaintenanceDays + 30 ? 'critical' : 'high',
                department: vehicle.department,
                metadata: {
                  daysOverdue: Math.max(0, daysSinceMaintenance - this.settings.maintenanceThresholds.vehicleMaintenanceDays),
                  lastServiceDate: vehicle.lastMaintenance,
                  mileage: vehicle.mileage
                }
              });
            }
          }
          
          // Check mileage-based maintenance
          if (vehicle.mileage && vehicle.lastMaintenanceMileage) {
            const mileageSinceMaintenance = vehicle.mileage - vehicle.lastMaintenanceMileage;
            
            if (mileageSinceMaintenance >= this.settings.maintenanceThresholds.vehicleMileageInterval) {
              await this.createMaintenanceNotification({
                category: 'vehicle',
                assetId: vehicle.id,
                assetName: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
                title: 'Vehicle Service Due (Mileage)',
                message: `Vehicle has exceeded mileage service interval by ${mileageSinceMaintenance - this.settings.maintenanceThresholds.vehicleMileageInterval} km`,
                severity: 'high',
                department: vehicle.department,
                metadata: {
                  mileage: vehicle.mileage,
                  lastServiceDate: vehicle.lastMaintenance
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking vehicle maintenance:', error);
    }
  }

  private async checkEquipmentMaintenanceAlerts() {
    try {
      const response = await fetch('/api/equipment');
      const result = await response.json();
      
      if (result.success && result.equipment) {
        for (const equipment of result.equipment) {
          if (equipment.lastMaintenance) {
            const lastMaintenanceDate = new Date(equipment.lastMaintenance);
            const daysSinceMaintenance = Math.floor((Date.now() - lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceMaintenance >= this.settings.maintenanceThresholds.equipmentMaintenanceDays) {
              await this.createMaintenanceNotification({
                category: 'equipment',
                assetId: equipment.id,
                assetName: `${equipment.name} (${equipment.serialNumber})`,
                title: 'Equipment Maintenance Due',
                message: `Equipment maintenance is ${daysSinceMaintenance > this.settings.maintenanceThresholds.equipmentMaintenanceDays ? 'overdue' : 'due'}`,
                severity: daysSinceMaintenance > this.settings.maintenanceThresholds.equipmentMaintenanceDays + 60 ? 'critical' : 'medium',
                department: equipment.department,
                location: equipment.location || equipment.facility?.name,
                metadata: {
                  daysOverdue: Math.max(0, daysSinceMaintenance - this.settings.maintenanceThresholds.equipmentMaintenanceDays),
                  lastServiceDate: equipment.lastMaintenance,
                  maintenanceType: 'equipment_service'
                }
              });
            }
          }

          // Check warranty expiration
          if (equipment.warrantyExpiry) {
            const warrantyDate = new Date(equipment.warrantyExpiry);
            const daysUntilExpiry = Math.floor((warrantyDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
              await this.createMaintenanceNotification({
                category: 'equipment',
                assetId: equipment.id,
                assetName: `${equipment.name} (${equipment.serialNumber})`,
                title: 'Warranty Expiring Soon',
                message: `Equipment warranty expires in ${daysUntilExpiry} days`,
                severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
                department: equipment.department,
                dueDate: warrantyDate,
                metadata: {
                  maintenanceType: 'warranty_expiry'
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking equipment maintenance:', error);
    }
  }

  private async checkFacilityMaintenanceAlerts() {
    try {
      const response = await fetch('/api/facilities');
      const result = await response.json();
      
      if (result.success && result.facilities) {
        for (const facility of result.facilities) {
          if (facility.lastInspection) {
            const lastInspectionDate = new Date(facility.lastInspection);
            const daysSinceInspection = Math.floor((Date.now() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceInspection >= this.settings.maintenanceThresholds.facilityInspectionDays) {
              await this.createMaintenanceNotification({
                category: 'facility',
                assetId: facility.id,
                assetName: facility.name,
                title: 'Facility Inspection Due',
                message: `Annual facility inspection is ${daysSinceInspection > this.settings.maintenanceThresholds.facilityInspectionDays ? 'overdue' : 'due'}`,
                severity: daysSinceInspection > this.settings.maintenanceThresholds.facilityInspectionDays + 90 ? 'critical' : 'high',
                department: facility.department,
                location: facility.address,
                metadata: {
                  daysOverdue: Math.max(0, daysSinceInspection - this.settings.maintenanceThresholds.facilityInspectionDays),
                  lastServiceDate: facility.lastInspection,
                  maintenanceType: 'facility_inspection'
                }
              });
            }
          }

          // Check for equipment in facility that needs maintenance
          await this.checkFacilityEquipmentMaintenanceAlerts(facility);
        }
      }
    } catch (error) {
      console.error('Error checking facility maintenance:', error);
    }
  }

  private async checkFacilityEquipmentMaintenanceAlerts(facility: any) {
    try {
      const response = await fetch(`/api/equipment?facilityId=${facility.id}`);
      const result = await response.json();
      
      if (result.success && result.equipment) {
        const equipmentNeedingMaintenance = result.equipment.filter((equipment: any) => {
          if (!equipment.lastMaintenance) return false;
          
          const lastMaintenanceDate = new Date(equipment.lastMaintenance);
          const daysSinceMaintenance = Math.floor((Date.now() - lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
          
          return daysSinceMaintenance >= this.settings.maintenanceThresholds.equipmentMaintenanceDays;
        });

        if (equipmentNeedingMaintenance.length > 0) {
          await this.createMaintenanceNotification({
            category: 'facility',
            assetId: facility.id,
            assetName: facility.name,
            title: 'Equipment in Facility Needs Maintenance',
            message: `${equipmentNeedingMaintenance.length} equipment item(s) in ${facility.name} need maintenance`,
            severity: 'medium',
            department: facility.department,
            location: facility.address,
            metadata: {
              maintenanceType: 'facility_equipment_maintenance',
              equipmentCount: equipmentNeedingMaintenance.length
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking facility equipment maintenance:', error);
    }
  }

  private async createMaintenanceNotification(params: {
    category: 'vehicle' | 'equipment' | 'facility';
    assetId: string;
    assetName: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    department?: string;
    location?: string;
    dueDate?: Date;
    metadata?: any;
  }) {
    // Check if we already have a similar notification
    const existingNotification = this.notifications.find(n => 
      n.assetId === params.assetId && 
      n.title === params.title && 
      !n.isRead
    );

    if (existingNotification) {
      // Update existing notification
      existingNotification.message = params.message;
      existingNotification.severity = params.severity;
      existingNotification.metadata = { ...existingNotification.metadata, ...params.metadata };
      existingNotification.createdAt = new Date();
    } else {
      // Create new notification
      const notification: Notification = {
        id: `${params.category}-${params.assetId}-${Date.now()}`,
        type: 'maintenance',
        category: params.category,
        title: params.title,
        message: params.message,
        assetId: params.assetId,
        assetName: params.assetName,
        severity: params.severity,
        isRead: false,
        isEmailSent: false,
        soundPlayed: false,
        createdAt: new Date(),
        dueDate: params.dueDate,
        actionRequired: 'Schedule maintenance',
        location: params.location,
        department: params.department,
        metadata: params.metadata
      };

      this.notifications.unshift(notification);

      // Play sound for new notification
      if (params.severity === 'critical') {
        this.playSound('critical');
      } else if (params.severity === 'high') {
        this.playSound('maintenance');
      } else {
        this.playSound('warning');
      }

      // Send email if enabled
      if (this.settings.enableEmail) {
        await this.sendEmailNotification(notification);
      }

      // Send desktop notification if enabled
      if (this.settings.enableDesktop) {
        this.sendDesktopNotification(notification);
      }
    }

    this.notifyListeners();
    this.saveNotifications();
  }

  private async sendEmailNotification(notification: Notification) {
    if (notification.isEmailSent) return;

    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients: this.settings.emailRecipients,
          subject: `GOVERNMENT ALERT - ${notification.severity.toUpperCase()}: ${notification.title}`,
          message: notification.message,
          assetName: notification.assetName,
          department: notification.department,
          location: notification.location,
          dueDate: notification.dueDate,
          metadata: notification.metadata
        })
      });

      const result = await response.json();
      
      if (result.success) {
        notification.isEmailSent = true;
        console.log('📧 Government notification sent:', notification.title);
        
        // Log successful email (mock or real)
        if (result.message.includes('Mock email')) {
          console.log('📧 Mock mode: Email would be sent via government SMTP when configured');
        }
      } else {
        console.warn('📧 Email notification failed:', result.error);
      }
    } catch (error) {
      console.error('📧 Failed to send government email notification:', error);
    }
  }

  private sendDesktopNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id
      });
    }
  }

  // Public API methods
  public subscribe(callback: (notifications: Notification[]) => void) {
    console.log('NotificationService: New subscription added, total listeners:', this.listeners.length + 1);
    this.listeners.push(callback);
    callback(this.notifications);
  }

  public unsubscribe(callback: (notifications: Notification[]) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    console.log('NotificationService: Notifying', this.listeners.length, 'listeners with', this.notifications.length, 'notifications');
    this.listeners.forEach(callback => callback(this.notifications));
  }

  public getNotifications(): Notification[] {
    return this.notifications;
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  public markAsRead(notificationId: string) {
    console.log('NotificationService: markAsRead called for', notificationId);
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      console.log('NotificationService: Marking notification as read', notification.title);
      notification.isRead = true;
      this.notifyListeners();
      this.saveNotifications();
    } else {
      console.warn('NotificationService: Notification not found', notificationId);
    }
  }

  public markAllAsRead() {
    this.notifications.forEach(n => n.isRead = true);
    this.notifyListeners();
    this.saveNotifications();
  }

  public dismissNotification(notificationId: string) {
    console.log('NotificationService: dismissNotification called for', notificationId);
    const originalCount = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    const newCount = this.notifications.length;
    console.log(`NotificationService: Removed ${originalCount - newCount} notification(s)`);
    this.notifyListeners();
    this.saveNotifications();
  }

  public updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public async requestNotificationPermission() {
    // Only request permission when explicitly called by user action
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    } catch (error) {
      console.warn('Notification permission request failed:', error);
    }
    return false;
  }

  private saveNotifications() {
    // Save only recent notifications (last 100)
    const recentNotifications = this.notifications.slice(0, 100);
    localStorage.setItem('notifications', JSON.stringify(recentNotifications));
  }

  private loadNotifications() {
    console.log('NotificationService: Loading notifications from localStorage...');
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          dueDate: n.dueDate ? new Date(n.dueDate) : undefined
        }));
        console.log('NotificationService: Loaded', this.notifications.length, 'saved notifications');
      } catch (error) {
        console.error('NotificationService: Error loading saved notifications:', error);
        this.notifications = [];
      }
    } else {
      console.log('NotificationService: No saved notifications found');
      this.notifications = [];
    }
  }

  // Manual notification creation for testing
  public createTestNotification(type: 'vehicle' | 'equipment' | 'facility' = 'vehicle') {
    const testNotifications = {
      vehicle: {
        category: 'vehicle' as const,
        assetId: 'VH001',
        assetName: 'Toyota Hilux (LBR-001-GOV)',
        title: 'Vehicle Maintenance Due',
        message: 'Vehicle maintenance is overdue by 15 days',
        severity: 'high' as const,
        department: 'Ministry of Health'
      },
      equipment: {
        category: 'equipment' as const,
        assetId: 'EQ001',
        assetName: 'Dell Laptop (SN: 12345)',
        title: 'Equipment Maintenance Required',
        message: 'Equipment service is due in 5 days',
        severity: 'medium' as const,
        department: 'IT Department'
      },
      facility: {
        category: 'facility' as const,
        assetId: 'FAC001',
        assetName: 'Ministry of Health HQ',
        title: 'Facility Inspection Overdue',
        message: 'Annual facility inspection is overdue by 30 days',
        severity: 'critical' as const,
        department: 'Ministry of Health'
      }
    };

    this.createMaintenanceNotification(testNotifications[type]);
  }
}

export const notificationService = new NotificationService();

// Initialize notification service (removed auto permission request)
