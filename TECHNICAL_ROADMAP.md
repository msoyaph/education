# Education CRM - Technical Roadmap

## Executive Summary

This roadmap outlines the evolution of the Education CRM from MVP to enterprise-scale platform, covering 5 phases over 18-24 months. Each phase builds on the previous, adding capabilities while managing technical debt and maintaining system stability.

**Key Milestones:**
- **Phase 1 (Months 1-3)**: MVP Stabilization & Core Features
- **Phase 2 (Months 4-6)**: Finance & Payment Integration
- **Phase 3 (Months 7-10)**: Grading & LMS Capabilities
- **Phase 4 (Months 11-14)**: Automation & Hardware Integration
- **Phase 5 (Months 15-18)**: Scale & Microservices Migration

---

## Current Architecture (MVP Baseline)

### Technology Stack
```
Frontend:
  ├── React + TypeScript
  ├── Vite (build tool)
  ├── TailwindCSS
  └── React Router

Backend:
  ├── Supabase (PostgreSQL + Auth + Storage)
  ├── Edge Functions (Deno runtime)
  └── Row Level Security (RLS)

Infrastructure:
  ├── Single monolithic frontend
  ├── Shared database (multi-tenant)
  ├── Subdomain-based tenant resolution
  └── CDN for static assets
```

### Current Capabilities
✅ Multi-tenancy with school isolation
✅ Authentication & authorization
✅ Basic attendance tracking
✅ Notification system
✅ User management
✅ Role-based access control

### Technical Limitations
⚠️ Single monolithic codebase
⚠️ Limited horizontal scalability
⚠️ No payment processing
⚠️ No grading/academic features
⚠️ No real-time collaboration
⚠️ No mobile apps
⚠️ Manual deployment process

---

## Phase 1: MVP Stabilization & Core Features (Months 1-3)

### Goal
Solidify the foundation, fix critical bugs, and add essential missing features to make the product market-ready.

### Key Initiatives

#### 1.1 Performance Optimization (Week 1-2)
**What:**
- Database query optimization
- Add database indexes on frequently queried columns
- Implement query result caching (Redis/Upstash)
- Frontend bundle size optimization
- Lazy loading for routes and components

**Implementation:**
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_attendance_student_date
  ON attendance_records(student_id, date);

CREATE INDEX CONCURRENTLY idx_notifications_user_unread
  ON notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX CONCURRENTLY idx_classes_school_teacher
  ON classes(school_id, teacher_id);
```

```typescript
// Frontend lazy loading
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const GradesPage = lazy(() => import('./pages/GradesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
```

**Success Metrics:**
- Page load time < 2 seconds (P95)
- Database query time < 100ms (P95)
- Bundle size reduced by 30%

---

#### 1.2 Monitoring & Observability (Week 2-3)
**What:**
- Add application monitoring (Sentry for errors)
- Add performance monitoring (Vercel Analytics or similar)
- Database query monitoring (Supabase Studio)
- User analytics (PostHog or Mixpanel)
- Structured logging with tenant context

**Implementation:**
```typescript
// Error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Add tenant context
    const { school } = useTenant();
    event.tags = {
      ...event.tags,
      school_id: school?.id,
      school_slug: school?.slug,
    };
    return event;
  },
});

// Usage tracking
analytics.track('attendance_marked', {
  school_id: school.id,
  user_type: user.type,
  class_id: classId,
});
```

**Success Metrics:**
- Error rate < 0.1%
- Mean Time To Detection (MTTD) < 5 minutes
- 100% of critical paths instrumented

---

#### 1.3 Mobile App Foundation (Week 3-6)
**What:**
- Build React Native mobile app (iOS + Android)
- Share business logic with web app
- Implement mobile-optimized UI
- Add push notifications
- Offline support for attendance

**Implementation:**
```typescript
// Shared business logic (monorepo)
packages/
  ├── core/           # Shared business logic
  │   ├── services/   # API clients
  │   ├── types/      # TypeScript types
  │   └── utils/      # Helper functions
  ├── web/            # Web app (existing)
  └── mobile/         # React Native app (new)

// Mobile attendance (offline-first)
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineAttendanceService {
  async markAttendance(record: AttendanceRecord) {
    const isOnline = await NetInfo.fetch().then(state => state.isConnected);

    if (isOnline) {
      await this.syncToServer(record);
    } else {
      await this.saveLocally(record);
    }
  }

  async syncPendingRecords() {
    const pending = await this.getPendingRecords();
    for (const record of pending) {
      await this.syncToServer(record);
    }
  }
}
```

**Success Metrics:**
- Mobile app released to TestFlight/Google Play Beta
- 50+ teachers using mobile app
- < 5% offline sync failure rate

---

#### 1.4 Enhanced Reporting (Week 6-8)
**What:**
- Add basic reports dashboard
- Attendance reports (daily, weekly, monthly)
- Student performance trends
- Teacher activity reports
- Export to PDF/Excel

**Implementation:**
```typescript
// Report generation service
class ReportService {
  async generateAttendanceReport(
    schoolId: string,
    dateRange: DateRange,
    format: 'pdf' | 'excel'
  ) {
    // Fetch data
    const data = await this.getAttendanceData(schoolId, dateRange);

    // Generate report
    if (format === 'pdf') {
      return await this.generatePDF(data);
    } else {
      return await this.generateExcel(data);
    }
  }

  private async generatePDF(data: any) {
    // Use jsPDF or similar
    const doc = new jsPDF();
    doc.text('Attendance Report', 10, 10);
    // ... add data
    return doc.output('blob');
  }
}

