# Migration TODOs - Backend Support Required

This document lists all backend support requirements identified during the migration audit.

## Critical Backend Requirements

### 1. Tenant Isolation Validation
**Priority: CRITICAL**

- [ ] All API endpoints must validate `school_id` matches user's `school_id`
- [ ] Reject requests where `school_id` in payload differs from user's `school_id`
- [ ] Log all tenant boundary violation attempts
- [ ] RLS policies must enforce tenant isolation at database level

**Files Affected:**
- All Edge Functions (attendance, notifications)
- All API endpoints

### 2. Capability-Based Authorization
**Priority: CRITICAL**

- [ ] Replace role-based checks with capability-based checks
- [ ] Implement capability validation middleware
- [ ] Return user capabilities in `/user/profile` endpoint
- [ ] Validate capabilities on every API request

**Capabilities to Implement:**
- `attendance:read`, `attendance:mark`, `attendance:update`, `attendance:delete`
- `classes:read`, `classes:create`, `classes:update`, `classes:delete`
- `students:read`, `students:view`, `students:create`, `students:update`
- `notifications:read`, `notifications:create`, `notifications:manage`
- `reports:read`, `reports:view`
- `settings:read`, `settings:update`
- `users:read`, `users:create`, `users:update`, `users:manage`
- `admin:view`, `admin:manage`

**Files Affected:**
- `supabase/functions/attendance/index.ts`
- `supabase/functions/notifications/index.ts`
- All Edge Functions

### 3. API Request Validation
**Priority: HIGH**

- [ ] Validate `school_id` in all request payloads
- [ ] Reject requests missing `school_id` (except public endpoints)
- [ ] Validate user has permission for requested resource
- [ ] Return standardized error responses

**Error Response Format:**
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "status": 403,
  "details": {}
}
```

### 4. User Profile Endpoint Enhancement
**Priority: HIGH**

- [ ] Include user capabilities in `/user/profile` response
- [ ] Include `school_id` in user profile response
- [ ] Cache user profile and capabilities
- [ ] Invalidate cache on role/permission changes

**Response Format:**
```json
{
  "profile": { ... },
  "capabilities": [
    { "resource": "attendance", "action": "mark" },
    ...
  ],
  "school_id": "uuid"
}
```

### 5. Direct Supabase Query Removal
**Priority: MEDIUM**

- [ ] Move `UserContext` queries to Edge Function
- [ ] Move `notificationService.sendAttendanceNotification` queries to Edge Function
- [ ] All database queries must go through Edge Functions
- [ ] Edge Functions must enforce RLS and tenant isolation

**Files to Refactor:**
- `src/domains/auth/contexts/UserContext.tsx` (lines 62-107)
- `src/domains/communication/services/notificationService.ts` (lines 161-186)

## Medium Priority Requirements

### 6. Feature Flag API
**Priority: MEDIUM**

- [ ] Create `/features` endpoint to return enabled features
- [ ] Include feature flags in tenant context response
- [ ] Support feature flag overrides per tenant

### 7. Error Handling Standardization
**Priority: MEDIUM**

- [ ] Standardize all error responses
- [ ] Include error codes in all responses
- [ ] Provide actionable error messages
- [ ] Log all errors with context

### 8. Request Logging
**Priority: MEDIUM**

- [ ] Log all API requests with:
  - User ID
  - School ID
  - Endpoint
  - Timestamp
  - Response status
- [ ] Alert on tenant boundary violations
- [ ] Alert on permission denials

## Low Priority Requirements

### 9. API Rate Limiting
**Priority: LOW**

- [ ] Implement rate limiting per user
- [ ] Implement rate limiting per tenant
- [ ] Return rate limit headers

### 10. Request Validation
**Priority: LOW**

- [ ] Validate all request payloads
- [ ] Return validation errors with field-level details
- [ ] Use JSON Schema for validation

## Security Requirements

### 11. JWT Validation
**Priority: CRITICAL**

- [ ] Validate JWT on every request
- [ ] Verify `school_id` in JWT matches request `school_id`
- [ ] Reject expired or invalid tokens
- [ ] Implement token refresh mechanism

### 12. CORS Configuration
**Priority: HIGH**

- [ ] Configure CORS for production domains
- [ ] Reject requests from unauthorized origins
- [ ] Include credentials in CORS headers

### 13. Input Sanitization
**Priority: HIGH**

- [ ] Sanitize all user inputs
- [ ] Validate all IDs (UUID format)
- [ ] Prevent SQL injection
- [ ] Prevent XSS attacks

## Testing Requirements

### 14. Integration Tests
**Priority: HIGH**

- [ ] Test tenant isolation (cannot access other tenant's data)
- [ ] Test capability-based authorization
- [ ] Test error handling
- [ ] Test multi-tenant scenarios

### 15. Security Tests
**Priority: HIGH**

- [ ] Test privilege escalation attempts
- [ ] Test tenant boundary violations
- [ ] Test JWT tampering
- [ ] Test unauthorized access attempts

## Documentation Requirements

### 16. API Documentation
**Priority: MEDIUM**

- [ ] Document all API endpoints
- [ ] Document required capabilities
- [ ] Document error codes
- [ ] Document tenant isolation requirements

### 17. Security Documentation
**Priority: MEDIUM**

- [ ] Document security architecture
- [ ] Document tenant isolation strategy
- [ ] Document capability system
- [ ] Document threat model
