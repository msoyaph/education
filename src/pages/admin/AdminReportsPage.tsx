import { BarChart, Download, Calendar, TrendingUp, Users, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';

function AdminReportsPageContent() {
  const { profile } = useUser();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'attendance',
      name: 'Attendance Report',
      description: 'Daily, weekly, and monthly attendance statistics',
      icon: Calendar,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'students',
      name: 'Student Report',
      description: 'Student enrollment and demographics',
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      id: 'academic',
      name: 'Academic Performance',
      description: 'Grades, assessments, and academic trends',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      id: 'classes',
      name: 'Class Report',
      description: 'Class enrollment and performance metrics',
      icon: BookOpen,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and view system reports</p>
        </div>
        {selectedReport && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        )}
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`bg-white rounded-lg shadow-sm border-2 p-6 text-left hover:shadow-md transition-all ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
              <p className="text-sm text-gray-600">{report.description}</p>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      {selectedReport ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {reportTypes.find(r => r.id === selectedReport)?.name}
            </h2>
            <p className="text-gray-600">
              {reportTypes.find(r => r.id === selectedReport)?.description}
            </p>
          </div>

          {/* Report Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This year</option>
                <option>Custom range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Generate Report
              </button>
            </div>
          </div>

          {/* Report Preview Placeholder */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Preview</h3>
            <p className="text-gray-600">Select filters and click "Generate Report" to view data</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a report type</h3>
          <p className="text-gray-600">Choose a report from above to view and generate reports</p>
        </div>
      )}
    </div>
  );
}

export function AdminReportsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <PermissionGuard requiredCapabilities={['admin:view']}>
        <AdminReportsPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