// Edge function for report generation
export default async function handler(req: Request) {
  const { schoolId, dateRange, format } = await req.json();

  const report = await reportService.generateAttendanceReport(
    schoolId,
    dateRange,
    format
  );

  return new Response(report, {
    headers: {
      'Content-Type': format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="report.${format}"`,
    },
  });
}
```

**Success Metrics:**
- 5 standard reports available
- < 10 seconds report generation time
- 90% of schools using reports weekly

---

#### 1.5 CI/CD Pipeline (Week 8-10)
**What:**
- Automated testing (unit + integration)
- Automated deployments
- Environment management (dev, staging, prod)
- Database migration automation
- Rollback strategy

**Implementation:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run typecheck

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  migrate:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Run Database Migrations
        run: |
          npx supabase db push
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

**Success Metrics:**
- 100% automated deployments
- < 5 minutes deployment time
- Zero-downtime deployments
- < 1% deployment failure rate

---

#### 1.6 Security Hardening (Week 10-12)
**What:**
- Security audit of codebase
- Penetration testing
- OWASP Top 10 vulnerability fixes
- Rate limiting on APIs
- Input validation and sanitization
- GDPR/FERPA compliance measures

**Implementation:**
```typescript
// Rate limiting (Edge Function middleware)
import { RateLimiter } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new RateLimiter({
  redis: Redis.fromEnv(),
  limiter: RateLimiter.slidingWindow(100, '1 m'), // 100 requests per minute
});

export async function rateLimitMiddleware(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  return null; // Continue
}

// Input validation
import { z } from 'zod';

const attendanceSchema = z.object({
  student_id: z.string().uuid(),
  date: z.string().datetime(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(500).optional(),
});

export async function markAttendance(data: unknown) {
  // Validate input
  const validated = attendanceSchema.parse(data);

  // Sanitize
  const sanitized = {
    ...validated,
    notes: DOMPurify.sanitize(validated.notes || ''),
  };

  // Process
  return await supabase.from('attendance_records').insert(sanitized);
}
```

**Success Metrics:**
- Zero critical vulnerabilities
- < 5 medium vulnerabilities
- All APIs rate-limited
- 100% input validation on write operations

---

### Phase 1 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance degradation with more users | High | Medium | Implement caching early, monitor P95 latency |
| Mobile app development delays | Medium | High | Start with web-based PWA if native delayed |
| Security vulnerabilities discovered | High | Low | Regular security audits, bug bounty program |
| Scope creep on reports | Medium | High | Define 5 core reports, defer custom reports |
| CI/CD pipeline complexity | Low | Medium | Start simple, iterate based on needs |

---

## Phase 2: Finance & Payment Integration (Months 4-6)

### Goal
Add comprehensive finance management including fee collection, payment processing, and financial reporting using Xendit for Indonesian market.

### Why Xendit?
- Leading payment gateway in Indonesia
- Supports multiple payment methods (VA, e-wallets, cards)
- Lower fees than international alternatives
- Local compliance (Bank Indonesia regulations)
- Excellent developer experience

### Key Initiatives

#### 2.1 Finance Data Model (Week 1-2)

**Database Schema:**
```sql
-- Fee Categories
CREATE TABLE fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_recurring boolean DEFAULT false,
  frequency text, -- monthly, quarterly, annual
  amount numeric(10,2) NOT NULL,
  due_day integer, -- Day of month for recurring fees
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Student Fee Assignments
CREATE TABLE student_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_category_id uuid NOT NULL REFERENCES fee_categories(id),
  amount numeric(10,2) NOT NULL,
  discount_amount numeric(10,2) DEFAULT 0,
  final_amount numeric(10,2) GENERATED ALWAYS AS (amount - discount_amount) STORED,
  due_date date NOT NULL,
  status text DEFAULT 'pending', -- pending, paid, overdue, waived
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'overdue', 'waived'))
);

-- Payments
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_fee_id uuid REFERENCES student_fees(id),

  -- Xendit Integration
  xendit_invoice_id text UNIQUE,
  xendit_payment_id text,

  -- Payment Details
  amount numeric(10,2) NOT NULL,
  payment_method text, -- va_bca, va_mandiri, ewallet_ovo, card, etc.
  payment_channel text, -- BCA, Mandiri, OVO, etc.
  status text DEFAULT 'pending', -- pending, paid, failed, expired, cancelled

  -- Timestamps
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Metadata
  payment_details jsonb DEFAULT '{}',
  xendit_response jsonb,

  CONSTRAINT valid_payment_status CHECK (
    status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')
  )
);

-- Payment Receipts
CREATE TABLE payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES payments(id),
  receipt_number text UNIQUE NOT NULL,
  receipt_url text,
  issued_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_student_fees_student ON student_fees(student_id, status);
CREATE INDEX idx_student_fees_due ON student_fees(due_date, status);
CREATE INDEX idx_payments_student ON payments(student_id, status);
CREATE INDEX idx_payments_xendit ON payments(xendit_invoice_id);
CREATE INDEX idx_payments_status ON payments(status, created_at);

-- RLS Policies
ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- School isolation policies
CREATE POLICY "Users access own school fees"
  ON student_fees FOR ALL
  TO authenticated
  USING (school_id = get_user_school_id());

CREATE POLICY "Users access own school payments"
  ON payments FOR ALL
  TO authenticated
  USING (school_id = get_user_school_id());
```

---

#### 2.2 Xendit Integration (Week 2-4)

**Implementation:**
```typescript
// services/xenditService.ts
import { Xendit } from 'xendit-node';

interface XenditConfig {
  secretKey: string;
  webhookToken: string;
}

class XenditPaymentService {
  private xendit: Xendit;

  constructor(config: XenditConfig) {
    this.xendit = new Xendit({
      secretKey: config.secretKey,
    });
  }

  async createInvoice(params: {
    studentId: string;
    studentFeeId: string;
    amount: number;
    description: string;
    studentEmail: string;
    studentName: string;
  }) {
    const { Invoice } = this.xendit;

    const invoice = await Invoice.createInvoice({
      externalId: params.studentFeeId,
      amount: params.amount,
      description: params.description,
      payerEmail: params.studentEmail,
      customer: {
        given_names: params.studentName,
        email: params.studentEmail,
      },
      successRedirectUrl: `${process.env.APP_URL}/payment/success`,
      failureRedirectUrl: `${process.env.APP_URL}/payment/failed`,
      currency: 'IDR',
      items: [
        {
          name: params.description,
          quantity: 1,
          price: params.amount,
        },
      ],
    });

    // Save to database
    await supabase.from('payments').insert({
      student_fee_id: params.studentFeeId,
      student_id: params.studentId,
      amount: params.amount,
      xendit_invoice_id: invoice.id,
      status: 'pending',
      expires_at: invoice.expiry_date,
      xendit_response: invoice,
    });

    return invoice;
  }

  async createVirtualAccount(params: {
    studentId: string;
    amount: number;
    bank: 'BCA' | 'MANDIRI' | 'BNI' | 'BRI' | 'PERMATA';
  }) {
    const { VirtualAcc } = this.xendit;

    const va = await VirtualAcc.createFixedVA({
      externalId: `fee_${params.studentId}_${Date.now()}`,
      bankCode: params.bank,
      name: params.studentId,
      expectedAmount: params.amount,
    });

    return va;
  }

  async createEWalletCharge(params: {
    studentId: string;
    amount: number;
    walletType: 'OVO' | 'DANA' | 'LINKAJA' | 'SHOPEEPAY';
    phoneNumber: string;
  }) {
    const { EWallet } = this.xendit;

    const charge = await EWallet.createEWalletCharge({
      referenceId: `fee_${params.studentId}_${Date.now()}`,
      currency: 'IDR',
      amount: params.amount,
      checkoutMethod: 'ONE_TIME_PAYMENT',
      channelCode: params.walletType,
      channelProperties: {
        mobileNumber: params.phoneNumber,
        successRedirectUrl: `${process.env.APP_URL}/payment/success`,
      },
    });

    return charge;
  }

  verifyWebhookSignature(webhookToken: string, signature: string): boolean {
    const { Webhook } = this.xendit;
    return Webhook.verifySignature(webhookToken, signature);
  }
}

export const xenditService = new XenditPaymentService({
  secretKey: process.env.XENDIT_SECRET_KEY!,
  webhookToken: process.env.XENDIT_WEBHOOK_TOKEN!,
});
```

---

#### 2.3 Payment Webhook Handler (Week 4)

**Edge Function:**
```typescript
// supabase/functions/xendit-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-callback-token');
    const body = await req.json();

    // Verify webhook signature
    const isValid = verifyXenditSignature(signature, body);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle different webhook events
    switch (body.status) {
      case 'PAID':
      case 'SETTLED':
        await handlePaymentSuccess(supabase, body);
        break;

      case 'EXPIRED':
        await handlePaymentExpired(supabase, body);
        break;

      case 'FAILED':
        await handlePaymentFailed(supabase, body);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePaymentSuccess(supabase: any, webhook: any) {
  const externalId = webhook.external_id;

  // Update payment status
  const { data: payment } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: webhook.payment_method,
      payment_channel: webhook.payment_channel,
      xendit_payment_id: webhook.id,
      xendit_response: webhook,
    })
    .eq('xendit_invoice_id', webhook.id)
    .select()
    .single();

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Update student fee status
  await supabase
    .from('student_fees')
    .update({ status: 'paid' })
    .eq('id', payment.student_fee_id);

  // Generate receipt
  const receiptNumber = await generateReceiptNumber(supabase, payment.school_id);
  const receiptUrl = await generateReceiptPDF(payment);

  await supabase.from('payment_receipts').insert({
    school_id: payment.school_id,
    payment_id: payment.id,
    receipt_number: receiptNumber,
    receipt_url: receiptUrl,
  });

  // Send notification to parent
  await supabase.from('notifications').insert({
    school_id: payment.school_id,
    user_id: payment.student_id, // Will notify parent
    type: 'payment_received',
    title: 'Payment Received',
    message: `Payment of IDR ${payment.amount.toLocaleString()} has been received. Receipt: ${receiptNumber}`,
    metadata: {
      payment_id: payment.id,
      receipt_number: receiptNumber,
      receipt_url: receiptUrl,
    },
  });
}

async function handlePaymentExpired(supabase: any, webhook: any) {
  await supabase
    .from('payments')
    .update({
      status: 'expired',
      xendit_response: webhook,
    })
    .eq('xendit_invoice_id', webhook.id);
}

async function handlePaymentFailed(supabase: any, webhook: any) {
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      xendit_response: webhook,
    })
    .eq('xendit_invoice_id', webhook.id);
}

function verifyXenditSignature(signature: string, body: any): boolean {
  const webhookToken = Deno.env.get('XENDIT_WEBHOOK_TOKEN')!;
  return signature === webhookToken;
}
```

---

#### 2.4 Parent Payment Portal (Week 5)

**Frontend Implementation:**
```typescript
// pages/parent/PaymentPortal.tsx
import { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';

interface StudentFee {
  id: string;
  fee_category: {
    name: string;
    description: string;
  };
  amount: number;
  discount_amount: number;
  final_amount: number;
  due_date: string;
  status: string;
}

export function PaymentPortal() {
  const { school } = useTenant();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingFees();
  }, []);

  async function loadPendingFees() {
    const { data } = await supabase
      .from('student_fees')
      .select(`
        *,
        fee_category:fee_categories(name, description)
      `)
      .eq('status', 'pending')
      .order('due_date');

    setFees(data || []);
    setLoading(false);
  }

  async function payFee(feeId: string) {
    try {
      // Create Xendit invoice
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentFeeId: feeId }),
      });

      const { invoice } = await response.json();

      // Redirect to Xendit payment page
      window.location.href = invoice.invoice_url;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Payment Portal</h1>

      {loading ? (
        <div>Loading fees...</div>
      ) : fees.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <p className="text-green-800">No pending fees. All payments are up to date!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="bg-white border rounded-lg p-6 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-lg">{fee.fee_category.name}</h3>
                <p className="text-gray-600 text-sm">{fee.fee_category.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Due: {new Date(fee.due_date).toLocaleDateString()}
                </p>
                {fee.discount_amount > 0 && (
                  <p className="text-sm text-green-600">
                    Discount: IDR {fee.discount_amount.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  IDR {fee.final_amount.toLocaleString()}
                </p>
                <button
                  onClick={() => payFee(fee.id)}
                  className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Pay Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Payment Methods Accepted:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>✓ Bank Transfer (Virtual Account)</div>
          <div>✓ Credit/Debit Card</div>
          <div>✓ OVO</div>
          <div>✓ DANA</div>
          <div>✓ ShopeePay</div>
          <div>✓ LinkAja</div>
        </div>
      </div>
    </div>
  );
}
```

---

#### 2.5 Finance Dashboard (Week 6)

**Admin Finance Dashboard:**
```typescript
// pages/admin/FinanceDashboard.tsx
export function FinanceDashboard() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    collectionRate: 0,
  });

  useEffect(() => {
    loadFinanceMetrics();
  }, []);

  async function loadFinanceMetrics() {
    // Total revenue (paid fees)
    const { data: paidFees } = await supabase
      .from('student_fees')
      .select('final_amount')
      .eq('status', 'paid');

    const totalRevenue = paidFees?.reduce((sum, f) => sum + f.final_amount, 0) || 0;

    // Pending amount
    const { data: pendingFees } = await supabase
      .from('student_fees')
      .select('final_amount')
      .eq('status', 'pending');

    const pendingAmount = pendingFees?.reduce((sum, f) => sum + f.final_amount, 0) || 0;

    // Overdue amount
    const { data: overdueFees } = await supabase
      .from('student_fees')
      .select('final_amount')
      .eq('status', 'overdue');

    const overdueAmount = overdueFees?.reduce((sum, f) => sum + f.final_amount, 0) || 0;

    const collectionRate = ((totalRevenue / (totalRevenue + pendingAmount + overdueAmount)) * 100).toFixed(1);

    setMetrics({
      totalRevenue,
      pendingAmount,
      overdueAmount,
      collectionRate: parseFloat(collectionRate),
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Finance Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`IDR ${metrics.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="green"
        />
        <MetricCard
          title="Pending Payments"
          value={`IDR ${metrics.pendingAmount.toLocaleString()}`}
          icon="⏳"
          color="yellow"
        />
        <MetricCard
          title="Overdue"
          value={`IDR ${metrics.overdueAmount.toLocaleString()}`}
          icon="⚠️"
          color="red"
        />
        <MetricCard
          title="Collection Rate"
          value={`${metrics.collectionRate}%`}
          icon="📊"
          color="blue"
        />
      </div>

      {/* Recent payments table */}
      <RecentPaymentsTable />

      {/* Payment trends chart */}
      <PaymentTrendsChart />
    </div>
  );
}
```

---

### Phase 2 Deliverables

✅ Complete finance data model
✅ Xendit integration (invoices, VA, e-wallets)
✅ Webhook handler for payment notifications
✅ Parent payment portal with multiple payment methods
✅ Admin finance dashboard with reporting
✅ Automated receipt generation
✅ Payment reminder notifications
✅ Overdue fee tracking

---

### Phase 2 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Xendit API changes or downtime | High | Low | Implement retry logic, fallback to manual entry |
| Payment fraud | High | Medium | Implement fraud detection, limit transaction amounts |
| Currency/tax complications | Medium | High | Consult with Indonesian tax expert, use Xendit tax features |
| Parent adoption resistance | Medium | High | Provide multiple payment methods, offline payment option |
| Webhook failures | High | Medium | Implement idempotent webhook processing, manual reconciliation |
| PCI DSS compliance (if handling cards) | High | Low | Use Xendit's hosted payment page (no card data touches our servers) |

---

## Phase 3: Grading & LMS Capabilities (Months 7-10)

### Goal
Transform from attendance-only system to full Learning Management System with gradebook, assignments, assessments, and content management.

### Key Initiatives

#### 3.1 Academic Structure Enhancement (Week 1-2)

**Extended Data Model:**
```sql
-- Academic Terms
CREATE TABLE academic_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL, -- Fall 2024, Spring 2025, etc.
  term_type text NOT NULL, -- semester, quarter, trimester
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Grading Scales
CREATE TABLE grading_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  scale_type text NOT NULL, -- letter, percentage, gpa, points
  is_default boolean DEFAULT false,
  scale_definition jsonb NOT NULL,
  -- Example: {
  --   "A": {"min": 90, "max": 100, "gpa": 4.0},
  --   "B": {"min": 80, "max": 89, "gpa": 3.0},
  --   ...
  -- }
  created_at timestamptz DEFAULT now()
);

-- Grade Categories (weighted)
CREATE TABLE grade_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name text NOT NULL, -- Homework, Tests, Projects, Participation
  weight numeric(5,2) NOT NULL, -- Percentage weight (0-100)
  drop_lowest integer DEFAULT 0, -- Drop N lowest grades
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_weight CHECK (weight >= 0 AND weight <= 100)
);

-- Assignments
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  grade_category_id uuid REFERENCES grade_categories(id),

  title text NOT NULL,
  description text,
  instructions text,

  -- Assignment type
  assignment_type text NOT NULL, -- homework, quiz, test, project, essay

  -- Points
  total_points numeric(10,2) NOT NULL,

  -- Dates
  assigned_date date NOT NULL,
  due_date timestamptz NOT NULL,
  available_from timestamptz,
  available_until timestamptz,

  -- Settings
  allow_late_submission boolean DEFAULT false,
  late_penalty_percent numeric(5,2) DEFAULT 0,

  -- Attachments
  attachment_urls text[],

  -- Rubric
  rubric jsonb,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Student Submissions
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Submission
  submitted_at timestamptz,
  submission_text text,
  attachment_urls text[],

  -- Grading
  score numeric(10,2),
  letter_grade text,
  feedback text,
  graded_at timestamptz,
  graded_by uuid REFERENCES user_profiles(id),

  -- Status
  status text DEFAULT 'not_submitted', -- not_submitted, submitted, graded, returned
  is_late boolean DEFAULT false,

  -- Rubric scores
  rubric_scores jsonb,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_student_assignment UNIQUE (assignment_id, student_id),
  CONSTRAINT valid_submission_status CHECK (
    status IN ('not_submitted', 'submitted', 'graded', 'returned')
  )
);

