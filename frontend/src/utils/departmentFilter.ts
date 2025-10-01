/**
 * Department/MAC filtering utilities for role-based access control
 */

import { User } from '../contexts/AuthContext'

export interface DepartmentFilterProps {
  user: User | null
  isAuthenticated: boolean
}

/**
 * Check if user has MAC/Department assignment
 */
export const hasValidMACAssignment = (user: User | null): boolean => {
  if (!user) return false
  return !!(user.department && user.department !== 'Not assigned' && user.department !== 'No MAC Assigned')
}

/**
 * Check if user is super admin or IT admin (full access)
 */
export const isSuperOrITAdmin = (user: User | null): boolean => {
  if (!user) return false
  return user.roles.includes('super_admin') || 
         user.roles.includes('admin') || 
         user.roles.includes('it_admin') || 
         user.roles.includes('system_admin')
}

/**
 * Check if user is department admin
 */
export const isDepartmentAdmin = (user: User | null): boolean => {
  if (!user) return false
  return user.roles.includes('department_admin') || 
         user.roles.includes('mac_admin')
}

/**
 * Filter array of items by department (for department admins)
 */
export const filterByDepartment = <T extends { department?: string }>(
  items: T[],
  user: User | null
): T[] => {
  if (!user) return []
  
  // Super/IT admins see everything
  if (isSuperOrITAdmin(user)) {
    return items
  }
  
  // Department admins with MAC assignment see only their department
  if (isDepartmentAdmin(user) && hasValidMACAssignment(user)) {
    return items.filter(item => item.department === user.department)
  }
  
  // Department admins without MAC assignment see nothing
  if (isDepartmentAdmin(user) && !hasValidMACAssignment(user)) {
    return []
  }
  
  // Default: no access
  return []
}

/**
 * Get empty state message based on user role and MAC assignment
 */
export const getEmptyStateMessage = (user: User | null, itemType: string): {
  title: string
  message: string
  showContactAdmin: boolean
} => {
  if (!user) {
    return {
      title: 'Not Authenticated',
      message: 'Please log in to view this content.',
      showContactAdmin: false
    }
  }
  
  if (isDepartmentAdmin(user) && !hasValidMACAssignment(user)) {
    return {
      title: `No ${itemType} Available`,
      message: 'You need to be assigned to a MAC by a Super Administrator to access department resources.',
      showContactAdmin: true
    }
  }
  
  if (isDepartmentAdmin(user) && hasValidMACAssignment(user)) {
    return {
      title: `No ${itemType} in ${user.department}`,
      message: `Your MAC (${user.department}) doesn't have any ${itemType.toLowerCase()} assigned yet.`,
      showContactAdmin: false
    }
  }
  
  return {
    title: `No ${itemType} Available`,
    message: `No ${itemType.toLowerCase()} found in the system.`,
    showContactAdmin: false
  }
}
