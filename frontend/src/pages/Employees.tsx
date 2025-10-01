import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import AddEmployeeModal from '../components/AddEmployeeModal';
import ViewEmployeeModal from '../components/ViewEmployeeModal';
import DeleteEmployeeModal from '../components/DeleteEmployeeModal';
import SuccessConfirmationDialog from '../components/SuccessConfirmationDialog';

const Employees = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  // Dropdown functionality removed - using clickable rows
  
  // Data states
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeForDelete, setSelectedEmployeeForDelete] = useState<{
    id: string;
    fullName: string;
    badgeNumber: string;
    department: string;
    position?: string;
    assignedAssets?: number;
  } | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    title: string;
    message: string;
    details: { label: string; value: string; }[];
  }>({
    title: '',
    message: '',
    details: []
  });
  
  // Handler for modal success
  const handleModalSuccess = (employeeData?: any) => {
    console.log('Employee added successfully!', employeeData);
    
    // Set success dialog data
    setSuccessData({
      title: 'Employee Created Successfully',
      message: 'The new employee has been added to the government asset tracking system.',
      details: employeeData ? [
        { label: 'Employee Name', value: employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}` },
        { label: 'Badge Number', value: employeeData.badgeNumber },
        { label: 'Department', value: employeeData.department },
        { label: 'Role', value: employeeData.role },
        { label: 'Email', value: employeeData.email }
      ] : []
    });
    
    setIsSuccessDialogOpen(true);
    fetchEmployees(); // Refresh the employee list
  };

  // Fetch employees from API
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching employees from API...');
      const response = await fetch('http://localhost:5000/api/employees');
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Employees fetched from API:', result.employees);
        setEmployees(result.employees);
      } else {
        throw new Error(result.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      // Fallback to mock data if API fails
      setEmployees(mockEmployees);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Click to view handler
  const handleRowClick = (employeeId: string) => {
    console.log(`Opening employee details for ${employeeId}`);
    setSelectedEmployeeId(employeeId);
    setIsViewModalOpen(true);
  };

  // Handle employee actions from modal
  const handleEditEmployee = (employeeId: string) => {
    console.log(`Opening edit modal for employee ${employeeId}`);
    alert(`Edit Employee ${employeeId} - Edit modal will open here.`);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    console.log(`Opening delete modal for employee ${employeeId}`);
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setSelectedEmployeeForDelete({
        id: employee.id,
        fullName: employee.fullName || employee.name,
        badgeNumber: employee.badgeNumber,
        department: employee.department,
        position: employee.position,
        assignedAssets: employee.assignedAssets || 0
      });
      setIsDeleteModalOpen(true);
    }
  };

  const handleViewOnMap = (employeeId: string) => {
    console.log(`Viewing employee ${employeeId} department on map`);
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      // Navigate to departments map focused on employee's department
      navigate('/departments', { 
        state: { 
          activeTab: 'map',
          focusDepartment: employee.department,
          highlightEmployee: employeeId
        } 
      });
    }
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    console.log('Employee deleted successfully!');
    
    setSuccessData({
      title: 'Employee Deleted Successfully',
      message: 'The employee has been permanently removed from the government asset tracking system.',
      details: []
    });
    
    setIsSuccessDialogOpen(true);
    // In a real app, this would refresh the employee list
  };

  // Dropdown functionality removed - using clickable rows instead

  // Sample employee data
  const mockEmployees = [
    {
      id: 'EMP001',
      name: 'Dr. Sarah Johnson',
      position: 'Health Director',
      department: 'Ministry of Health',
      badgeNumber: 'GSA-001',
      email: 'sarah.johnson@health.gov.lr',
      phone: '+231-XXX-XXXX',
      status: 'active',
      lastSeen: '2024-01-15 09:30',
      assignedAssets: 3
    },
    {
      id: 'EMP002',
      name: 'John Doe',
      position: 'Field Officer',
      department: 'Ministry of Agriculture',
      badgeNumber: 'GSA-002',
      email: 'john.doe@agriculture.gov.lr',
      phone: '+231-XXX-XXXX',
      status: 'active',
      lastSeen: '2024-01-15 08:15',
      assignedAssets: 5
    },
    {
      id: 'EMP003',
      name: 'Mary Williams',
      position: 'IT Coordinator',
      department: 'General Services Agency',
      badgeNumber: 'GSA-003',
      email: 'mary.williams@gsa.gov.lr',
      phone: '+231-XXX-XXXX',
      status: 'on_leave',
      lastSeen: '2024-01-12 17:00',
      assignedAssets: 2
    }
  ];

  // Initialize employees with mock data for now, but make it consistent
  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.length > 0 ? employees.filter(employee => {
    const employeeName = employee.fullName || employee.name || '';
    const employeeStatus = employee.isActive !== undefined ? (employee.isActive ? 'active' : 'inactive') : employee.status;
    
    const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.badgeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || employeeStatus === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  }) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const departments = [...new Set(employees.map(emp => emp.department))];

  // handleAction removed - using clickable rows instead

  // ActionDropdown removed - using clickable rows instead

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage government personnel and asset assignments</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{isLoading ? '-' : employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '-' : employees.filter(emp => emp.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 rounded-lg p-3">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On Leave</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {mockEmployees.filter(emp => emp.status === 'on_leave').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets Assigned</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {mockEmployees.reduce((total, emp) => total + emp.assignedAssets, 0)}
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
                placeholder="Search employees by name, badge, department, or position..."
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
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
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
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Assets Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee) => (
                <tr 
                  key={employee.id} 
                  onClick={() => handleRowClick(employee.id)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {(employee.fullName || employee.name || 'N/A').split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.fullName || employee.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Badge: {employee.badgeNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {employee.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {employee.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.isActive !== undefined ? (employee.isActive ? 'active' : 'inactive') : employee.status)}`}>
                      {employee.isActive !== undefined ? (employee.isActive ? 'active' : 'inactive') : (employee.status?.replace('_', ' ') || 'unknown')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {employee.assignedAssets || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {employee.lastSeen || employee.updatedAt || 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No employees found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* View Employee Modal */}
      <ViewEmployeeModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        employeeId={selectedEmployeeId}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
        onViewOnMap={handleViewOnMap}
      />

      {/* Delete Employee Modal */}
      <DeleteEmployeeModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        employee={selectedEmployeeForDelete}
      />

      {/* Success Confirmation Dialog */}
      <SuccessConfirmationDialog
        isOpen={isSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
        title={successData.title}
        message={successData.message}
        details={successData.details}
        actionLabel="View All Employees"
        onAction={() => {
          // Could navigate to employee list or refresh data
          console.log('View all employees');
        }}
      />
    </div>
  );
};

export default Employees;
