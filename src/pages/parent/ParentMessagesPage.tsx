/**
 * Parent Messages Page
 * 
 * Communication with school, teachers, and staff
 * School-scoped and respects multi-tenancy
 */

import { MessageSquare, Send, Inbox, Search, Users, Mail, Phone, BookOpen } from 'lucide-react';
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
  type: 'teacher' | 'admin' | 'staff';
  specialization?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

function ParentMessagesPageContent() {
  const { profile } = useUser();
  const { school } = useTenant();
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<MessageContact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const schoolId = school?.id || profile?.school_id;

  useEffect(() => {
    if (!schoolId || !profile?.id) return;

    const loadContacts = async () => {
      try {
        setLoading(true);

        // Step 1: Get parent record from parents table using user_id
        const { data: parentRecord } = await supabase
          .from('parents')
          .select('id')
          .eq('school_id', schoolId)
          .eq('user_id', profile.id)
          .maybeSingle();

        if (!parentRecord) {
          setContacts([]);
          setLoading(false);
          return;
        }

        const parentId = parentRecord.id;

        // Step 2: Get parent's children from student_parents
        const { data: parentRelations } = await supabase
          .from('student_parents')
          .select('student_id')
          .eq('parent_id', parentId);

        if (!parentRelations || parentRelations.length === 0) {
          setContacts([]);
          setLoading(false);
          return;
        }

        const studentIds = parentRelations.map((rel: any) => rel.student_id);

        // Step 3: Get classes for these children from class_enrollments
        const { data: enrollments } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .in('student_id', studentIds);

        if (!enrollments || enrollments.length === 0) {
          setContacts([]);
          setLoading(false);
          return;
        }

        const classIds = [...new Set(enrollments.map((e: any) => e.class_id))];

        // Step 4: Get teachers for these classes
        const { data: classes } = await supabase
          .from('classes')
          .select(`
            teacher_id,
            teachers!inner(
              id,
              first_name,
              last_name,
              email,
              phone,
              specialization,
              user_id,
              user_profiles!inner(
                id,
                first_name,
                last_name,
                email,
                phone
              )
            )
          `)
          .in('id', classIds)
          .eq('is_active', true);

        // Build contacts list with unique teachers
        const contactsMap = new Map<string, MessageContact>();

        (classes || []).forEach((cls: any) => {
          const teacher = cls.teachers;
          if (teacher && !contactsMap.has(teacher.id)) {
            const userProfile = teacher.user_profiles;
            contactsMap.set(teacher.id, {
              id: teacher.id,
              name: userProfile
                ? `${userProfile.first_name} ${userProfile.last_name}`
                : `${teacher.first_name} ${teacher.last_name}`,
              email: userProfile?.email || teacher.email,
              phone: userProfile?.phone || teacher.phone,
              type: 'teacher',
              specialization: teacher.specialization,
            });
          }
        });

        setContacts(Array.from(contactsMap.values()));
      } catch (error) {
        console.error('Error loading contacts:', error);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [schoolId, profile?.id]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <p className="text-gray-600">Communicate with your children's teachers</p>
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
                placeholder="Search teachers..."
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
                  {searchQuery ? 'No teachers found' : contacts.length === 0 
                    ? 'No teachers available. Your children may not be enrolled in classes yet.' 
                    : 'No contacts found'}
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
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500 capitalize">Teacher</p>
                        {contact.specialization && (
                          <p className="text-xs text-gray-500 truncate">{contact.specialization}</p>
                        )}
                        {contact.email && (
                          <p className="text-xs text-gray-400 truncate">{contact.email}</p>
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
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedContact.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        {selectedContact.specialization && (
                          <span className="text-sm text-gray-600">{selectedContact.specialization}</span>
                        )}
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
                    <li>• Send messages to your children's teachers</li>
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a teacher to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ParentMessagesPage() {
  return (
    <RoleGuard allowedRoles={['parent']}>
      <PermissionGuard requiredCapabilities={['messaging:read', 'messaging:create']}>
        <ParentMessagesPageContent />
      </PermissionGuard>
    </RoleGuard>
  );
}
