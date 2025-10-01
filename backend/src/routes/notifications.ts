import express from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Validation middleware
const handleValidation = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return next();
};

// Email transporter setup - Disabled for government deployment
// Will be configured with government SMTP when infrastructure is ready
let emailTransporter: nodemailer.Transporter | null = null;

// Mock email service for development
const MOCK_EMAIL_MODE = !process.env.SMTP_HOST || !process.env.SMTP_USER;

if (!MOCK_EMAIL_MODE) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
    console.log('📧 Government email service configured');
  } catch (error) {
    console.warn('📧 Email service configuration failed:', error);
  }
} else {
  console.log('📧 Email service in mock mode - configure SMTP_HOST and SMTP_USER for production');
}

// POST /api/notifications/email - Send email notification
router.post('/email',
  [
    body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('assetName').notEmpty().withMessage('Asset name is required'),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { recipients, subject, message, assetName, department, location, dueDate, metadata } = req.body;

      // Mock mode for development/government deployment without email setup
      if (MOCK_EMAIL_MODE || !emailTransporter) {
        console.log('📧 MOCK EMAIL - Would send notification:', {
          recipients,
          subject,
          message,
          assetName,
          department
        });

        // Simulate successful email sending
        const mockResults = recipients.map((recipient: string) => ({
          recipient,
          success: true,
          messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));

        return res.json({
          success: true,
          message: `Mock email sent to ${recipients.length} recipients (Government SMTP not configured)`,
          results: mockResults
        });
      }

      // Create rich HTML email content
      const htmlContent = createMaintenanceEmailHTML({
        subject,
        message,
        assetName,
        department,
        location,
        dueDate,
        metadata
      });

      // Send email to all recipients
      const emailPromises = recipients.map(async (recipient: string) => {
        try {
          const info = await emailTransporter!.sendMail({
            from: `"Government Asset Tracker" <${process.env.SMTP_USER}>`,
            to: recipient,
            subject: `[GAT] ${subject}`,
            text: message,
            html: htmlContent
          });

          console.log(`📧 Email sent to ${recipient}:`, info.messageId);
          return { recipient, success: true, messageId: info.messageId };
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          return { recipient, success: false, error: (error as Error).message };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;

      return res.json({
        success: true,
        message: `Email sent to ${successCount}/${recipients.length} recipients`,
        results
      });

    } catch (error) {
      console.error('Error sending email notifications:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send email notifications' 
      });
    }
  }
);

// GET /api/notifications/test-email - Test email configuration
router.get('/test-email', async (_req: express.Request, res: express.Response) => {
  try {
    if (MOCK_EMAIL_MODE) {
      return res.json({
        success: true,
        message: 'Email service in mock mode - ready for government SMTP configuration',
        config: {
          mode: 'mock',
          host: process.env.SMTP_HOST || 'not configured',
          port: process.env.SMTP_PORT || 'not configured',
          user: process.env.SMTP_USER || 'not configured',
          note: 'Configure SMTP_HOST and SMTP_USER environment variables for production email'
        }
      });
    }

    if (!emailTransporter) {
      return res.status(503).json({ 
        success: false, 
        error: 'Government email service not configured' 
      });
    }

    // Verify SMTP connection
    await emailTransporter.verify();

    return res.json({
      success: true,
      message: 'Government email service is configured and working',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '***configured***' : 'not configured'
      }
    });

  } catch (error) {
    console.error('Email service test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Government email service test failed',
      details: (error as Error).message
    });
  }
});

