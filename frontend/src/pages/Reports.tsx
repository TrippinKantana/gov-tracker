/**
 * Reports Page
 * Central hub for all report generation
 */

import { useState, useEffect } from 'react';
import { DocumentArrowDownIcon, ChartBarIcon, ClipboardDocumentListIcon, CalendarIcon, UserIcon, FunnelIcon, EyeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ReportGenerator from '../components/ReportGenerator';
import DrillDownReportGenerator from '../components/DrillDownReportGenerator';
import { useAuth } from '../contexts/AuthContext';
import { isDepartmentAdmin, hasValidMACAssignment } from '../utils/departmentFilter';

const Reports = () => {
    const { user } = useAuth();
    const [isReportGeneratorOpen, setIsReportGeneratorOpen] = useState(false);
    const [isDrillDownReportOpen, setIsDrillDownReportOpen] = useState(false);
    const [recentReports, setRecentReports] = useState<any[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(false);

    // Report filtering
    const [reportFilter, setReportFilter] = useState({
        search: '',
        type: 'all',
        mac: 'all',
        period: 'all'
    });

    // Load recent reports
    useEffect(() => {
        loadRecentReports();
    }, []);

    const loadRecentReports = async () => {
        setIsLoadingReports(true);
        try {
            const response = await fetch('/api/reports/recent');
            const result = await response.json();
            if (result.success) {
                setRecentReports(result.reports);
            }
        } catch (error) {
            console.error('Error loading recent reports:', error);
        } finally {
            setIsLoadingReports(false);
        }
    };

    const handleReportGenerated = () => {
        setIsReportGeneratorOpen(false);
        loadRecentReports(); // Refresh recent reports
    };

    const viewReport = async (report: any) => {
        try {
            console.log('📄 Viewing report:', report.filename);

            // Re-generate and download the report with correct format
            const reportRequest = {
                reportType: report.type.includes('-') ? report.type.split('-')[1] : report.type,
                macName: report.macName,
                facilityName: report.facilityName,
                dateRange: {
                    label: report.period
                },
                generatedBy: user?.name || user?.email,
                generatedAt: new Date().toISOString()
            };

            const endpoint = report.id.startsWith('DRILL-') ? '/api/reports/drill-down' : '/api/reports/generate';

            console.log('🎨 Re-generating beautiful report with request:', reportRequest);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportRequest)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = report.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                console.log('✅ Beautiful report re-downloaded successfully');
            } else {
                const errorText = await response.text();
                console.error('❌ Server error:', response.status, errorText);
                throw new Error(`Failed to re-generate report: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error viewing report:', error);
            alert('Failed to view report. Please try again.');
        }
    };

    // Filter reports based on search and filter criteria
    const filteredReports = recentReports.filter(report => {
        const matchesSearch = !reportFilter.search ||
            report.type.toLowerCase().includes(reportFilter.search.toLowerCase()) ||
            report.macName.toLowerCase().includes(reportFilter.search.toLowerCase()) ||
            (report.facilityName && report.facilityName.toLowerCase().includes(reportFilter.search.toLowerCase())) ||
            (report.itemName && report.itemName.toLowerCase().includes(reportFilter.search.toLowerCase()));

        const matchesType = reportFilter.type === 'all' ||
            (reportFilter.type === 'aggregate' && !report.id.startsWith('DRILL-')) ||
            (reportFilter.type === 'drill-down' && report.id.startsWith('DRILL-')) ||
            report.type.includes(reportFilter.type);

        const matchesMAC = reportFilter.mac === 'all' || report.macName === reportFilter.mac;

        const matchesPeriod = reportFilter.period === 'all' || report.period.includes(reportFilter.period);

        return matchesSearch && matchesType && matchesMAC && matchesPeriod;
    });

    // Get unique values for filter dropdowns
    const uniqueMACs = [...new Set(recentReports.map(r => r.macName))];
    const uniquePeriods = [...new Set(recentReports.map(r => r.period))];
    const uniqueTypes = [...new Set(recentReports.map(r =>
        r.id.startsWith('DRILL-') ? 'drill-down' : 'aggregate'
    ))];

    const reportTypes = [
        {
            id: 'fleet',
            title: 'Fleet Reports',
            description: 'Vehicle inventory, maintenance records, GPS tracking data',
            icon: '🚗',
            color: 'bg-green-500'
        },
        {
            id: 'assets',
            title: 'Assets Reports',
            description: 'Equipment and furniture inventory, condition reports',
            icon: '💻',
            color: 'bg-purple-500'
        },
        {
            id: 'facilities',
            title: 'Facilities Reports',
            description: 'Building inventory, capacity reports, equipment allocation',
            icon: '🏢',
            color: 'bg-blue-500'
        },
        {
            id: 'stock',
            title: 'Stock Inventory',
            description: 'Stock levels, procurement records, distribution tracking',
            icon: '📦',
            color: 'bg-amber-500'
        }
    ];

    const timeRangePresets = [
        { label: 'Current Month', value: 'current_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'Year-to-Date', value: 'ytd' },
        { label: 'Last Year', value: 'last_year' },
        { label: 'Custom Range', value: 'custom' }
    ];

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Reports & Analytics
                        {isDepartmentAdmin(user) && hasValidMACAssignment(user) && (
                            <span className="ml-3 text-sm font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full">
                                {user?.department}
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Generate comprehensive reports with flexible filtering and time ranges
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsReportGeneratorOpen(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        <span>Aggregate Reports</span>
                    </button>

                    <button
                        onClick={() => setIsDrillDownReportOpen(true)}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                        <FunnelIcon className="h-5 w-5" />
                        <span>Drill-Down Reports</span>
                    </button>
                </div>
            </div>

            {/* Quick Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportTypes.map(report => (
                    <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                                {report.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{report.description}</p>
                        <button
                            onClick={() => setIsReportGeneratorOpen(true)}
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Generate {report.title.split(' ')[0]} Report
                        </button>
                    </div>
                ))}
            </div>

            {/* Recent Reports Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <ChartBarIcon className="h-6 w-6" />
                            <span>Recent Reports</span>
                            {recentReports.length > 0 && (
                                <span className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded-full text-sm">
                                    {recentReports.length}
                                </span>
                            )}
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Click 👁️ to view/download reports
                        </div>
                    </div>
                </div>

                {/* Report Filters */}
                {recentReports.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    value={reportFilter.search}
                                    onChange={(e) => setReportFilter(prev => ({ ...prev, search: e.target.value }))}
                                    className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                                />
                            </div>

                            {/* Type Filter */}
                            <select
                                value={reportFilter.type}
                                onChange={(e) => setReportFilter(prev => ({ ...prev, type: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                            >
                                <option value="all">All Report Types</option>
                                <option value="aggregate">Aggregate Reports</option>
                                <option value="drill-down">Drill-Down Reports</option>
                                <option value="fleet">Fleet Reports</option>
                                <option value="assets">Assets Reports</option>
                                <option value="facilities">Facilities Reports</option>
                                <option value="stock">Stock Inventory</option>
                            </select>

                            {/* MAC Filter */}
                            <select
                                value={reportFilter.mac}
                                onChange={(e) => setReportFilter(prev => ({ ...prev, mac: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                            >
                                <option value="all">All MACs</option>
                                {uniqueMACs.map(mac => (
                                    <option key={mac} value={mac}>{mac}</option>
                                ))}
                            </select>

                            {/* Period Filter */}
                            <select
                                value={reportFilter.period}
                                onChange={(e) => setReportFilter(prev => ({ ...prev, period: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white text-sm"
                            >
                                <option value="all">All Periods</option>
                                {uniquePeriods.map(period => (
                                    <option key={period} value={period}>{period}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Results Info */}
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                            Showing {filteredReports.length} of {recentReports.length} reports
                        </div>
                    </div>
                )}

                <div className="p-6">
                    {isLoadingReports ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading recent reports...</p>
                        </div>
                    ) : recentReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <ClipboardDocumentListIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p>No recent reports</p>
                            <p className="text-sm">Generated reports will appear here</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <ClipboardDocumentListIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p>No reports match your filters</p>
                            <p className="text-sm">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredReports.map(report => (
                                <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className={`p-2 rounded-lg ${report.id.startsWith('DRILL-')
                                                ? 'bg-green-100 dark:bg-green-900'
                                                : 'bg-blue-100 dark:bg-blue-900'
                                            }`}>
                                            {report.id.startsWith('DRILL-') ? (
                                                <FunnelIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                    {report.itemName ? `${report.itemName} - ` : ''}{report.type.charAt(0).toUpperCase() + report.type.slice(1).replace('-', ' ')} Report
                                                </h4>
                                                {report.id.startsWith('DRILL-') && (
                                                    <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full text-xs">
                                                        Drill-Down
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="flex items-center space-x-1">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    <span>{report.period}</span>
                                                </span>
                                                <span>{report.macName}</span>
                                                {report.facilityName && report.facilityName !== 'All Facilities' && <span>• {report.facilityName}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <div className="text-right mr-4">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(report.generatedAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                by {report.generatedBy}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => viewReport(report)}
                                            className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="View/Download Report"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                            <span className="text-sm">View</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Aggregate Report Generator Modal */}
            <ReportGenerator
                isOpen={isReportGeneratorOpen}
                onClose={handleReportGenerated}
            />

            {/* Drill-Down Report Generator Modal */}
            <DrillDownReportGenerator
                isOpen={isDrillDownReportOpen}
                onClose={() => {
                    setIsDrillDownReportOpen(false);
                    loadRecentReports(); // Refresh recent reports
                }}
            />
        </div>
    );
};

export default Reports;