-- Grade Overrides (for manual adjustments)
CREATE TABLE grade_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  term_id uuid REFERENCES academic_terms(id),

  original_grade text,
  override_grade text NOT NULL,
  reason text NOT NULL,

  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Final Grades (calculated)
CREATE TABLE final_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES academic_terms(id),

  numeric_grade numeric(5,2),
  letter_grade text,
  gpa numeric(3,2),

  grade_breakdown jsonb, -- Category breakdown

  calculated_at timestamptz DEFAULT now(),
  finalized_at timestamptz,
  finalized_by uuid REFERENCES user_profiles(id),

  CONSTRAINT unique_student_class_term UNIQUE (student_id, class_id, term_id)
);

-- Indexes
CREATE INDEX idx_assignments_class_due ON assignments(class_id, due_date);
CREATE INDEX idx_submissions_student ON submissions(student_id, status);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_final_grades_student_term ON final_grades(student_id, term_id);
```

---

#### 3.2 Gradebook Interface (Week 3-5)

**Teacher Gradebook:**
```typescript
// pages/teacher/Gradebook.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface GradebookEntry {
  student_id: string;
  student_name: string;
  assignments: {
    [assignmentId: string]: {
      score: number | null;
      total: number;
      percentage: number | null;
    };
  };
  average: number;
  letterGrade: string;
}

