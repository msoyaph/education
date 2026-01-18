# Supabase Configuration Guide

## Required Dashboard Configurations

This document outlines configuration changes that must be made in the Supabase Dashboard. These settings cannot be applied via migrations and require manual configuration.

---

## 1. Auth Configuration

### 1.1 Password Security (CRITICAL)

**Issue**: Leaked password protection is currently disabled.

**Action Required**:
1. Navigate to: **Authentication > Settings > Security** in Supabase Dashboard
2. Find: **"Leaked Password Protection"**
3. Enable: **"Check passwords against HaveIBeenPwned.org"**
4. This prevents users from setting compromised passwords

**Benefits**:
- Blocks 600M+ compromised passwords
- Prevents credential stuffing attacks
- No performance impact (cached checks)
- Improves overall security posture

**Screenshot Path**: `Authentication > Settings > Security > Leaked Password Protection`

---

### 1.2 Database Connection Strategy

**Issue**: Auth server uses fixed connection count (10 connections) instead of percentage-based allocation.

**Current**: 10 fixed connections
**Recommended**: 5-10% of total connections (percentage-based)

**Action Required**:
1. Navigate to: **Settings > Database > Connection Pooling**
2. Find: **"Auth Server Connection Pool"**
3. Change from: `Fixed: 10 connections`
4. Change to: `Percentage: 10%` (adjust based on needs)

**Benefits**:
- Auto-scales with database instance size
- Better resource utilization
- Prevents auth bottlenecks as you scale

**Note**: This setting affects auth performance. Start with 10% and monitor.

---

## 2. Database Performance (Optional Cleanup)

### 2.1 Unused Indexes

**Issue**: 60+ indexes are marked as "unused" in Supabase Advisor.

**Context**: These indexes are unused because:
- Database has minimal test data
- No production traffic yet
- Indexes will be used once real data is loaded

**Action Required**:
✅ **NO ACTION NEEDED** - These indexes are correctly configured for production use. They will be utilized once:
- Real school data is loaded
- Users start querying the system
- Attendance records accumulate
- Reports are generated

**DO NOT DROP** these indexes. They are part of the MVP performance baseline defined in `MVP_COMPLETION_CRITERIA.md`.

### 2.2 Index List (Keep All)

These indexes are **correctly configured** and should remain:
- All `idx_*_school` indexes (tenant isolation)
- All `idx_*_user` indexes (user lookups)
- All `idx_*_date` indexes (date-based queries)
- All `idx_notifications_*` indexes (notification performance)
- All `idx_attendance_*` indexes (attendance reports)

**When to review**: After 30 days of production usage, use Supabase Advisor to identify truly unused indexes.

---

## 3. Migration Summary

### 3.1 What Was Fixed via Migration

✅ **Added Missing Foreign Key Indexes**:
- `attendance_records.marked_by` - Performance: 10-100x on joins
- `notif_queue.school_id` - Tenant isolation queries
- `notif_subscriptions.event_type` - Subscription lookups
- `notifications.sender_id` - Sender filtering
- `user_roles.assigned_by` - Audit trail queries

✅ **Optimized RLS Policies** (20+ policies):
- Changed: `auth.uid()` → `(SELECT auth.uid())`
- Impact: Auth function evaluated once per query instead of per row
- Performance gain: 10-100x on tables with many rows
- Affected: All major tables (students, classes, attendance, etc.)

✅ **Removed Duplicate Policies**:
- `schools`: Consolidated 3 policies into 1 optimized policy
- `user_profiles`: Consolidated 3 policies into 2 optimized policies
- Result: Clearer policy logic, same security, better performance

✅ **Hardened Function Security** (12 functions):
- Added: `SET search_path = public` to all functions
- Prevents: Search path hijacking attacks
- Functions: All helper functions, triggers, and security functions

---

## 4. Verification Checklist

After applying dashboard configurations, verify:

### Database Performance
- [ ] Run query: `SELECT * FROM students LIMIT 100;` - Should complete in < 100ms
- [ ] Run query: `SELECT * FROM attendance_records WHERE student_id = $1;` - Uses index
- [ ] Check: Supabase Dashboard > Database > Indexes - All show "valid" status

