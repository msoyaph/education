/**
 * Parent Fees Page
 * 
 * View payment history and fee information
 * School-scoped and respects multi-tenancy
 */

import { DollarSign, Users, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { useParentStudents } from '../../domains/academic/hooks/useParentStudents';
import { DashboardSkeleton } from '../../shared/components/LoadingSkeleton';

function ParentFeesPageContent() {
  const { profile } = useUser();
  const { data: students, loading: studentsLoading } = useParentStudents();

  // TODO: Fetch fees from API
  const fees: Array<{
    id: string;
    student_id: string;
    description: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue';
    paid_date?: string;
  }> = [];

  if (studentsLoading) {
    return <DashboardSkeleton />;
  }

  const totalPending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
        <p className="text-gray-600">View fee information and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalPending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-gray-900">₱{totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">₱{(totalPending + totalPaid).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fees List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee History</h2>
        
        {fees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No fees recorded yet</p>
            <p className="text-sm mt-2">Fee information will appear here when available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    fee.status === 'paid' ? 'bg-green-100' :
                    fee.status === 'overdue' ? 'bg-red-100' :
                    'bg-yellow-100'
                  }`}>
                    {fee.status === 'paid' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : fee.status === 'overdue' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{fee.description}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(fee.due_date).toLocaleDateString()}
                      </span>
                      {fee.paid_date && (
                        <>
                          <span>•</span>
                          <span>Paid: {new Date(fee.paid_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">₱{fee.amount.toFixed(2)}</span>
                  <p className={`text-xs mt-1 ${
                    fee.status === 'paid' ? 'text-green-600' :
                    fee.status === 'overdue' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {fee.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ParentFeesPage() {
  return (
    <RoleGuard allowedRoles={['parent']}>
      <PermissionGuard requiredCapabilities={['students:view']}>
        <ParentFeesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