export function Gradebook({ classId }: { classId: string }) {
  const [students, setStudents] = useState<GradebookEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGradebookData();
  }, [classId]);

  async function loadGradebookData() {
    // Load assignments
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('due_date');

    setAssignments(assignmentsData || []);

    // Load students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        student:students(id, first_name, last_name)
      `)
      .eq('class_id', classId);

    // Load submissions for all students
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .in(
        'assignment_id',
        assignmentsData?.map((a) => a.id) || []
      );

    // Build gradebook matrix
    const gradebook = enrollments?.map((e) => {
      const studentSubs = submissions?.filter((s) => s.student_id === e.student.id) || [];

      const assignmentScores: any = {};
      let totalPoints = 0;
      let earnedPoints = 0;

      assignmentsData?.forEach((assignment) => {
        const submission = studentSubs.find((s) => s.assignment_id === assignment.id);
        const score = submission?.score || null;
        const percentage = score ? (score / assignment.total_points) * 100 : null;

        assignmentScores[assignment.id] = {
          score,
          total: assignment.total_points,
          percentage,
        };

        if (score !== null) {
          earnedPoints += score;
          totalPoints += assignment.total_points;
        }
      });

      const average = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const letterGrade = calculateLetterGrade(average);

      return {
        student_id: e.student.id,
        student_name: `${e.student.first_name} ${e.student.last_name}`,
        assignments: assignmentScores,
        average,
        letterGrade,
      };
    });

    setStudents(gradebook || []);
    setLoading(false);
  }

  async function updateGrade(studentId: string, assignmentId: string, score: number) {
    await supabase
      .from('submissions')
      .upsert({
        assignment_id: assignmentId,
        student_id: studentId,
        score,
        status: 'graded',
        graded_at: new Date().toISOString(),
      });

    await loadGradebookData(); // Refresh
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gradebook</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="sticky left-0 bg-gray-100 px-4 py-2 border">Student</th>
              {assignments.map((assignment) => (
                <th key={assignment.id} className="px-4 py-2 border min-w-[100px]">
                  <div className="text-sm">{assignment.title}</div>
                  <div className="text-xs text-gray-500">
                    {assignment.total_points} pts
                  </div>
                </th>
              ))}
              <th className="px-4 py-2 border">Average</th>
              <th className="px-4 py-2 border">Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id}>
                <td className="sticky left-0 bg-white px-4 py-2 border font-medium">
                  {student.student_name}
                </td>
                {assignments.map((assignment) => {
                  const entry = student.assignments[assignment.id];
                  return (
                    <td key={assignment.id} className="px-4 py-2 border text-center">
                      <input
                        type="number"
                        value={entry.score || ''}
                        onChange={(e) =>
                          updateGrade(
                            student.student_id,
                            assignment.id,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full text-center border rounded px-2 py-1"
                        placeholder="-"
                        max={assignment.total_points}
                        min={0}
                        step={0.5}
                      />
                      {entry.percentage && (
                        <div className="text-xs text-gray-500 mt-1">
                          {entry.percentage.toFixed(0)}%
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-2 border text-center font-semibold">
                  {student.average.toFixed(1)}%
                </td>
                <td className="px-4 py-2 border text-center">
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${getGradeColor(
                      student.letterGrade
                    )}`}
                  >
                    {student.letterGrade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'bg-green-100 text-green-800';
    case 'B':
      return 'bg-blue-100 text-blue-800';
    case 'C':
      return 'bg-yellow-100 text-yellow-800';
    case 'D':
      return 'bg-orange-100 text-orange-800';
    case 'F':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
```

---

#### 3.3 Assignment Management (Week 5-7)

**Features:**
- Create/edit/delete assignments
- Upload attachment files (Supabase Storage)
- Set rubrics for assignments
- Bulk grade import (CSV)
- Assignment templates

**Implementation:**
```typescript
// Assignment creation with file uploads
async function createAssignment(data: AssignmentData, files: File[]) {
  // Upload files to Supabase Storage
  const uploadedUrls = await Promise.all(
    files.map(async (file) => {
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error } = await supabase.storage
        .from('assignments')
        .upload(`${school.id}/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('assignments')
        .getPublicUrl(uploadData.path);

      return urlData.publicUrl;
    })
  );

  // Create assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .insert({
      ...data,
      attachment_urls: uploadedUrls,
    })
    .select()
    .single();

  // Create submission placeholders for all students
  const { data: students } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('class_id', data.class_id);

  await supabase.from('submissions').insert(
    students?.map((s) => ({
      assignment_id: assignment.id,
      student_id: s.student_id,
      status: 'not_submitted',
    }))
  );

  return assignment;
}
```

---

#### 3.4 Student/Parent Grade Portal (Week 7-8)

**Student View:**
```typescript
// pages/student/MyGrades.tsx
export function MyGrades() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    loadGrades();
  }, []);

  async function loadGrades() {
    const { data } = await supabase
      .from('enrollments')
      .select(`
        class:classes(
          id,
          name,
          teacher:teachers(first_name, last_name),
          assignments(
            id,
            title,
            total_points,
            due_date,
            submissions(score, status, feedback)
          )
        )
      `)
      .eq('student_id', user.id);

    setClasses(data || []);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Grades</h1>

      {classes.map((enrollment) => (
        <div key={enrollment.class.id} className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{enrollment.class.name}</h2>
          <p className="text-gray-600 mb-4">
            Teacher: {enrollment.class.teacher.first_name} {enrollment.class.teacher.last_name}
          </p>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Assignment</th>
                <th className="text-left py-2">Due Date</th>
                <th className="text-center py-2">Score</th>
                <th className="text-center py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollment.class.assignments.map((assignment: any) => {
                const submission = assignment.submissions[0];
                return (
                  <tr key={assignment.id} className="border-b">
                    <td className="py-2">{assignment.title}</td>
                    <td className="py-2">
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-center">
                      {submission.score !== null
                        ? `${submission.score}/${assignment.total_points}`
                        : '-'}
                    </td>
                    <td className="py-2 text-center">
                      <StatusBadge status={submission.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-lg font-semibold">
              Current Average: {calculateAverage(enrollment.class.assignments)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

#### 3.5 Learning Content Management (Week 9-10)

**Features:**
- Course materials library
- Video hosting (YouTube/Vimeo integration)
- Document management
- Quizzes and assessments
- Discussion forums

**Data Model:**
```sql
-- Content Modules
CREATE TABLE content_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Module Items (lessons, videos, documents, quizzes)
CREATE TABLE module_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES content_modules(id) ON DELETE CASCADE,

  item_type text NOT NULL, -- lesson, video, document, quiz, assignment
  title text NOT NULL,
  content text, -- HTML content for lessons

  -- Video
  video_url text, -- YouTube/Vimeo URL
  video_duration integer, -- seconds

  -- Document
  document_url text,

  -- Quiz
  quiz_id uuid REFERENCES quizzes(id),

  -- Assignment
  assignment_id uuid REFERENCES assignments(id),

  order_index integer NOT NULL,
  is_required boolean DEFAULT false,

  created_at timestamptz DEFAULT now()
);

-- Student Progress Tracking
CREATE TABLE student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  module_item_id uuid NOT NULL REFERENCES module_items(id) ON DELETE CASCADE,

  status text DEFAULT 'not_started', -- not_started, in_progress, completed
  progress_percent integer DEFAULT 0,
  time_spent integer DEFAULT 0, -- seconds

  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz,

  CONSTRAINT unique_student_item UNIQUE (student_id, module_item_id)
);
```

---

### Phase 3 Deliverables

✅ Complete grading system with weighted categories
✅ Teacher gradebook interface
✅ Assignment creation and management
✅ Student submission portal
✅ Parent grade visibility
✅ Learning content modules
✅ Progress tracking
✅ Report cards generation
✅ GPA calculation
✅ Transcript generation

---

### Phase 3 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Complex grading rules per school | High | High | Flexible grading scale configuration, default templates |
| Large file uploads for assignments | Medium | High | Use chunked uploads, set file size limits, CDN for delivery |
| Teacher adoption/training needed | High | High | Provide training videos, templates, gradebook CSV import |
| Performance issues with large classes | Medium | Medium | Implement pagination, optimize queries, cache calculations |
| Grade calculation accuracy | High | Low | Extensive testing, teacher override capability, audit logs |

---

## Phase 4: Automation & Hardware Integration (Months 11-14)

### Goal
Add AI-powered features and hardware integrations (RFID, QR codes) to reduce manual work and enhance user experience.

### Key Initiatives

#### 4.1 AI Chatbot (WhatsApp Integration) (Week 1-4)

**Use Cases:**
- Parents check attendance via WhatsApp
- Query grades and assignments
- Receive fee reminders
- Get school announcements
- Submit leave applications

**Tech Stack:**
- Twilio WhatsApp Business API
- OpenAI GPT-4 for natural language
- LangChain for conversation management
- PostgreSQL for conversation history

**Implementation:**
```typescript
// Edge Function: whatsapp-webhook
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.20.0';
import twilio from 'https://esm.sh/twilio@4.19.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const twilioClient = twilio(
  Deno.env.get('TWILIO_ACCOUNT_SID'),
  Deno.env.get('TWILIO_AUTH_TOKEN')
);

serve(async (req) => {
  if (req.method === 'POST') {
    const formData = await req.formData();
    const from = formData.get('From'); // Parent's WhatsApp number
    const body = formData.get('Body'); // Message text

    // Identify parent from phone number
    const { data: parent } = await supabase
      .from('parents')
      .select('*, students(*)')
      .eq('phone', from.replace('whatsapp:', ''))
      .single();

    if (!parent) {
      await sendWhatsAppMessage(from, 'Phone number not registered. Please contact school admin.');
      return new Response('ok');
    }

    // Get conversation context
    const context = await getConversationContext(parent.id);

    // Generate AI response
    const aiResponse = await generateChatbotResponse(body, parent, context);

    // Send response via WhatsApp
    await sendWhatsAppMessage(from, aiResponse);

    // Save conversation
    await saveConversation(parent.id, body, aiResponse);

    return new Response('ok');
  }

  return new Response('Method not allowed', { status: 405 });
});

async function generateChatbotResponse(
  message: string,
  parent: any,
  context: any
): Promise<string> {
  const systemPrompt = `You are a helpful assistant for ${parent.school.name}.
The parent is ${parent.first_name} ${parent.last_name} with children: ${parent.students.map((s: any) => s.first_name).join(', ')}.

You can help with:
- Checking attendance records
- Viewing grades and assignments
- Checking fee balances
- Submitting leave applications
- Getting school announcements

Be concise and friendly. Use the parent's name and children's names when relevant.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      ...context.messages,
      { role: 'user', content: message },
    ],
    functions: [
      {
        name: 'get_attendance',
        description: 'Get attendance records for a student',
        parameters: {
          type: 'object',
          properties: {
            student_name: { type: 'string' },
            date_range: { type: 'string', description: 'e.g., "last week", "today", "this month"' },
          },
        },
      },
      {
        name: 'get_grades',
        description: 'Get grades for a student',
        parameters: {
          type: 'object',
          properties: {
            student_name: { type: 'string' },
            class_name: { type: 'string', optional: true },
          },
        },
      },
      {
        name: 'get_fee_balance',
        description: 'Get pending fee balance for a student',
        parameters: {
          type: 'object',
          properties: {
            student_name: { type: 'string' },
          },
        },
      },
      {
        name: 'submit_leave_application',
        description: 'Submit a leave application for a student',
        parameters: {
          type: 'object',
          properties: {
            student_name: { type: 'string' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
            reason: { type: 'string' },
          },
        },
      },
    ],
  });

  const responseMessage = completion.choices[0].message;

  // Handle function calls
  if (responseMessage.function_call) {
    const functionName = responseMessage.function_call.name;
    const functionArgs = JSON.parse(responseMessage.function_call.arguments);

    let functionResponse;
    switch (functionName) {
      case 'get_attendance':
        functionResponse = await getStudentAttendance(parent, functionArgs);
        break;
      case 'get_grades':
        functionResponse = await getStudentGrades(parent, functionArgs);
        break;
      case 'get_fee_balance':
        functionResponse = await getFeeBalance(parent, functionArgs);
        break;
      case 'submit_leave_application':
        functionResponse = await submitLeaveApplication(parent, functionArgs);
        break;
    }

    // Generate final response with function result
    const finalCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...context.messages,
        { role: 'user', content: message },
        responseMessage,
        {
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResponse),
        },
      ],
    });

    return finalCompletion.choices[0].message.content;
  }

  return responseMessage.content;
}

async function getStudentAttendance(parent: any, args: any) {
  const student = parent.students.find(
    (s: any) => s.first_name.toLowerCase() === args.student_name.toLowerCase()
  );

  if (!student) {
    return { error: 'Student not found' };
  }

  const dateRange = parseDateRange(args.date_range);

  const { data: attendance } = await supabase
    .from('attendance_records')
    .select('date, status')
    .eq('student_id', student.id)
    .gte('date', dateRange.start)
    .lte('date', dateRange.end)
    .order('date', { ascending: false });

  return {
    student: student.first_name,
    records: attendance,
    total_days: attendance?.length || 0,
    present_days: attendance?.filter((a) => a.status === 'present').length || 0,
  };
}

async function sendWhatsAppMessage(to: string, message: string) {
  await twilioClient.messages.create({
    from: 'whatsapp:+14155238886', // Twilio sandbox number
    to: to,
    body: message,
  });
}
```

**Example Conversations:**
```
Parent: "How was John's attendance last week?"
Bot: "John had great attendance last week! He was present all 5 days (Mon-Fri). Keep up the good work! ��"

Parent: "What are Sarah's grades?"
Bot: "Sarah's current grades:
📚 Mathematics: A (92%)
🔬 Science: B+ (87%)
📖 English: A- (90%)
🎨 Art: A (95%)

She's doing excellent! Her overall GPA is 3.7."

Parent: "How much do we owe for tuition?"
Bot: "Fee Balance for John:
- Tuition (January): IDR 1,500,000 (Due: Jan 31)
- Books: IDR 200,000 (Due: Feb 15)

Total: IDR 1,700,000

You can pay online at: [payment link]"
```

---

#### 4.2 RFID Attendance System (Week 4-7)

**Hardware:**
- RFID readers (RC522 or similar)
- Student ID cards with RFID chips
- Raspberry Pi or ESP32 for reader control
- Network connection to cloud

**Architecture:**
```
RFID Card → Reader (Raspberry Pi) → MQTT Broker → Edge Function → Supabase
```

**Implementation:**
```python
# rfid_reader.py (Raspberry Pi)
import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522
import paho.mqtt.client as mqtt
import json
import time

# MQTT Configuration
MQTT_BROKER = "mqtt.supabase.co"
MQTT_PORT = 1883
MQTT_TOPIC = "school/{school_id}/attendance"

# Initialize RFID reader
reader = SimpleMFRC522()

# Initialize MQTT client
client = mqtt.Client()
client.username_pw_set(username="your_username", password="your_password")
client.connect(MQTT_BROKER, MQTT_PORT, 60)

print("RFID Attendance System - Ready")
print("Scan your ID card...")

try:
    while True:
        # Read RFID card
        id, text = reader.read()

        if id:
            print(f"Card detected: {id}")

            # Publish to MQTT
            payload = {
                "rfid_id": str(id),
                "timestamp": int(time.time()),
                "reader_id": "gate_entrance",
                "school_id": "school-uuid-here"
            }

            client.publish(MQTT_TOPIC, json.dumps(payload))
            print(f"Attendance logged for card {id}")

            # Wait to prevent duplicate scans
            time.sleep(2)

except KeyboardInterrupt:
    print("\nCleaning up...")
    GPIO.cleanup()
```

**Edge Function to Process RFID Scans:**
```typescript
// Edge function: process-rfid-scan
export default async function handler(req: Request) {
  const { rfid_id, timestamp, reader_id, school_id } = await req.json();

  // Look up student by RFID
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('rfid_card_id', rfid_id)
    .eq('school_id', school_id)
    .single();

  if (!student) {
    return new Response(JSON.stringify({ error: 'Student not found' }), {
      status: 404,
    });
  }

  // Mark attendance
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('student_id', student.id)
    .eq('date', today)
    .maybeSingle();

  if (!existing) {
    await supabase.from('attendance_records').insert({
      student_id: student.id,
      date: today,
      status: 'present',
      check_in_time: new Date(timestamp * 1000).toISOString(),
      method: 'rfid',
      metadata: { reader_id, rfid_id },
    });

    // Send notification to parent
    await supabase.from('notifications').insert({
      school_id: school_id,
      user_id: student.id,
      type: 'attendance_checkin',
      title: 'Check-in Confirmed',
      message: `${student.first_name} checked in at ${new Date(timestamp * 1000).toLocaleTimeString()}`,
      metadata: { method: 'rfid' },
    });

    return new Response(
      JSON.stringify({
        success: true,
        student: `${student.first_name} ${student.last_name}`,
        message: 'Attendance marked',
      })
    );
  }

  return new Response(
    JSON.stringify({
      success: false,
      message: 'Already checked in today',
    })
  );
}
```

---

#### 4.3 QR Code Attendance (Week 7-8)

**Use Cases:**
- Teacher displays QR code in class
- Students scan with their mobile app
- Time-limited QR codes (prevent fraud)
- Location-based validation

**Implementation:**
```typescript
// Generate time-limited QR code
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

class QRAttendanceService {
  async generateClassQRCode(classId: string, teacherId: string) {
    // Generate unique token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store token
    await supabase.from('attendance_qr_tokens').insert({
      token,
      class_id: classId,
      teacher_id: teacherId,
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    // Generate QR code
    const qrData = {
      token,
      class_id: classId,
      expires_at: expiresAt.toISOString(),
    };

    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    return {
      qrCodeUrl,
      token,
      expiresAt,
    };
  }

  async scanQRCode(
    token: string,
    studentId: string,
    latitude?: number,
    longitude?: number
  ) {
    // Verify token
    const { data: qrToken } = await supabase
      .from('attendance_qr_tokens')
      .select('*, class:classes(id, name, location)')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (!qrToken) {
      throw new Error('Invalid QR code');
    }

    // Check expiration
    if (new Date(qrToken.expires_at) < new Date()) {
      throw new Error('QR code expired');
    }

    // Validate location (if provided)
    if (latitude && longitude && qrToken.class.location) {
      const distance = calculateDistance(
        latitude,
        longitude,
        qrToken.class.location.latitude,
        qrToken.class.location.longitude
      );

      if (distance > 100) {
        // More than 100 meters away
        throw new Error('You must be in the classroom to mark attendance');
      }
    }

    // Mark attendance
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('attendance_records').insert({
      student_id: studentId,
      class_id: qrToken.class_id,
      date: today,
      status: 'present',
      check_in_time: new Date().toISOString(),
      method: 'qr_code',
      metadata: {
        token,
        latitude,
        longitude,
      },
    });

    return {
      success: true,
      class: qrToken.class.name,
    };
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
```

---

#### 4.4 Automated Report Generation (Week 9-10)

**Features:**
- Scheduled report generation (daily, weekly, monthly)
- Email delivery to stakeholders
- Template-based reports
- Data export automation

**Implementation:**
```typescript
// Cron job (using Supabase pg_cron)
SELECT cron.schedule(
  'generate-weekly-reports',
  '0 8 * * 1', -- Every Monday at 8 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/generate-reports',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{"type": "weekly"}'::jsonb
  );
  $$
);

// Edge function: generate-reports
export default async function handler(req: Request) {
  const { type } = await req.json(); // daily, weekly, monthly

  // Get all active schools
  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .eq('is_active', true);

  for (const school of schools) {
    // Generate attendance report
    const attendanceReport = await generateAttendanceReport(school.id, type);

    // Generate finance report
    const financeReport = await generateFinanceReport(school.id, type);

    // Send email to school admin
    await sendReportEmail(school, [attendanceReport, financeReport]);
  }

  return new Response(JSON.stringify({ success: true }));
}

async function generateAttendanceReport(schoolId: string, period: string) {
  const dateRange = getDateRange(period);

  const { data: attendance } = await supabase
    .from('attendance_records')
    .select('*, student:students(first_name, last_name)')
    .eq('school_id', schoolId)
    .gte('date', dateRange.start)
    .lte('date', dateRange.end);

  // Calculate statistics
  const stats = {
    total_days: calculateWorkingDays(dateRange),
    total_records: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    attendance_rate: ((attendance.filter((a) => a.status === 'present').length / attendance.length) * 100).toFixed(1),
  };

  return {
    type: 'attendance',
    period,
    data: stats,
    details: attendance,
  };
}
```

---

#### 4.5 Smart Notifications (Week 10-12)

**AI-Powered Features:**
- Predictive absence alerts (ML model)
- Grade drop notifications
- Personalized study recommendations
- Behavioral pattern detection

**Implementation:**
```typescript
// Daily analysis job
async function analyzeStudentPatterns() {
  const { data: students } = await supabase
    .from('students')
    .select('*, attendance_records(*)');

  for (const student of students) {
    // Check attendance pattern
    const recentAbsences = student.attendance_records
      .filter((a) => a.status === 'absent')
      .slice(0, 10);

    if (recentAbsences.length >= 3) {
      // 3+ absences in last 10 days
      await supabase.from('notifications').insert({
        user_id: student.parent_id,
        type: 'attendance_alert',
        title: 'Attendance Alert',
        message: `${student.first_name} has been absent ${recentAbsences.length} times in the last 10 days. Please contact the school.`,
        priority: 'high',
      });
    }

    // Check grade trends
    const { data: recentGrades } = await supabase
      .from('submissions')
      .select('score, assignment:assignments(total_points)')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentGrades.length >= 3) {
      const percentages = recentGrades.map(
        (g) => (g.score / g.assignment.total_points) * 100
      );

      const average = percentages.reduce((a, b) => a + b) / percentages.length;

      if (average < 70) {
        // Below 70% average
        await supabase.from('notifications').insert({
          user_id: student.id,
          type: 'academic_alert',
          title: 'Academic Support Available',
          message: `Your recent assignment average is ${average.toFixed(0)}%. We're here to help! Talk to your teacher about tutoring options.`,
          priority: 'medium',
        });
      }
    }
  }
}
```

---

### Phase 4 Deliverables

✅ WhatsApp chatbot with AI
✅ RFID attendance system
✅ QR code attendance
✅ Automated report generation
✅ Smart notification system
✅ Predictive analytics
✅ Behavioral pattern detection

---

### Phase 4 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| RFID hardware failures | Medium | Medium | Backup manual attendance, redundant readers |
| WhatsApp API costs scaling | High | High | Set usage quotas, rate limiting, consider alternatives |
| AI hallucinations/errors | High | Medium | Add safety checks, human review for critical actions |
| Privacy concerns with chatbot | High | Low | Clear data usage policy, opt-in model, audit logs |
| QR code fraud (screenshots) | Medium | High | Time limits, location validation, one-time tokens |

---

## Phase 5: Scale & Microservices Migration (Months 15-18)

### Goal
Prepare for enterprise scale (100+ schools, 100K+ users) by migrating to microservices architecture.

### When to Split into Microservices

**Triggers to Consider Migration:**

1. **Team Size**: 15+ developers working on same codebase
2. **Deployment Frequency**: Need independent deployment cycles
3. **Performance**: Specific modules need different scaling
4. **Database Bottlenecks**: Single database can't handle load
5. **Organizational**: Multiple teams owning different domains

**Metrics Indicating Need:**
- API latency > 500ms P95
- Database CPU > 80% consistently
- Deployment takes > 30 minutes
- More than 3 teams working on same repo
- Frequent merge conflicts

---

### Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                          │
│                    (Kong or AWS API Gateway)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
         │   Auth     │ │  Tenant │ │   User    │
         │  Service   │ │ Service │ │  Service  │
         └────────────┘ └─────────┘ └───────────┘
                │             │             │
         ┌──────▼─────────────▼─────────────▼─────┐
         │                                         │
    ┌────▼────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐
    │Attendance│  │ Grading │  │ Finance  │  │   LMS   │
    │ Service  │  │ Service │  │ Service  │  │ Service │
    └──────────┘  └─────────┘  └──────────┘  └─────────┘
         │             │             │             │
    ┌────▼────────────▼─────────────▼─────────────▼────┐
    │                Event Bus (NATS / RabbitMQ)        │
    └───────────────────────────────────────────────────┘
         │             │             │             │
    ┌────▼────┐  ┌────▼────┐  ┌─────▼────┐  ┌────▼────┐
    │   DB 1  │  │   DB 2  │  │   DB 3   │  │   DB 4  │
    │Attendance│  │ Grading │  │ Finance  │  │   LMS   │
    └─────────┘  └─────────┘  └──────────┘  └─────────┘
```

