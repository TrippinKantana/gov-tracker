/**
 * In-Map Notification System
 * Professional notifications that don't break fullscreen
 */

import { useState, useEffect } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  duration?: number
}

interface MapNotificationProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

const MapNotification = ({ notifications, onDismiss }: MapNotificationProps) => {
  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'warning':
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
      default:
        return <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
    }
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[9998] space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm max-w-md animate-slide-down ${getNotificationStyles(notification.type)}`}
        >
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold">{notification.title}</h4>
            <p className="text-sm mt-1">{notification.message}</p>
          </div>
          
          <button
            onClick={() => onDismiss(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      
      <style jsx="true">{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default MapNotification