// POST /api/notifications/test-send - Send test email
router.post('/test-send',
  [
    body('recipient').isEmail().withMessage('Valid recipient email is required'),
    handleValidation
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const { recipient } = req.body;

      if (!emailTransporter) {
        return res.status(503).json({ 
          success: false, 
          error: 'Email service not configured' 
        });
      }

      const testEmailContent = createTestEmailHTML();

      const info = await emailTransporter.sendMail({
        from: `"Government Asset Tracker" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: '[GAT] Test Email - System Working',
        html: testEmailContent
      });

      return res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
        recipient
      });

    } catch (error) {
      console.error('Test email failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: (error as Error).message
      });
    }
  }
);

// GET /api/notifications/settings - Get notification settings
router.get('/settings', (_req: express.Request, res: express.Response) => {
  return res.json({
    success: true,
    settings: {
      emailEnabled: !!emailTransporter,
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      defaultThresholds: {
        vehicleMaintenanceDays: 90,
        equipmentMaintenanceDays: 180,
        facilityInspectionDays: 365,
        vehicleMileageInterval: 5000
      }
    }
  });
});

// Helper function to create HTML email content for maintenance notifications
function createMaintenanceEmailHTML(params: {
  subject: string;
  message: string;
  assetName: string;
  department?: string;
  location?: string;
  dueDate?: string;
  metadata?: any;
}) {
  const { subject, message, assetName, department, location, dueDate, metadata } = params;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .header {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          padding: 30px 20px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 0 0 10px 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .alert-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .alert-box.high {
          background: #fff7ed;
          border-color: #fed7aa;
        }
        .alert-box.critical {
          background: #fef2f2;
          border-color: #fca5a5;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 25px 0;
        }
        .info-item {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #2563eb;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .info-value {
          color: #1f2937;
          font-size: 16px;
        }
        .action-button {
          display: inline-block;
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .metadata {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .metadata h4 {
          margin: 0 0 10px 0;
          color: #374151;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 ${subject}</h1>
        <p>Government Asset Tracking System Alert</p>
      </div>
      
      <div class="content">
        <div class="alert-box ${metadata?.daysOverdue > 0 ? 'critical' : 'high'}">
          <h2 style="margin: 0 0 15px 0; color: #dc2626;">⚠️ Maintenance Required</h2>
          <p style="margin: 0; font-size: 18px; font-weight: 600;">${message}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Asset</div>
            <div class="info-value">${assetName}</div>
          </div>
          
          ${department ? `
          <div class="info-item">
            <div class="info-label">Department</div>
            <div class="info-value">${department}</div>
          </div>
          ` : ''}
          
          ${location ? `
          <div class="info-item">
            <div class="info-label">Location</div>
            <div class="info-value">${location}</div>
          </div>
          ` : ''}
          
          ${dueDate ? `
          <div class="info-item">
            <div class="info-label">Due Date</div>
            <div class="info-value">${new Date(dueDate).toLocaleDateString()}</div>
          </div>
          ` : ''}
        </div>
        
        ${metadata ? `
        <div class="metadata">
          <h4>Additional Information</h4>
          ${metadata.daysOverdue ? `<p><strong>Days Overdue:</strong> ${metadata.daysOverdue} days</p>` : ''}
          ${metadata.lastServiceDate ? `<p><strong>Last Service:</strong> ${new Date(metadata.lastServiceDate).toLocaleDateString()}</p>` : ''}
          ${metadata.mileage ? `<p><strong>Current Mileage:</strong> ${metadata.mileage.toLocaleString()} km</p>` : ''}
          ${metadata.maintenanceType ? `<p><strong>Maintenance Type:</strong> ${metadata.maintenanceType.replace('_', ' ')}</p>` : ''}
        </div>
        ` : ''}
        
        <p><strong>Action Required:</strong> Please schedule maintenance for this asset as soon as possible to ensure compliance and safety.</p>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="action-button">
          🔗 Access Asset Tracker
        </a>
        
        <div class="footer">
          <p>This is an automated notification from the Government Asset Tracking System.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>If you believe this notification was sent in error, please contact your system administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to create test email content
function createTestEmailHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .header {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 30px 20px;
          border-radius: 10px;
          text-align: center;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Test Email Successful</h1>
        <p>Government Asset Tracking System</p>
      </div>
      
      <div class="content">
        <p>This is a test email from the Government Asset Tracking System.</p>
        <p>If you received this email, the notification system is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Email service: Operational</li>
          <li>SMTP configuration: Working</li>
          <li>Timestamp: ${new Date().toLocaleString()}</li>
        </ul>
      </div>
    </body>
    </html>
  `;
}

export default router;
