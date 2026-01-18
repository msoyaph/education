# Education CRM - System Architecture

## 1. Architecture Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   Web App (SPA)  │              │  Mobile Web      │         │
│  │   React + TS     │              │  (Responsive)    │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
└───────────┼────────────────────────────────┼───────────────────┘
            │                                │
            └────────────────┬───────────────┘
                             │ HTTPS/REST API
            ┌────────────────▼────────────────────────────┐
            │         API GATEWAY / ROUTER                │
            │      (Vite/Express - Single Entry)          │
            └────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                    BACKEND - MODULAR MONOLITH                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Auth       │  │  Academic    │  │ Communication│        │
│  │   Module     │  │  Module      │  │  Module      │        │
│  │              │  │              │  │              │        │
│  │ • Users      │  │ • Students   │  │ • Messages   │        │
│  │ • Roles      │  │ • Courses    │  │ • Announce.  │        │
│  │ • Caps       │  │ • Enrollment │  │ • Notifs     │        │
│  │ • Sessions   │  │ • Attendance │  │              │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│  ┌──────┴───────┐  ┌──────┴───────┐         │                 │
│  │   Finance    │  │    Admin     │         │                 │
│  │   Module     │  │    Module    │         │                 │
│  │              │  │              │         │                 │
│  │ • Invoices   │  │ • Schools    │         │                 │
│  │ • Payments   │  │ • Config     │         │                 │
│  │ • Fee Plans  │  │ • Settings   │         │                 │
│  └──────────────┘  └──────────────┘         │                 │
│                                              │                 │
│  ┌──────────────────────────────────────────▼───────────┐    │
│  │         SHARED KERNEL / INFRASTRUCTURE                │    │
│  │  • Multi-tenant context                               │    │
│  │  • Event bus (in-process)                             │    │
│  │  • Logging & monitoring                               │    │
│  │  • Validation & error handling                        │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ Supabase Client
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                    DATA LAYER (Supabase)                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   auth.*     │  │ academic.*   │  │ communication│        │
│  │   Schema     │  │   Schema     │  │    Schema    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  finance.*   │  │   admin.*    │  │   shared.*   │        │
│  │   Schema     │  │   Schema     │  │   Schema     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  • Row Level Security (RLS) per domain                         │
│  • Multi-tenant isolation (school_id)                          │
│  • Indexes & constraints                                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                        │
│                      (Future / Placeholders)                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   RFID       │  │   Payment    │  │   Chatbot    │        │
│  │   System     │  │   Gateway    │  │   (AI)       │        │
│  │              │  │              │  │              │        │
│  │ • Webhooks   │  │ • Stripe API │  │ • OpenAI     │        │
│  │ • IoT data   │  │ • M-Pesa     │  │ • Custom NLP │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Boundaries and Responsibilities

### 2.1 Auth Module (Identity & Access)

**Bounded Context:** User identity, authentication, authorization

**Core Entities:**
- `User` - System users (staff, teachers, parents, students)
- `Role` - Flexible roles (no hardcoding)
- `Capability` - Granular permissions (e.g., "student:read", "invoice:create")
- `RoleCapability` - Role-to-capability mapping
- `Session` - Active user sessions

**Responsibilities:**
- User registration, login, logout
- Password management & MFA (future)
- Role and capability assignment
- Token generation & validation
- Multi-tenant user isolation

