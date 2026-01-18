import { BookOpen, Plus, Search, Calendar, Users } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';

function AdminClassesPageContent() {
  const { profile } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Fetch classes from API
  const classes = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Manage classes and course offerings</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Create Class</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search query' : 'Get started by creating your first class'}
            </p>
            {!searchQuery && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Class
              </button>
            )}
          </div>
        ) : (
          classes.map((classItem: any) => (
            <div key={classItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                    <p className="text-sm text-gray-500">{classItem.course_name || 'No course'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{classItem.student_count || 0} students enrolled</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{classItem.schedule || 'No schedule set'}</span>
                </div>

                {classItem.teacher_name && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Teacher:</span> {classItem.teacher_name}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    View
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminClassesPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'staff']}>
      <PermissionGuard requiredCapabilities={['admin:view']}>
        <AdminClassesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