---

### Migration Strategy (Strangler Pattern)

**Phase 5.1: Preparation (Week 1-2)**
1. Identify service boundaries
2. Map data dependencies
3. Set up service infrastructure
4. Implement API gateway

**Phase 5.2: Extract First Service - Notifications (Week 3-4)**
```
Why notifications first?
- Lowest dependencies
- Clear boundaries
- Non-critical (can fail without breaking core)
- Good learning experience
```

**Implementation:**
```typescript
// notification-service/
├── src/
│   ├── api/           # REST API endpoints
│   ├── consumers/     # Event consumers
│   ├── models/        # Database models
│   ├── services/      # Business logic
│   └── workers/       # Background jobs
├── Dockerfile
├── package.json
└── tsconfig.json

// API endpoints
POST   /api/notifications              # Create notification
GET    /api/notifications/:userId      # Get user's notifications
PATCH  /api/notifications/:id/read     # Mark as read
DELETE /api/notifications/:id          # Delete notification

// Event consumers (listens to event bus)
- attendance.marked → Send parent notification
- payment.received → Send receipt notification
- grade.published → Send grade notification
```

**Phase 5.3: Extract Payment Service (Week 5-7)**
```
Why payments second?
- Clear business domain
- Existing integration (Xendit)
- Can be scaled independently
- Security isolation benefits
```