**API Contracts:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/roles
GET    /api/auth/capabilities
```

**Events Published:**
- `UserRegistered`
- `UserLoggedIn`
- `RoleAssigned`

**Dependencies:**
- None (foundational module)

---

### 2.2 Academic Module (Core Education Domain)

**Bounded Context:** Students, courses, learning activities

**Core Entities:**
- `Student` - Student profiles
- `Course` - Academic courses/classes
- `Teacher` - Teaching staff
- `Enrollment` - Student-course relationships
- `Attendance` - Daily attendance records
- `Grade` - Assessment results
- `AcademicPeriod` - Terms, semesters, years

**Responsibilities:**
- Student lifecycle management
- Course & class scheduling
- Attendance tracking
- Grade recording
- Academic reporting

**API Contracts:**
```
POST   /api/academic/students
GET    /api/academic/students/:id
POST   /api/academic/courses
POST   /api/academic/enrollments
POST   /api/academic/attendance
POST   /api/academic/grades
```

**Events Published:**
- `StudentEnrolled`
- `AttendanceMarked`
- `GradeRecorded`

**Dependencies:**
- Auth module (user identity)
- Communication module (notifications)

---

### 2.3 Communication Module (Messaging & Notifications)

**Bounded Context:** Internal communication, notifications

**Core Entities:**
- `Message` - Direct messages between users
- `Announcement` - Broadcast messages
- `Notification` - System notifications
- `NotificationPreference` - User preferences
- `MessageThread` - Conversation grouping

**Responsibilities:**
- Sending/receiving messages
- Announcement broadcasting
- Notification delivery (email, SMS, push - future)
- Communication history
- Read receipts

**API Contracts:**
```
POST   /api/communication/messages
GET    /api/communication/messages
POST   /api/communication/announcements
GET    /api/communication/notifications
PUT    /api/communication/notifications/:id/read
```

**Events Published:**
- `MessageSent`
- `AnnouncementCreated`
- `NotificationDelivered`

**Events Subscribed:**
- `StudentEnrolled` → Send welcome message
- `AttendanceMarked` → Notify parent
- `InvoiceCreated` → Send payment reminder

**Dependencies:**
- Auth module (user identity)

---

### 2.4 Finance Module (Billing & Payments)

**Bounded Context:** Financial transactions, invoicing

**Core Entities:**
- `Invoice` - Bills for students
- `Payment` - Payment records
- `FeePlan` - Fee structure templates
- `FeeItem` - Line items (tuition, transport, etc.)
- `PaymentMethod` - Payment channels
- `Transaction` - Ledger entries

**Responsibilities:**
- Invoice generation
- Payment processing
- Fee plan management
- Payment reconciliation
- Financial reporting

**API Contracts:**
```
POST   /api/finance/invoices
GET    /api/finance/invoices/:id
POST   /api/finance/payments
GET    /api/finance/student/:id/balance
GET    /api/finance/reports/revenue
```

**Events Published:**
- `InvoiceCreated`
- `PaymentReceived`
- `PaymentFailed`

**Events Subscribed:**
- `StudentEnrolled` → Auto-generate invoice (optional)

**Dependencies:**
- Auth module (user identity)
- Academic module (student reference only)

**Critical Isolation:**
- Finance MUST NOT directly query academic tables
- Communication happens via events or API calls
- Student reference is by ID only (loose coupling)

---

### 2.5 Admin Module (System Configuration)

**Bounded Context:** Multi-tenant management, system settings

**Core Entities:**
- `School` - Tenant/organization
- `SchoolSettings` - School-specific config
- `SystemConfig` - Global settings
- `AuditLog` - System activity log
- `Integration` - External service configs

**Responsibilities:**
- School/tenant onboarding
- System configuration
- Feature flags
- Audit trail
- Integration management

**API Contracts:**
```
POST   /api/admin/schools
PUT    /api/admin/schools/:id/settings
GET    /api/admin/audit-logs
POST   /api/admin/integrations
```

**Events Published:**
- `SchoolCreated`
- `SettingsUpdated`
- `IntegrationConfigured`

**Dependencies:**
- Auth module (admin authorization)

---

## 3. Data Flow Between Modules

### 3.1 Synchronous Communication (Direct API Calls)

**Use Cases:**
- Reading reference data
- Validation checks
- Real-time queries

**Example:**
```
Finance Module needs student name for invoice:
Finance → Academic API → Get student name → Return to Finance
```

**Implementation:**
- Internal service-to-service calls
- Shared TypeScript interfaces
- Dependency injection for testability

---

### 3.2 Asynchronous Communication (Event Bus)

**Use Cases:**
- Cross-module notifications
- Eventually consistent data
- Decoupled workflows

**Event Flow Example:**
```
1. Academic: StudentEnrolled event published
   ↓
2. Event Bus broadcasts to subscribers
   ↓
3. Finance: Auto-create invoice (if enabled)
   ↓
4. Communication: Send welcome message
```

**Implementation (MVP):**
- In-process event emitter (TypeScript EventEmitter)
- Simple pub/sub pattern
- Synchronous initially, async-ready

**Future (Microservices):**
- Message queue (RabbitMQ, Kafka)
- Event sourcing
- Saga patterns

---

### 3.3 Multi-Tenant Context Propagation

**Flow:**
```
1. Client request → JWT with school_id claim
   ↓
2. Middleware extracts school_id → Adds to request context
   ↓
3. Every database query includes WHERE school_id = :context_school_id
   ↓
4. RLS policies enforce tenant isolation
```

---

### 3.4 Authorization Flow

**Capability-Based Access Control:**
```
1. User attempts action (e.g., "create invoice")
   ↓
2. Auth module checks: Does user's role have "invoice:create" capability?
   ↓
3. Additional checks: Is resource in user's school? (multi-tenant)
   ↓
