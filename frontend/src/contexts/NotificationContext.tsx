/**
 * Notification Context
 * Manages notification state and counts across the application
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io } from 'socket.io-client';

interface Notification {
  id: string;
  type: 'security' | 'maintenance' | 'system' | 'assignment' | 'compliance';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  isLoading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load initial notifications
    loadNotifications();

    // Setup real-time notifications via Socket.IO
    const socket = io('http://localhost:5000');
    
    socket.on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      setTotalCount(prev => prev + 1);
      
      console.log('🔔 New notification received:', notification.title);
      
      // Show desktop notification for urgent alerts
      if (notification.priority === 'urgent' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      }
    });

    socket.on('notification:desktop', (data) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: data.icon || '/favicon.ico'
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      const result = await response.json();
      
      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unread);
        setTotalCount(result.notifications.length);
        console.log(`📊 Loaded ${result.notifications.length} notifications, ${result.unread} unread`);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, { 
        method: 'PUT' 
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log(`✅ Marked notification ${notificationId} as read`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', { 
        method: 'PUT' 
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
        console.log('✅ Marked all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