**Phase 5.4: Extract Grading Service (Week 8-10)**
```
Why grading third?
- Complex calculations (benefits from isolation)
- Different scaling needs (heavy compute)
- Can optimize database independently
```

**Phase 5.5: Extract Attendance Service (Week 11-12)**

**Phase 5.6: Database Per Service (Week 13-16)**
- Migrate each service to its own database
- Implement eventual consistency
- Handle distributed transactions (Saga pattern)

**Phase 5.7: Monitoring & Observability (Week 17-18)**
- Distributed tracing (Jaeger)
- Service mesh (Istio or Linkerd)
- Centralized logging (ELK stack)
- Metrics aggregation (Prometheus + Grafana)

---

### Communication Patterns

#### Synchronous (REST/gRPC)
```typescript
// Service-to-service calls for immediate consistency
const grade = await gradingService.getStudentGrade(studentId, classId);
```

#### Asynchronous (Event Bus)
```typescript
// Publish event
eventBus.publish('attendance.marked', {
  student_id: studentId,
  class_id: classId,
  date: today,
  status: 'present',
});

// Subscribe to events
eventBus.subscribe('attendance.marked', async (event) => {
  // Send notification
  await notificationService.sendAttendanceNotification(event);
});
```

#### API Gateway Pattern
```yaml
# Kong API Gateway configuration
services:
  - name: attendance-service
    url: http://attendance-service:3000
    routes:
      - name: attendance-routes
        paths:
          - /api/attendance
        methods:
          - GET
          - POST
          - PATCH
        plugins:
          - name: jwt
          - name: rate-limiting
            config:
              minute: 100
```

