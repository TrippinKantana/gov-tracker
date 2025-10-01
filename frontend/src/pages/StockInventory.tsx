/**
 * Stock Inventory Management
 * Warehouse stock management with goods release functionality
 */

import { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  TruckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import GoodsReleaseModal from '../components/GoodsReleaseModal';
import DeliveryTrackingModal from '../components/DeliveryTrackingModal';
import AddStockItemModal from '../components/AddStockItemModal';

interface StockItem {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  supplier: string;
  receivedDate: string;
  expiryDate?: string;
  status: 'available' | 'reserved' | 'in_transit' | 'low_stock';
  minimumLevel: number;
  location: string; // Warehouse location
  batchNumber?: string;
  serialNumbers?: string[];
}

interface GoodsRelease {
  id: string;
  stockItemId: string;
  itemName: string;
  quantity: number;
  requestingMAC: string;
  destinationFacility: string;
  driverName: string;
  vehicleUsed: string;
  deliveryNote: string;
  approvedBy: string;
  releasedBy: string;
  releaseDate: string;
  estimatedDeliveryDate: string;
  status: 'released' | 'in_transit' | 'delivered' | 'confirmed';
  trackingNotes?: string;
}

const StockInventory = () => {
  const { user } = useAuth();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [goodsReleases, setGoodsReleases] = useState<GoodsRelease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'releases' | 'tracking' | 'warehouse'>('inventory');
  
  // Modal states
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<GoodsRelease | null>(null);

  // Warehouse management
  const [warehouseSections, setWarehouseSections] = useState([
    { id: 'WH-A-1', name: 'Warehouse A - Section 1', type: 'General Storage', capacity: 1000, currentStock: 150, temperature: 'Normal' },
    { id: 'WH-A-2', name: 'Warehouse A - Section 2', type: 'Furniture Storage', capacity: 500, currentStock: 200, temperature: 'Normal' },
    { id: 'WH-B-1', name: 'Warehouse B - Electronics Section', type: 'Electronics Storage', capacity: 300, currentStock: 45, temperature: 'Climate Controlled' },
    { id: 'WH-C-1', name: 'Warehouse C - Heavy Equipment', type: 'Heavy Equipment', capacity: 100, currentStock: 8, temperature: 'Normal' }
  ]);
  const [isAddWarehouseSectionOpen, setIsAddWarehouseSectionOpen] = useState(false);
  const [newWarehouseSection, setNewWarehouseSection] = useState({
    name: '',
    type: 'General Storage',
    capacity: 100,
    temperature: 'Normal'
  });

  useEffect(() => {
    loadStockData();
    loadGoodsReleases();
  }, []);

  const loadStockData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stock/inventory');
      const result = await response.json();
      if (result.success) {
        setStockItems(result.stock);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
      // Fallback to mock data
      setStockItems(mockStockData);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoodsReleases = async () => {
    try {
      const response = await fetch('/api/stock/releases');
      const result = await response.json();
      if (result.success) {
        setGoodsReleases(result.releases);
      }
    } catch (error) {
      console.error('Error loading goods releases:', error);
      // Fallback to mock data
      setGoodsReleases(mockReleasesData);
    }
  };

  // Mock data for development
  const mockStockData: StockItem[] = [
    {
      id: 'STK001',
      name: 'Office Chairs',
      category: 'Furniture',
      description: 'Ergonomic office chairs with wheels',
      quantity: 150,
      unitCost: 85.00,
      totalValue: 12750.00,
      supplier: 'Office Solutions Ltd',
      receivedDate: '2024-01-15',
      status: 'available',
      minimumLevel: 10,
      location: 'Warehouse A - Section 1',
      batchNumber: 'BATCH-2024-001'
    },
    {
      id: 'STK002',
      name: 'Desktop Computers',
      category: 'Electronics',
      description: 'Dell OptiPlex 7090 Desktop Computers',
      quantity: 45,
      unitCost: 650.00,
      totalValue: 29250.00,
      supplier: 'Dell Technologies',
      receivedDate: '2024-01-20',
      status: 'available',
      minimumLevel: 5,
      location: 'Warehouse B - Electronics Section',
      serialNumbers: ['DT001', 'DT002', 'DT003'] // Sample serials
    },
    {
      id: 'STK003',
      name: 'Generator 10KVA',
      category: 'Equipment',
      description: 'Portable diesel generator 10KVA capacity',
      quantity: 8,
      unitCost: 2500.00,
      totalValue: 20000.00,
      supplier: 'Power Solutions Inc',
      receivedDate: '2024-01-10',
      status: 'low_stock',
      minimumLevel: 3,
      location: 'Warehouse C - Heavy Equipment'
    }
  ];

  const mockReleasesData: GoodsRelease[] = [
    {
      id: 'REL001',
      stockItemId: 'STK001',
      itemName: 'Office Chairs',
      quantity: 20,
      requestingMAC: 'Ministry of Education',
      destinationFacility: 'Central School Complex',
      driverName: 'James Wilson',
      vehicleUsed: 'LBR-003-GOV',
      deliveryNote: 'DEL-2024-001',
      approvedBy: 'Director General',
      releasedBy: 'Warehouse Manager',
      releaseDate: '2024-01-25',
      estimatedDeliveryDate: '2024-01-25',
      status: 'in_transit'
    }
  ];

  // Filter stock items
  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'reserved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_transit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getReleaseStatusColor = (status: string) => {
    switch (status) {
      case 'released': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_transit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'delivered': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Stock Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Warehouse stock management and goods distribution to MAC facilities
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsAddStockModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'inventory', label: 'Stock Inventory', count: stockItems.length },
            { id: 'releases', label: 'Goods Releases', count: goodsReleases.length },
            { id: 'tracking', label: 'Delivery Tracking', count: goodsReleases.filter(r => r.status === 'in_transit').length },
            { id: 'warehouse', label: 'Warehouse Setup', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full text-xs ml-2">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Stock Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stock items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="Furniture">Furniture</option>
                <option value="Electronics">Electronics</option>
                <option value="Equipment">Equipment</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="low_stock">Low Stock</option>
                <option value="reserved">Reserved</option>
                <option value="in_transit">In Transit</option>
              </select>
            </div>
          </div>

          {/* Stock Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStockItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 rounded-lg p-2">
                        <CubeIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.category}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.quantity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Unit Cost:</span>
                      <span className="font-medium text-gray-900 dark:text-white">${item.unitCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                      <span className="font-medium text-gray-900 dark:text-white">${item.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedStockItem(item);
                        setIsReleaseModalOpen(true);
                      }}
                      disabled={item.quantity === 0}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      <TruckIcon className="h-4 w-4" />
                      <span>Release Goods</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goods Releases Tab */}
      {activeTab === 'releases' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Goods Releases</h3>
              
              {goodsReleases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TruckIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No goods releases yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goodsReleases.map(release => (
                    <div key={release.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {release.quantity} × {release.itemName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            To: {release.requestingMAC} → {release.destinationFacility}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReleaseStatusColor(release.status)}`}>
                          {release.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Driver:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{release.driverName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{release.vehicleUsed}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Released:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{new Date(release.releaseDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedRelease(release);
                              setIsTrackingModalOpen(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>Track</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Deliveries</h3>
              
              {goodsReleases.filter(r => r.status === 'in_transit' || r.status === 'delivered').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No active deliveries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goodsReleases
                    .filter(r => r.status === 'in_transit' || r.status === 'delivered')
                    .map(release => (
                      <div key={release.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {release.quantity} × {release.itemName}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <span>{release.requestingMAC}</span>
                              <ArrowRightIcon className="h-4 w-4" />
                              <span>{release.destinationFacility}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReleaseStatusColor(release.status)}`}>
                              {release.status.replace('_', ' ')}
                            </span>
                            
                            {release.status === 'delivered' && (
                              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                                <CheckCircleIcon className="h-4 w-4" />
                                <span>Confirm Receipt</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Setup Tab */}
      {activeTab === 'warehouse' && (
        <div className="space-y-6">
          {/* Warehouse Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">GSA Warehouse Sections</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage warehouse locations and storage sections</p>
              </div>
              <button
                onClick={() => setIsAddWarehouseSectionOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Section</span>
              </button>
            </div>

            {/* Warehouse Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouseSections.map(section => (
                <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">{section.name}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full">
                      {section.type}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                      <span className="text-gray-900 dark:text-white">{section.capacity.toLocaleString()} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                      <span className="text-gray-900 dark:text-white">{section.currentStock.toLocaleString()} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Utilization:</span>
                      <span className="text-gray-900 dark:text-white">
                        {Math.round((section.currentStock / section.capacity) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                      <span className="text-gray-900 dark:text-white">{section.temperature}</span>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (section.currentStock / section.capacity) > 0.8 ? 'bg-red-500' :
                          (section.currentStock / section.capacity) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((section.currentStock / section.capacity) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Warehouse Section Modal */}
          {isAddWarehouseSectionOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsAddWarehouseSectionOpen(false)} />
                
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Warehouse Section</h3>
                    <button 
                      onClick={() => setIsAddWarehouseSectionOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Section Name *
                      </label>
                      <input
                        type="text"
                        value={newWarehouseSection.name}
                        onChange={(e) => setNewWarehouseSection(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        placeholder="e.g., Warehouse D - Medical Supplies"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Storage Type *
                        </label>
                        <select
                          value={newWarehouseSection.type}
                          onChange={(e) => setNewWarehouseSection(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        >
                          <option value="General Storage">General Storage</option>
                          <option value="Furniture Storage">Furniture Storage</option>
                          <option value="Electronics Storage">Electronics Storage</option>
                          <option value="Heavy Equipment">Heavy Equipment</option>
                          <option value="Medical Supplies">Medical Supplies</option>
                          <option value="Office Supplies">Office Supplies</option>
                          <option value="Cold Storage">Cold Storage</option>
                          <option value="Secure Storage">Secure Storage</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Capacity (units)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newWarehouseSection.capacity}
                          onChange={(e) => setNewWarehouseSection(prev => ({ ...prev, capacity: parseInt(e.target.value) || 100 }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temperature Control
                      </label>
                      <select
                        value={newWarehouseSection.temperature}
                        onChange={(e) => setNewWarehouseSection(prev => ({ ...prev, temperature: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      >
                        <option value="Normal">Normal Temperature</option>
                        <option value="Climate Controlled">Climate Controlled</option>
                        <option value="Cold Storage">Cold Storage</option>
                        <option value="Refrigerated">Refrigerated</option>
                      </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsAddWarehouseSectionOpen(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newSection = {
                            id: `WH-${Date.now()}`,
                            ...newWarehouseSection,
                            currentStock: 0
                          };
                          setWarehouseSections(prev => [...prev, newSection]);
                          setNewWarehouseSection({ name: '', type: 'General Storage', capacity: 100, temperature: 'Normal' });
                          setIsAddWarehouseSectionOpen(false);
                          console.log('🏭 New warehouse section added:', newSection);
                        }}
                        disabled={!newWarehouseSection.name.trim()}
                        className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Section
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddStockItemModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        onSuccess={(newStockItem) => {
          setStockItems(prev => [newStockItem, ...prev]);
          setIsAddStockModalOpen(false);
        }}
      />

      <GoodsReleaseModal
        isOpen={isReleaseModalOpen}
        onClose={() => {
          setIsReleaseModalOpen(false);
          setSelectedStockItem(null);
        }}
        stockItem={selectedStockItem}
        onSuccess={(release) => {
          setGoodsReleases(prev => [release, ...prev]);
          loadStockData(); // Refresh stock quantities
        }}
      />

      <DeliveryTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setSelectedRelease(null);
        }}
        release={selectedRelease}
        onStatusUpdate={(updatedRelease) => {
          setGoodsReleases(prev => 
            prev.map(r => r.id === updatedRelease.id ? updatedRelease : r)
          );
        }}
      />
    </div>
  );
};

export default StockInventory;
