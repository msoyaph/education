/**
 * Teacher Messages Page
 * 
 * Communication with students and parents
 * School-scoped and respects multi-tenancy
 */

import { MessageSquare, Send, Inbox, Search, Users, Mail, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../../domains/auth/contexts/UserContext';
import { useTenant } from '../../shared/contexts/TenantContext';
import { RoleGuard } from '../../shared/components/guards/RoleGuard';
import { PermissionGuard } from '../../shared/components/guards/PermissionGuard';
import { supabase } from '../../shared/lib/supabase';

interface MessageContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'student' | 'parent' | 'teacher' | 'admin';
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
}

function TeacherMessagesPageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<MessageContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const schoolId = school?.id || profile?.school_id;

  useEffect(() => {
    if (!schoolId || !profile?.id) return;

    const loadContacts = async () => {
      try {
        setLoading(true);
        
        // Load students from teacher's classes
        const { data: classes } = await supabase
          .from('classes')
          .select('id')
          .eq('school_id', schoolId)
          .eq('teacher_id', profile.id)
          .eq('is_active', true);

        if (!classes || classes.length === 0) {
          setContacts([]);
          setLoading(false);
          return;
        }

        const classIds = classes.map((c: any) => c.id);

        // Load students enrolled in these classes
        const { data: enrollments } = await supabase
          .from('class_enrollments')
          .select(`
            student_id,
            students!inner(
              id,
              first_name,
              last_name,
              email,
              phone,
              user_id
            )
          `)
          .in('class_id', classIds);

        // Load parents associated with these students
        const studentIds = [...new Set(enrollments?.map((e: any) => e.student_id) || [])];
        const { data: parentRelations } = await supabase
          .from('student_parents')
          .select(`
            parent_id,
            student_id,
            parents!inner(
              id,
              first_name,
              last_name,
              email,
              phone,
              user_id
            )
          `)
          .in('student_id', studentIds);

        // Build contacts list
        const contactsList: MessageContact[] = [];

        // Add students
        (enrollments || []).forEach((enrollment: any) => {
          const student = enrollment.students;
          if (student) {
            contactsList.push({
              id: student.id,
              name: `${student.first_name} ${student.last_name}`,
              email: student.email,
              phone: student.phone,
              role: 'student',
            });
          }
        });

        // Add parents
        (parentRelations || []).forEach((relation: any) => {
          const parent = relation.parents;
          if (parent) {
            // Avoid duplicates
            const existing = contactsList.find(c => c.id === parent.id);
            if (!existing) {
              contactsList.push({
                id: parent.id,
                name: `${parent.first_name} ${parent.last_name}`,
                email: parent.email,
                phone: parent.phone,
                role: 'parent',
              });
            }
          }
        });

        setContacts(contactsList);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [schoolId, profile?.id]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Communicate with students and parents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Contacts List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contacts */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {searchQuery ? 'No contacts found' : 'No contacts available'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        contact.role === 'student' ? 'bg-blue-100' :
                        contact.role === 'parent' ? 'bg-green-100' :
                        'bg-gray-100'
                      }`}>
                        <Users className={`w-5 h-5 ${
                          contact.role === 'student' ? 'text-blue-600' :
                          contact.role === 'parent' ? 'text-green-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{contact.role}</p>
                        {contact.email && (
                          <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                        )}
                      </div>
                      {contact.unread_count && contact.unread_count > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {contact.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          {selectedContact ? (
            <>
              {/* Message Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedContact.role === 'student' ? 'bg-blue-100' :
                      selectedContact.role === 'parent' ? 'bg-green-100' :
                      'bg-gray-100'
                    }`}>
                      <Users className={`w-5 h-5 ${
                        selectedContact.role === 'student' ? 'text-blue-600' :
                        selectedContact.role === 'parent' ? 'text-green-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedContact.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        {selectedContact.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{selectedContact.email}</span>
                          </div>
                        )}
                        {selectedContact.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{selectedContact.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Messaging Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    The messaging interface is under development. You'll be able to:
                  </p>
                  <ul className="text-left max-w-md mx-auto text-gray-600 space-y-2">
                    <li>• Send messages to students and parents</li>
                    <li>• Receive and reply to messages</li>
                    <li>• View message history</li>
                    <li>• Get read receipts</li>
                  </ul>
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    disabled
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <button
                    disabled
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Contact</h3>
                <p className="text-gray-600">Choose a student or parent from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TeacherMessagesPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <PermissionGuard requiredCapabilities={['messaging:read']}>
        <TeacherMessagesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