---

### Data Management

#### Database Per Service
```sql
-- Attendance Service DB
attendance_db
  ├── attendance_records
  ├── attendance_qr_tokens
  └── attendance_settings

-- Grading Service DB
grading_db
  ├── assignments
  ├── submissions
  ├── grades
  └── grading_scales

-- Finance Service DB
finance_db
  ├── fee_categories
  ├── student_fees
  ├── payments
  └── payment_receipts
```

#### Data Synchronization
```typescript
// Event-driven data replication
eventBus.subscribe('student.created', async (event) => {
  // Replicate student info to grading service
  await gradingDB.students.create({
    id: event.student_id,
    name: event.name,
    // Only data needed for grading
  });
});

eventBus.subscribe('student.updated', async (event) => {
  await gradingDB.students.update(event.student_id, event.changes);
});
```

#### Saga Pattern for Distributed Transactions
```typescript
// Example: Student Enrollment Saga
class EnrollmentSaga {
  async execute(enrollmentData: EnrollmentData) {
    const saga = new Saga();

    try {
      // Step 1: Create enrollment
      const enrollment = await saga.step(
        () => enrollmentService.create(enrollmentData),
        (enrollment) => enrollmentService.delete(enrollment.id) // Compensate
      );

      // Step 2: Add to class roster
      await saga.step(
        () => classService.addStudent(enrollmentData.class_id, enrollmentData.student_id),
        () => classService.removeStudent(enrollmentData.class_id, enrollmentData.student_id)
      );

      // Step 3: Create gradebook entry
      await saga.step(
        () => gradingService.createGradebookEntry(enrollment),
        (entry) => gradingService.deleteGradebookEntry(entry.id)
      );

      // Step 4: Generate fee
      await saga.step(
        () => financeService.generateTuitionFee(enrollment),
        (fee) => financeService.deleteFee(fee.id)
      );

      saga.commit();
      return enrollment;
    } catch (error) {
      // Rollback all steps
      await saga.rollback();
      throw error;
    }
  }
}
```

