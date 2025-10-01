import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './contexts/AppContext'
import { AssetProvider } from './contexts/AssetContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { useEffect } from 'react'
import { notificationService } from './services/notificationService'
import Auth0Login from './pages/Auth0Login'
import RoleBasedDashboard from './components/RoleBasedDashboard'
import MapView from './pages/MapView'
import Departments from './pages/Departments'

import Vehicles from './pages/Vehicles'
import Facilities from './pages/Facilities'
import Equipments from './pages/Equipments'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import StockInventory from './pages/StockInventory'
import PersonnelManagement from './pages/PersonnelManagement'
import HR from './pages/HR'
import AccountSettings from './pages/Auth0AccountSettings'
import Sidebar from './components/Sidebar'
import AppHeader from './components/AppHeader'
import ProtectedRoute from './components/ProtectedRoute'

const AppLayout = () => {
  const { isSidebarCollapsed } = useApp();
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize notification service and create test notifications
  useEffect(() => {
    if (isAuthenticated) {
      // Create some test notifications to demonstrate the system
      setTimeout(() => {
        notificationService.createTestNotification('vehicle');
      }, 2000);
      
      setTimeout(() => {
        notificationService.createTestNotification('equipment');
      }, 4000);
      
      setTimeout(() => {
        notificationService.createTestNotification('facility');
      }, 6000);
    }
  }, [isAuthenticated]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading government system...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Auth0Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className={`transition-all duration-300 ml-0 ${
        isSidebarCollapsed 
          ? 'lg:ml-16' 
          : 'lg:ml-64'
      }`}>
        {/* App Header */}
        <AppHeader />
        
        {/* Main Content */}
        <main className="overflow-auto" style={{ height: 'calc(100vh - 73px)' }}>
          <div className="h-full">
            <Routes>
              <Route path="/" element={<RoleBasedDashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/stock" element={<StockInventory />} />
              <Route path="/personnel" element={<PersonnelManagement />} />
              <Route 
                path="/hr" 
                element={
                  <ProtectedRoute blockDepartmentAdmin={true}>
                    <HR />
                  </ProtectedRoute>
                } 
              />
              <Route path="/account" element={<AccountSettings />} />
              <Route 
                path="/departments" 
                element={
                  <ProtectedRoute blockDepartmentAdmin={true}>
                    <Departments />
                  </ProtectedRoute>
                } 
              />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/facilities" element={<Facilities />} />
              <Route path="/equipments" element={<Equipments />} />
              {/* Legacy routes for backward compatibility */}
              <Route path="/employees" element={<PersonnelManagement />} />
              <Route path="/users" element={<PersonnelManagement />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AssetProvider>
          <AppProvider>
            <Router>
              <AppLayout />
            </Router>
          </AppProvider>
        </AssetProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
