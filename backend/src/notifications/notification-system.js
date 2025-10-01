/**
 * Government Asset Tracking - Notification System
 * Handles email, in-app, and desktop notifications
 */

const nodemailer = require('nodemailer');
const EventEmitter = require('events');

class NotificationSystem extends EventEmitter {
  constructor({ app, io }) {
    super();
    this.app = app;
    this.io = io;
    this.notifications = new Map(); // Store in-app notifications
    this.emailTransporter = null;
    
    this.initializeEmailService();
    this.setupNotificationEndpoints();
  }

  /**
   * Initialize email service
   */
  initializeEmailService() {
    // Configure email service (update with your SMTP settings)
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'test',
          pass: process.env.SMTP_PASS || 'test'
        }
      });
      console.log('📧 Email service initialized');
    } catch (error) {
      console.warn('⚠️ Email service not configured, continuing without email notifications');
      this.emailTransporter = null;
    }
  }

  /**
   * Setup notification API endpoints
   */
  setupNotificationEndpoints() {
    // Get all notifications for user
    this.app.get('/api/notifications', (req, res) => {
      const userId = req.user?.id || 'anonymous';
      const userNotifications = Array.from(this.notifications.values())
        .filter(notif => notif.userId === userId || notif.type === 'system')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json({
        success: true,
        notifications: userNotifications,
        unread: userNotifications.filter(n => !n.read).length
      });
    });

    // Mark notification as read
    this.app.put('/api/notifications/:id/read', (req, res) => {
      const { id } = req.params;
      const notification = this.notifications.get(id);
      
      if (notification) {
        notification.read = true;
        this.notifications.set(id, notification);
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, message: 'Notification not found' });
      }
    });

    // Mark all notifications as read
    this.app.put('/api/notifications/mark-all-read', (req, res) => {
      const userId = req.user?.id || 'anonymous';
      
      this.notifications.forEach((notif, id) => {
        if (notif.userId === userId) {
          notif.read = true;
          this.notifications.set(id, notif);
        }
      });

      res.json({ success: true });
    });
  }

  /**
   * Send notification via all channels
   */
  async sendNotification({
    type,           // 'security', 'maintenance', 'system', 'assignment'
    priority,       // 'urgent', 'high', 'medium', 'low'
    title,
    message,
    userId = null,  // null = system-wide
    data = {},      // Additional data
    channels = ['in-app', 'email', 'desktop'] // Which channels to use
  }) {
    const notificationId = `NOTIF_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const notification = {
      id: notificationId,
      type,
      priority,
      title,
      message,
      userId,
      data,
      timestamp: new Date().toISOString(),
      read: false,
      channels
    };

    // Store in-app notification
    if (channels.includes('in-app')) {
      this.notifications.set(notificationId, notification);
      
      // Emit real-time to connected clients
      this.io.emit('notification:new', notification);
      console.log(`📢 In-app notification sent: ${title}`);
    }

    // Send email notification
    if (channels.includes('email')) {
      await this.sendEmailNotification(notification);
    }

    // Send desktop notification (via WebPush API)
    if (channels.includes('desktop')) {
      await this.sendDesktopNotification(notification);
    }

    return notificationId;
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification) {
    if (!this.emailTransporter) {
      console.log('📧 Email service not available, skipping email notification');
      return;
    }

    try {
      const { title, message, priority, type } = notification;
      
      // Determine recipients based on type and priority
      const recipients = this.getEmailRecipients(notification);
      
      const emailOptions = {
        from: process.env.SMTP_FROM || 'noreply@gov-tracker.lr',
        to: recipients.join(', '),
        subject: `[${priority.toUpperCase()}] ${title}`,
        html: this.generateEmailTemplate(notification)
      };

      await this.emailTransporter.sendMail(emailOptions);
      console.log(`📧 Email notification sent: ${title} to ${recipients.length} recipients`);
    } catch (error) {
      console.error('📧 Email notification failed:', error);
    }
  }

  /**
   * Send desktop notification via WebPush
   */
  async sendDesktopNotification(notification) {
    // TODO: Implement WebPush for desktop notifications
    console.log(`🖥️ Desktop notification: ${notification.title}`);
    
    // Emit to frontend for browser notification API
    this.io.emit('notification:desktop', {
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      icon: '/favicon.ico'
    });
  }

  /**
   * Get email recipients based on notification type
   */
  getEmailRecipients(notification) {
    const { type, priority } = notification;
    
    // Default government admin emails
    const adminEmails = [
      'admin@gov-tracker.lr',
      'fleet@gov-tracker.lr'
    ];

    const urgentEmails = [
      ...adminEmails,
      'director@gov-tracker.lr',
      'security@gov-tracker.lr'
    ];

    switch (type) {
      case 'security':
        return urgentEmails;
      case 'maintenance':
        return ['maintenance@gov-tracker.lr', ...adminEmails];
      case 'system':
        return ['it@gov-tracker.lr', ...adminEmails];
      default:
        return adminEmails;
    }
  }

  /**
   * Generate email template
   */
  generateEmailTemplate(notification) {
    const { title, message, type, priority, timestamp, data } = notification;
    
    const priorityColor = {
      urgent: '#dc2626',
      high: '#ea580c', 
      medium: '#d97706',
      low: '#65a30d'
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🏛️ Government Asset Tracker</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Republic of Liberia - Asset Management Alert</p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background: ${priorityColor[priority]}; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px;">
            ${priority} Priority - ${type}
          </div>
          
          <h2 style="color: #1f2937; margin: 0 0 10px 0;">${title}</h2>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px 0;">${message}</p>
          
          ${data.vehicleId ? `<p><strong>Vehicle:</strong> ${data.vehicleId}</p>` : ''}
          ${data.equipmentId ? `<p><strong>Equipment:</strong> ${data.equipmentId}</p>` : ''}
          ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Time:</strong> ${new Date(timestamp).toLocaleString()}<br>
              <strong>System:</strong> Government Asset Tracking Platform
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View in Platform
            </a>
          </div>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 12px;">
          Republic of Liberia - General Services Agency<br>
          Asset Tracking & Security Platform
        </div>
      </div>
    `;
  }

  // =============================================================================
  // SPECIFIC NOTIFICATION TRIGGERS
  // =============================================================================

  /**
   * GPS/Security Notifications
   */
  async notifyGPSAlert(vehicleId, alertType, location, data = {}) {
    await this.sendNotification({
      type: 'security',
      priority: 'urgent',
      title: `🚨 Vehicle Security Alert: ${vehicleId}`,
      message: `${alertType} detected for vehicle ${vehicleId} at location ${location}`,
      data: { vehicleId, location, alertType, ...data },
      channels: ['in-app', 'email', 'desktop']
    });
  }

  async notifySOSActivation(vehicleId, location, operatorName) {
    await this.sendNotification({
      type: 'security', 
      priority: 'urgent',
      title: `🆘 EMERGENCY: SOS Activated`,
      message: `SOS button pressed in vehicle ${vehicleId} by ${operatorName} at ${location}. Immediate response required.`,
      data: { vehicleId, location, operatorName, emergency: true },
      channels: ['in-app', 'email', 'desktop']
    });
  }

  /**
   * Maintenance Notifications  
   */
  async notifyMaintenanceDue(assetType, assetId, dueType, value) {
    const message = assetType === 'vehicle' 
      ? `Vehicle ${assetId} has reached ${value}km and requires maintenance`
      : `Equipment ${assetId} maintenance is due (${value} months interval)`;

    await this.sendNotification({
      type: 'maintenance',
      priority: 'high', 
      title: `🔧 Maintenance Due: ${assetId}`,
      message,
      data: { assetType, assetId, dueType, value },
      channels: ['in-app', 'email']
    });
  }

  async notifyDepreciationAlert(assetId, assetType, age, maxAge = 4) {
    await this.sendNotification({
      type: 'compliance',
      priority: 'medium',
      title: `📊 Depreciation Alert: ${assetId}`,
      message: `${assetType} ${assetId} is ${age} years old, approaching maximum depreciation period of ${maxAge} years`,
      data: { assetId, assetType, age, maxAge },
      channels: ['in-app', 'email']
    });
  }

  /**
   * Asset Management Notifications
   */
  async notifyAssetTransfer(assetId, fromMAC, toMAC, transferredBy) {
    await this.sendNotification({
      type: 'assignment',
      priority: 'medium',
      title: `🔄 Asset Transfer: ${assetId}`,
      message: `Asset ${assetId} transferred from ${fromMAC} to ${toMAC} by ${transferredBy}`,
      data: { assetId, fromMAC, toMAC, transferredBy },
      channels: ['in-app', 'email']
    });
  }

  async notifyNewAssetRequiresApproval(assetId, assetType, addedBy, mac) {
    await this.sendNotification({
      type: 'approval',
      priority: 'medium', 
      title: `📝 New Asset Requires Approval`,
      message: `New ${assetType} ${assetId} added by ${addedBy} to ${mac} requires administrative approval`,
      data: { assetId, assetType, addedBy, mac },
      channels: ['in-app', 'email']
    });
  }

  /**
   * System Health Notifications
   */
  async notifySystemError(errorType, details) {
    await this.sendNotification({
      type: 'system',
      priority: 'high',
      title: `⚠️ System Alert: ${errorType}`,
      message: `System issue detected: ${details}`,
      data: { errorType, details },
      channels: ['in-app', 'email']
    });
  }

  async notifyLowFuel(vehicleId, fuelLevel, location) {
    await this.sendNotification({
      type: 'operations',
      priority: 'medium',
      title: `⛽ Low Fuel Alert: ${vehicleId}`,
      message: `Vehicle ${vehicleId} fuel level is ${fuelLevel}% at ${location}`,
      data: { vehicleId, fuelLevel, location },
      channels: ['in-app']
    });
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const all = Array.from(this.notifications.values());
    return {
      total: all.length,
      unread: all.filter(n => !n.read).length,
      urgent: all.filter(n => n.priority === 'urgent').length,
      byType: {
        security: all.filter(n => n.type === 'security').length,
        maintenance: all.filter(n => n.type === 'maintenance').length,
        system: all.filter(n => n.type === 'system').length,
        assignment: all.filter(n => n.type === 'assignment').length
      }
    };
  }

  /**
   * Clean up old notifications (keep last 30 days)
   */
  cleanupOldNotifications() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    this.notifications.forEach((notif, id) => {
      if (new Date(notif.timestamp) < thirtyDaysAgo) {
        this.notifications.delete(id);
      }
    });
    
    console.log(`🧹 Cleaned up old notifications. Current count: ${this.notifications.size}`);
  }

  /**
   * Test notification (for development)
   */
  async sendTestNotification() {
    await this.sendNotification({
      type: 'system',
      priority: 'medium',
      title: '🧪 Test Notification',
      message: 'This is a test notification to verify the system is working properly.',
      data: { test: true },
      channels: ['in-app', 'email']
    });
  }
}

module.exports = NotificationSystem;