4. Grant or deny access
```

**No Hardcoded Roles:**
- Roles are data, not code
- Capabilities are granular strings
- Schools can create custom roles

---

## 4. MVP vs Future Features

### ✅ MVP Scope (Build Now)

#### Frontend:
- Responsive web app (mobile-ready)
- Basic CRUD for all modules
- Dashboard with key metrics
- Role-based UI visibility
- Real-time notifications (polling)

#### Backend:
- Modular monolith structure
- RESTful APIs for all modules
- JWT-based auth
- RBAC + capability system
- Multi-tenant isolation
- Basic event bus (in-process)
- RLS for data security

#### Database:
- Domain-separated schemas
- Multi-tenant architecture
- Core entities for all 5 modules
- Indexes for common queries
- Basic audit trails

#### Academic:
- Student & teacher management
- Course enrollment
- Attendance tracking
- Simple grade recording

#### Finance:
- Invoice creation
- Manual payment recording
- Basic balance tracking
- Simple fee plans

#### Communication:
- Internal messaging
- Announcements
- Basic notifications

---

### 🔮 Future / Post-MVP

#### Advanced Features:
- **Analytics & BI:**
  - Student performance analytics
  - Financial forecasting
  - Attendance trends
  - Predictive insights

- **Payroll System:**
  - Staff salary management
  - Tax calculations
  - Automated payments

- **Advanced Academic:**
  - Timetable generation
  - Exam scheduling
  - Report card templates
  - Learning outcomes tracking

- **Advanced Finance:**
  - Automated billing cycles
  - Installment plans
  - Late fee automation
  - Multi-currency support

#### Technical Evolution:
- **Microservices Migration:**
  - Extract modules to separate services
  - Replace in-process events with message queue
  - Service mesh (Istio, Linkerd)
  - Distributed tracing

- **Real-time Features:**
  - WebSocket connections
  - Live notifications
  - Real-time attendance dashboard

- **Mobile Apps:**
  - Native iOS/Android apps
  - Offline-first architecture
  - Push notifications

#### External Integrations:
- **RFID System:**
  - Automated attendance via RFID cards
  - Access control integration
  - Real-time tracking

- **Payment Gateway:**
  - Stripe, PayPal, M-Pesa integration
  - Automated payment processing
  - Payment webhooks
  - Refund handling

- **AI Chatbot:**
  - Parent/student support bot
  - Natural language queries
  - Automated responses
  - Integration with OpenAI/custom LLM

- **SMS/Email Gateway:**
  - Bulk SMS for notifications
  - Email campaigns
  - Multi-channel communication

- **Learning Management System (LMS):**
  - Integration with Moodle, Canvas
  - Assignment sync
  - Grade import/export

---

## 5. Migration Path to Microservices

### 5.1 Design Principles for Easy Migration

**Database:**
- Each module has separate schema namespace
- No cross-schema foreign keys (use IDs only)
- Events for cross-module communication

**Code:**
- Modules are in separate directories
- Clear API boundaries (interfaces)
- Dependency injection for inter-module calls

**Data:**
- Each module can be extracted with its schema
- Shared data (e.g., schools) can be replicated or federated

### 5.2 Migration Strategy

**Phase 1: Modular Monolith (MVP)**
```
Single deployment
├── auth/
├── academic/
├── finance/
├── communication/
└── admin/
```

**Phase 2: Vertical Slice Extraction**
```
Extract one module (e.g., Finance) as first microservice:
- Finance Service (separate deployment)
- Other modules still in monolith
- Communication via REST/events
```

**Phase 3: Full Microservices**
```
Each module becomes a service:
- Auth Service
- Academic Service
- Finance Service
- Communication Service
- Admin Service
- API Gateway
- Event Bus (RabbitMQ/Kafka)
```

---

## 6. Technology Stack

### Frontend:
- React 18 + TypeScript
- Tailwind CSS (responsive design)
- Lucide React (icons)
- React Router (navigation)
- React Query (API state management)
- Zustand (client state)

### Backend (Embedded in Frontend for MVP):
- Supabase Client SDK
- Supabase Edge Functions (for complex logic)
- TypeScript service layer

### Database:
- Supabase (PostgreSQL 15+)
- Row Level Security (RLS)
- Realtime subscriptions (future)

### Authentication:
- Supabase Auth (email/password)
- JWT tokens
- Custom claims for school_id & roles

### Infrastructure:
- Vite (dev server & build)
- Supabase (hosting)
- Environment-based config

---

## 7. Security Architecture

### Multi-Tenant Isolation:
- Every table has `school_id` column
- RLS policies enforce school_id = auth.jwt()->>'school_id'
- No cross-tenant data leakage

### Access Control:
- RBAC: Users → Roles → Capabilities
- Capability-based: Fine-grained permissions
- Resource-level checks (owner, school)

### Data Protection:
- HTTPS everywhere
- Password hashing (Supabase Auth)
- SQL injection prevention (parameterized queries)
- XSS protection (React escaping)
- CSRF tokens (future)

---

## 8. Monitoring & Observability (Future)

### Logging:
- Structured logs (JSON)
- Correlation IDs for request tracing
- Error tracking (Sentry)

### Metrics:
- Request latency
- Error rates
- Database query performance
- User activity metrics

### Audit Trail:
- All critical actions logged
- User attribution
- Timestamp & IP tracking

---

## Summary

This architecture provides:
1. ✅ **Clean domain separation** - Each module is independent
2. ✅ **Multi-tenant by design** - School isolation at every layer
3. ✅ **Flexible authorization** - No hardcoded roles
4. ✅ **API-first** - Clear contracts between modules
5. ✅ **Migration-ready** - Easy path to microservices
6. ✅ **Production-ready MVP** - All core features included
7. ✅ **Future-proof** - Placeholders for advanced features

Next steps: Implement database schema → Build API layer → Create frontend components.
