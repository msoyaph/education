# Education CRM

A modern, multi-tenant Education CRM system built with React, TypeScript, and Supabase. Features role-based access control, attendance tracking, notifications, and comprehensive school management.

## 🚀 Features

- **Multi-Tenant Architecture** - Secure school isolation with subdomain-based tenant resolution
- **Role-Based Access Control** - Admin, Teacher, Parent, Student, IT Admin, and SuperAdmin roles
- **Capability-Based Permissions** - Fine-grained permission system
- **Attendance Tracking** - Real-time attendance marking and reporting
- **Notification System** - Multi-channel notifications (in-app, email, SMS, push)
- **Domain-Driven Design** - Clean, modular architecture
- **Type-Safe** - Full TypeScript implementation
- **Responsive UI** - Modern, mobile-friendly interface

## 📋 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Routing**: React Router v7
- **Icons**: Lucide React

## 🏗️ Architecture

The project follows Domain-Driven Design (DDD) principles:

```
src/
  domains/
    auth/          # Authentication & authorization
    academic/      # Academic features (attendance, classes)
    communication/ # Notifications
    admin/         # Admin features
  shared/          # Shared utilities, contexts, services
  layouts/         # Layout components
  pages/           # Page components
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/msoyaph/education.git
   cd education
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run database migrations**
   
   Apply the migrations in `supabase/migrations/` to your Supabase project:
   - `20260118105004_create_education_crm_schema.sql`
   - `20260118110059_create_notification_system_tables.sql`
   - `20260118111811_add_multi_tenancy_enhancements.sql`
   - `20260118113637_fix_security_and_performance_issues.sql`
   - `20260118114526_remove_unused_indexes_and_fix_security.sql`

5. **Create test users** (optional)
   ```bash
   # Set SUPABASE_SERVICE_ROLE_KEY in .env first
   npm run create-users
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 👥 Test Users

After running `npm run create-users`, you can login with:

| Role    | Email              | Password |
|---------|-------------------|----------|
| Admin   | admin@admin.com   | test1234 |
| Teacher | test@teacher.com  | test1234 |
| Parent  | test@parents.com  | test1234 |
| Student | test@student.com   | test1234 |

## 📚 Documentation

- **[Architecture Overview](./ARCHITECTURE.md)** - System architecture and design decisions
- **[Frontend Architecture](./FRONTEND_ARCHITECTURE.md)** - Frontend structure and patterns
- **[Database Schema](./DATABASE_SCHEMA.md)** - Complete database schema documentation
- **[Multi-Tenancy Guide](./MULTI_TENANCY.md)** - Multi-tenant implementation details
- **[Authorization Design](./AUTHORIZATION_DESIGN.md)** - RBAC and capability system
- **[Migration Report](./MIGRATION_FINAL_REPORT.md)** - Production migration audit
- **[UI Implementation](./UI_IMPLEMENTATION_REPORT.md)** - UI components and dashboards
- **[Create Users Guide](./CREATE_USERS_GUIDE.md)** - How to create test users

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting
- `npm run create-users` - Create test user accounts

## 🔒 Security

- **Row Level Security (RLS)** - Enforced on all database tables
- **Tenant Isolation** - Automatic school_id filtering
- **Capability-Based Access** - Fine-grained permissions
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Backend validation required (see TODOs)

⚠️ **Important**: This is a development codebase. Backend validation is required for production. See [MIGRATION_TODOS.md](./MIGRATION_TODOS.md) for backend requirements.

## 📁 Project Structure

```
.
├── src/
│   ├── domains/          # Domain modules (DDD)
│   ├── shared/           # Shared utilities
│   ├── layouts/          # Layout components
│   └── pages/            # Page components
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
├── scripts/              # Utility scripts
└── docs/                 # Documentation files
```

## 🎯 Roadmap

See [TECHNICAL_ROADMAP.md](./TECHNICAL_ROADMAP.md) for planned features and improvements.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🔗 Links

- **Repository**: https://github.com/msoyaph/education
- **Supabase**: https://supabase.com

## ⚠️ Backend Requirements

This frontend requires backend API implementation. See [MIGRATION_TODOS.md](./MIGRATION_TODOS.md) for complete backend requirements.

**Critical Backend Tasks:**
- [ ] Implement tenant isolation validation
- [ ] Implement capability-based authorization
- [ ] Create API endpoints for all dashboards
- [ ] Move direct Supabase queries to Edge Functions

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for modern education management**