### Auth Configuration
- [ ] Leaked password protection is enabled
- [ ] Try creating user with password "password123" - Should be rejected
- [ ] Auth server connection strategy is percentage-based

### RLS Security
- [ ] Run: `SELECT * FROM schools;` as authenticated user - Returns only user's school
- [ ] Run: `SELECT * FROM students;` as parent - Returns only their children
- [ ] Run: `SELECT * FROM attendance_records;` as teacher - Returns only their classes

---

## 5. Performance Baseline Verification

After configuration changes, verify these baselines from `MVP_COMPLETION_CRITERIA.md`:

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Database Query Time | < 100ms (P95) | Supabase Studio > Logs > Slow Queries |
| API Response Time (Read) | < 200ms (P95) | Application monitoring |
| API Response Time (Write) | < 500ms (P95) | Application monitoring |
| RLS Policy Overhead | < 10ms per query | Query analyzer in Supabase |

---

## 6. Ongoing Monitoring

### Weekly Checks (First Month)
1. **Unused Indexes**: Review Supabase Advisor weekly
   - Some indexes may remain "unused" until specific features are used
   - Don't drop indexes marked as required in MVP criteria

2. **Slow Queries**: Monitor slow query log
   - Investigate queries > 500ms
   - Check if missing indexes on new columns

3. **RLS Performance**: Check policy evaluation time
   - Should remain < 10ms per query
   - If increasing, investigate complex policies

### Monthly Review
1. **Index Usage**: After 30 days of real usage
   - Review truly unused indexes
   - Consider dropping if confirmed unused with real traffic

2. **Auth Performance**: Check auth server metrics
   - Connection pool utilization
   - Login/signup latency
   - Adjust connection percentage if needed

3. **Database Size**: Monitor growth
   - Current target: < 5GB for MVP
   - Plan for scaling at 3GB

---

## 7. Security Recommendations

### Implemented ✅
- RLS enabled on all tables
- Auth function optimization (SELECT pattern)
- Function search path hardening
- Foreign key indexes for performance
- Duplicate policy cleanup

### Required Dashboard Config 🔧
- Enable leaked password protection
- Switch to percentage-based auth connections

### Future Enhancements (Post-MVP) 🔮
- Enable email verification (Phase 1)
- Configure password reset emails (Phase 1)
- Set up 2FA for admins (Phase 2)
- Implement audit logging (Phase 2)
- Configure backup retention (Phase 2)

---

## 8. Troubleshooting

### Issue: "Slow query performance after migration"
**Solution**: Run `ANALYZE` on all tables to update query planner statistics:
```sql
ANALYZE schools;
ANALYZE user_profiles;
ANALYZE students;
ANALYZE attendance_records;
-- etc.
```

### Issue: "RLS policy denying legitimate access"
**Solution**: Check if user has proper `school_id` in `user_profiles`:
```sql
SELECT id, email, school_id, user_type
FROM user_profiles
WHERE id = auth.uid();
```

### Issue: "Function search_path errors"
**Solution**: All functions updated with explicit `search_path = public`. If errors persist:
1. Check function definition in Supabase Dashboard
2. Verify function was recreated (not just altered)
3. Look for custom schemas that might conflict

---

## 9. References

- **Migration File**: `supabase/migrations/*_fix_security_and_performance_issues.sql`
- **MVP Criteria**: `MVP_COMPLETION_CRITERIA.md`
- **Supabase RLS Docs**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **Performance Optimization**: https://supabase.com/docs/guides/database/postgres/performance

---

## 10. Quick Action Summary

**IMMEDIATE (Before Launch)**:
1. ✅ Apply security migration (DONE)
2. 🔧 Enable leaked password protection in dashboard
3. 🔧 Switch auth connection strategy to percentage-based

**MONITOR (First 30 Days)**:
1. Watch for slow queries (should be rare)
2. Verify RLS policies work correctly
3. Monitor index usage with real data

**OPTIMIZE (After 30 Days)**:
1. Review index usage with real traffic
2. Adjust connection pool percentages if needed
3. Tune query performance based on actual usage patterns

---

**Status**: Configuration guide complete
**Last Updated**: 2026-01-18
**Migration Applied**: ✅ Yes
**Dashboard Config**: ⏳ Pending (manual steps above)