---

### Infrastructure

#### Containerization (Docker)
```dockerfile
# Dockerfile for each service
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Orchestration (Kubernetes)
```yaml
# attendance-service deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: attendance-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: attendance-service
  template:
    metadata:
      labels:
        app: attendance-service
    spec:
      containers:
        - name: attendance-service
          image: educrm/attendance-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: attendance-db-secret
                  key: url
            - name: EVENT_BUS_URL
              value: nats://nats-service:4222
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: attendance-service
spec:
  selector:
    app: attendance-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: attendance-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: attendance-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

### Scaling Real-Time Features

#### Chat System (Phase 5 Extension)
```
Architecture:
- WebSocket gateway (Socket.io or WS)
- Redis pub/sub for message broadcasting
- PostgreSQL for message persistence
- Separate chat service

Scaling:
- Multiple WebSocket servers with Redis adapter
- Load balancer with sticky sessions
- Message queue for offline delivery
```

**Implementation:**
```typescript
// chat-service with Redis adapter
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const io = new Server(3001, {
  cors: { origin: '*' },
});

// Redis adapter for multi-server setup
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});

// Handle connections
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  const schoolId = socket.handshake.auth.schoolId;

  // Join school room
  socket.join(`school:${schoolId}`);

  // Join user room
  socket.join(`user:${userId}`);

  // Handle messages
  socket.on('message', async (data) => {
    // Validate tenant boundary
    if (data.school_id !== schoolId) {
      return socket.emit('error', 'Unauthorized');
    }

    // Save message
    const message = await saveMessage(data);

    // Broadcast to room
    io.to(`school:${schoolId}`).emit('message', message);

    // Notify offline users
    await notifyOfflineUsers(data.recipients);
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

io.listen(3001);
```

#### Notification Scaling
```
Current: Database polling (not scalable)
Future:
- Push notifications (FCM/APNS)
- WebSocket for real-time delivery
- Redis for in-memory queue
- Worker pool for processing

Architecture:
Frontend → WebSocket → Notification Service → Redis Queue → Workers → FCM/APNS
```

---

### Phase 5 Deliverables

✅ Microservices architecture
✅ API Gateway
✅ Service-to-service communication
✅ Distributed tracing
✅ Centralized logging
✅ Auto-scaling infrastructure
✅ Database per service
✅ Event-driven architecture
✅ CI/CD per service
✅ 99.9% uptime SLA

---

### Phase 5 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Increased operational complexity | High | High | Invest in DevOps tooling, monitoring, documentation |
| Data consistency issues | High | Medium | Implement Saga pattern, eventual consistency, idempotency |
| Network latency between services | Medium | High | Service mesh, caching, async communication where possible |
| Migration downtime | High | Low | Blue-green deployment, canary releases, feature flags |
| Cost increase (infrastructure) | Medium | High | Right-size resources, auto-scaling, reserved instances |
| Developer learning curve | Medium | High | Training, documentation, pair programming, gradual rollout |

---

## Technology Stack Summary

### Current (MVP - Phase 1-3)
```
Frontend:    React + TypeScript + TailwindCSS
Backend:     Supabase (PostgreSQL + Auth + Edge Functions)
Mobile:      React Native
Payments:    Xendit
Hosting:     Vercel (frontend), Supabase (backend)
```

### Future (Phase 4-5)
```
Frontend:    React + TypeScript + TailwindCSS
Mobile:      React Native
Services:    Node.js microservices (TypeScript)
Databases:   PostgreSQL (per service)
Message Bus: NATS or RabbitMQ
Cache:       Redis (Upstash)
Storage:     S3 or Cloudflare R2
Gateway:     Kong or AWS API Gateway
Orchestration: Kubernetes (EKS/GKE)
Monitoring:  Prometheus + Grafana + Jaeger
CI/CD:       GitHub Actions
```

---

## Cost Estimates

### Phase 1-2 (MVP): ~$500-1000/month
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Domain & SSL: $20/month
- Monitoring (Sentry): $29/month
- Xendit fees: ~2.9% per transaction

### Phase 3-4 (Growth): ~$2000-5000/month
- Supabase Scale: $599/month
- Additional services: $500/month
- OpenAI API: $500-1000/month
- Storage: $200/month
- Analytics: $100/month

### Phase 5 (Enterprise): ~$10,000-20,000/month
- Kubernetes cluster: $5000/month
- Databases: $3000/month
- Load balancers: $500/month
- Monitoring stack: $1000/month
- CDN: $500/month
- Message bus: $300/month
- Misc services: $700/month

---

## Timeline Summary

| Phase | Duration | Key Deliverables | Team Size |
|-------|----------|------------------|-----------|
| Phase 1 | 3 months | MVP Stabilization, Mobile, CI/CD | 3-5 devs |
| Phase 2 | 3 months | Finance & Payments (Xendit) | 3-5 devs |
| Phase 3 | 4 months | Grading & LMS | 5-7 devs |
| Phase 4 | 4 months | AI Chatbot, RFID, QR, Automation | 7-10 devs |
| Phase 5 | 4 months | Microservices, Scaling | 10-15 devs |

**Total Timeline: 18 months**

---

## Success Metrics

### Phase 1
- ✅ 100+ schools onboarded
- ✅ 10,000+ active users
- ✅ < 2s page load time (P95)
- ✅ < 0.1% error rate
- ✅ Mobile app in production

### Phase 2
- ✅ Payment integration complete
- ✅ IDR 1B+ processed
- ✅ 80%+ online payment adoption

### Phase 3
- ✅ 500+ teachers using gradebook
- ✅ 10,000+ assignments created
- ✅ 50,000+ submissions graded

### Phase 4
- ✅ Chatbot answering 10,000+ queries/month
- ✅ 50+ schools using RFID
- ✅ 80%+ automation rate for reports

### Phase 5
- ✅ 500+ schools
- ✅ 100,000+ active users
- ✅ 99.9% uptime SLA
- ✅ < 500ms API latency (P95)
- ✅ Horizontal scalability proven

---

## Conclusion

This roadmap provides a clear path from MVP to enterprise-scale platform. Key principles:

1. **Start Simple**: Monolith is fine for MVP
2. **Add Value Early**: Finance and grading features drive revenue
3. **Automate Incrementally**: RFID and chatbot reduce operational burden
4. **Scale When Needed**: Don't over-engineer early
5. **Measure Everything**: Data-driven decisions for migration timing

Remember: **The best architecture is the one that solves today's problems while remaining flexible for tomorrow's growth.**
