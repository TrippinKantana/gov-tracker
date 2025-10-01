/**
 * Government User Account Management
 * View users, security settings, 2FA enrollment, audit logs
 */

import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  KeyIcon, 
  DevicePhoneMobileIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  badgeNumber: string;
  department: string;
  departmentId: string;
  roles: string[];
  clearanceLevel: 'standard' | 'elevated' | 'high' | 'restricted';
  isActive: boolean;
  lastLoginAt?: string;
  mfaEnabled: boolean;
  webauthnEnabled: boolean;
  totpEnabled: boolean;
  createdAt: string;
  failedLoginAttempts: number;
  accountLockedUntil?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'security'>('users');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Mock users data with government security features
      const mockUsers: User[] = [
        {
          id: 'user-super-admin',
          username: 'admin',
          email: 'admin@gov.lr',
          fullName: 'System Administrator',
          badgeNumber: 'GSA-ADMIN',
          department: 'General Services Agency',
          departmentId: 'DEPT003',
          roles: ['super_admin'],
          clearanceLevel: 'restricted',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          mfaEnabled: true,
          webauthnEnabled: true,
          totpEnabled: true,
          createdAt: '2023-01-01T00:00:00Z',
          failedLoginAttempts: 0
        },
        {
          id: 'user-macs-head-health',
          username: 'health.admin',
          email: 'admin@health.gov.lr',
          fullName: 'Dr. Sarah Johnson',
          badgeNumber: 'GSA-001',
          department: 'Ministry of Health',
          departmentId: 'DEPT001',
          roles: ['macs_head'],
          clearanceLevel: 'high',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          mfaEnabled: true,
          webauthnEnabled: false,
          totpEnabled: true,
          createdAt: '2023-02-15T00:00:00Z',
          failedLoginAttempts: 0
        },
        {
          id: 'user-defense-manager',
          username: 'defense.manager',
          email: 'manager@defense.gov.lr',
          fullName: 'General Robert Smith',
          badgeNumber: 'GSA-008',
          department: 'Ministry of Defense',
          departmentId: 'DEPT004',
          roles: ['department_manager'],
          clearanceLevel: 'high',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          mfaEnabled: false,
          webauthnEnabled: false,
          totpEnabled: false,
          createdAt: '2023-03-01T00:00:00Z',
          failedLoginAttempts: 0
        },
        {
          id: 'user-auditor',
          username: 'gov.auditor',
          email: 'auditor@audit.gov.lr',
          fullName: 'Jane Audit',
          badgeNumber: 'GSA-AUDIT',
          department: 'Government Audit Office',
          departmentId: 'DEPT005',
          roles: ['auditor'],
          clearanceLevel: 'restricted',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          mfaEnabled: true,
          webauthnEnabled: true,
          totpEnabled: true,
          createdAt: '2023-01-15T00:00:00Z',
          failedLoginAttempts: 0
        },
        {
          id: 'user-fleet-manager',
          username: 'fleet.manager',
          email: 'fleet@gsa.gov.lr',
          fullName: 'Michael Fleet',
          badgeNumber: 'GSA-FLEET',
          department: 'General Services Agency',
          departmentId: 'DEPT003',
          roles: ['fleet_manager'],
          clearanceLevel: 'elevated',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          mfaEnabled: false,
          webauthnEnabled: false,
          totpEnabled: false,
          createdAt: '2023-04-01T00:00:00Z',
          failedLoginAttempts: 2
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.roles.includes(filterRole);
    const matchesDepartment = filterDepartment === 'all' || user.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive) ||
                         (filterStatus === 'mfa_enabled' && user.mfaEnabled) ||
                         (filterStatus === 'locked' && user.accountLockedUntil);

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const getRoleColor = (roles: string[]) => {
    if (roles.includes('super_admin')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (roles.includes('org_admin')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    if (roles.includes('macs_head')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (roles.includes('auditor')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getClearanceColor = (level: string) => {
    switch (level) {
      case 'restricted': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'elevated': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const enrollMFA = async (userId: string, method: 'totp' | 'webauthn') => {
    try {
      if (method === 'totp') {
        console.log(`Enrolling TOTP for user ${userId}`);
        // Would call auth service TOTP enrollment
        alert('TOTP enrollment would open here - QR code and backup codes');
      } else {
        console.log(`Enrolling WebAuthn for user ${userId}`);
        // Would call WebAuthn enrollment
        alert('WebAuthn enrollment would open here - security key registration');
      }
    } catch (error) {
      console.error('MFA enrollment error:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Account Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Government authentication and security administration
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => alert('User registration would open here')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            User Accounts
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Security Settings
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Audit & Compliance
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 rounded-lg p-3">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-500 rounded-lg p-3">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">MFA Enabled</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.filter(u => u.mfaEnabled).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-orange-500 rounded-lg p-3">
                  <KeyIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Keys</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.filter(u => u.webauthnEnabled).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-red-500 rounded-lg p-3">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Clearance</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.filter(u => u.clearanceLevel === 'high' || u.clearanceLevel === 'restricted').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, username, email, badge number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="org_admin">Org Admin</option>
                    <option value="macs_head">MAC Head</option>
                    <option value="department_manager">Department Manager</option>
                    <option value="auditor">Auditor</option>
                    <option value="fleet_manager">Fleet Manager</option>
                    <option value="asset_manager">Asset Manager</option>
                    <option value="standard_user">Standard User</option>
                  </select>
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="mfa_enabled">MFA Enabled</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {!isLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Department & Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Security Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.fullName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username} • {user.badgeNumber}
                              </div>
                              <div className="text-xs text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.department}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.roles)}`}>
                              {user.roles[0]?.replace('_', ' ')}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getClearanceColor(user.clearanceLevel)}`}>
                              {user.clearanceLevel}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {user.mfaEnabled && (
                                <ShieldCheckIcon className="h-4 w-4 text-green-600" title="MFA Enabled" />
                              )}
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              {user.totpEnabled && (
                                <DevicePhoneMobileIcon className="h-3 w-3 text-blue-600" title="TOTP Enabled" />
                              )}
                              {user.webauthnEnabled && (
                                <KeyIcon className="h-3 w-3 text-green-600" title="Security Key Enabled" />
                              )}
                              {user.failedLoginAttempts > 0 && (
                                <span className="text-red-600">
                                  {user.failedLoginAttempts} failed attempts
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatLastLogin(user.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => alert(`Edit user ${user.username}`)}
                              className="text-green-600 hover:text-green-700 dark:text-green-400"
                              title="Edit User"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {!user.mfaEnabled && (
                              <button
                                onClick={() => enrollMFA(user.id, 'totp')}
                                className="text-orange-600 hover:text-orange-700 dark:text-orange-400"
                                title="Enable MFA"
                              >
                                <ShieldCheckIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Authentication Security</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Password Security</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Argon2id encryption</li>
                  <li>• 12+ character minimum</li>
                  <li>• Breach detection</li>
                  <li>• Account lockouts</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Multi-Factor Auth</h4>
                <ul className="text-sm text-green-800 dark:text-green-400 space-y-1">
                  <li>• TOTP Authenticator Apps</li>
                  <li>• Hardware Security Keys</li>
                  <li>• WebAuthn/FIDO2</li>
                  <li>• Backup codes</li>
                </ul>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Role-Based Access</h4>
                <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
                  <li>• Department scoping</li>
                  <li>• Permission matrix</li>
                  <li>• Least privilege</li>
                  <li>• Audit logging</li>
                </ul>
              </div>
            </div>
          </div>

          {/* MFA Enrollment Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">MFA Enrollment Status</h3>
            
            <div className="space-y-4">
              {users.filter(u => !u.mfaEnabled && (u.roles.includes('super_admin') || u.roles.includes('macs_head') || u.roles.includes('auditor'))).map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {user.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.fullName} ({user.badgeNumber})
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-400">
                        Privileged role requires MFA enrollment
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => enrollMFA(user.id, 'totp')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Setup TOTP
                    </button>
                    <button
                      onClick={() => enrollMFA(user.id, 'webauthn')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Add Security Key
                    </button>
                  </div>
                </div>
              ))}
              
              {users.filter(u => !u.mfaEnabled && (u.roles.includes('super_admin') || u.roles.includes('macs_head') || u.roles.includes('auditor'))).length === 0 && (
                <div className="text-center py-8">
                  <ShieldCheckIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">All Privileged Users Secured</h4>
                  <p className="text-gray-600 dark:text-gray-400">All users with privileged roles have MFA enabled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Authentication Audit Log</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Recent authentication and security events (NIST SP 800-63B compliant logging)
            </p>
            
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-300">Successful Login</p>
                    <p className="text-sm text-green-700 dark:text-green-400">admin@gov.lr - 30 minutes ago</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">SUCCESS</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">MFA Verification</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">health.admin - TOTP verified - 2 hours ago</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">MFA_SUCCESS</span>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-300">Failed Login Attempt</p>
                    <p className="text-sm text-red-700 dark:text-red-400">unknown.user - Invalid credentials - 1 hour ago</p>
                  </div>
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">FAILURE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowUserDetails(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Security Profile</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.fullName}</p>
                </div>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Badge Number</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedUser.badgeNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedUser.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Clearance Level</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">{selectedUser.clearanceLevel}</p>
                  </div>
                </div>

                {/* Security Status */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Security Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <ShieldCheckIcon className={`h-5 w-5 ${selectedUser.mfaEnabled ? 'text-green-600' : 'text-red-600'}`} />
                      <span className="text-sm">MFA: {selectedUser.mfaEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <DevicePhoneMobileIcon className={`h-5 w-5 ${selectedUser.totpEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="text-sm">TOTP: {selectedUser.totpEnabled ? 'Active' : 'Not Set'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <KeyIcon className={`h-5 w-5 ${selectedUser.webauthnEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-sm">Security Key: {selectedUser.webauthnEnabled ? 'Active' : 'Not Set'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">Role: {selectedUser.roles[0]?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* MFA Enrollment Actions */}
                {!selectedUser.mfaEnabled && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">MFA Enrollment Required</h4>
                    <p className="text-sm text-orange-800 dark:text-orange-400 mb-3">
                      This user's role requires multi-factor authentication for security compliance.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => enrollMFA(selectedUser.id, 'totp')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                      >
                        <DevicePhoneMobileIcon className="h-4 w-4" />
                        <span>Setup TOTP</span>
                      </button>
                      <button
                        onClick={() => enrollMFA(selectedUser.id, 'webauthn')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                      >
                        <KeyIcon className="h-4 w-4" />
                        <span>Add Security Key</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
