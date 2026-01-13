# Admin Mode and Notification Setup Plan

## Overview

Implement admin mode functionality and notification preferences for viewer accounts. When a viewer account logs in, they should be prompted to set up notification preferences.

## Issues to Fix First

### 1. Prisma Client Error
- **Problem**: `Property 'forecast' does not exist on type 'PrismaClient'`
- **Cause**: Prisma client not regenerated after schema changes
- **Fix**: Regenerate Prisma client and ensure schema is synced

## Database Schema Updates

### User Model Updates
Add to `prisma/schema.prisma`:
- `role` field: `String` enum ('admin' | 'viewer') with default 'viewer'
- `notificationsSetup` field: `Boolean` default `false`
- Relationship to `UserNotificationPreferences`

### UserNotificationPreferences Model
New model to store notification preferences:
- `id`: String (cuid)
- `userId`: String (foreign key to User)
- `notifyOnForecastSave`: Boolean
- `notifyOnClinicAdded`: Boolean
- `notifyOnTaskAdded`: Boolean (for future use)
- `notifyOnTaskCompleted`: Boolean (for future use)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Implementation Steps

### Phase 1: Fix Prisma Client Issue
1. Regenerate Prisma client: `npx prisma generate`
2. Verify build works: `npm run build`
3. Test forecast save/load/delete endpoints

### Phase 2: Add User Roles
1. Update Prisma schema with `role` field
2. Run migration: `npx prisma migrate dev --name add_user_roles`
3. Update `getCurrentUser()` to return role
4. Create `isAdmin()` helper function
5. Update seed script to create admin user

### Phase 3: Notification Preferences Schema
1. Add `UserNotificationPreferences` model to schema
2. Add `notificationsSetup` field to User model
3. Run migration: `npx prisma migrate dev --name add_notification_preferences`
4. Create API endpoint: `POST /api/notifications/preferences`

### Phase 4: Notification Setup Modal
1. Create `NotificationSetupModal.tsx` component
2. Show modal when viewer logs in and `notificationsSetup === false`
3. Form fields:
   - "New forecast saved" checkbox
   - "New clinics added" checkbox
   - "New task added/completed" checkbox (disabled with "Coming soon" label)
4. Save preferences on submit
5. Set `notificationsSetup = true` after save

### Phase 5: Admin Mode UI
1. Create admin dashboard/panel (can be added to navigation)
2. Add admin-only routes/pages
3. Protect admin routes with `isAdmin()` check
4. Show admin badge/indicator in navigation

### Phase 6: Notification System (Future)
1. Create notification service/API
2. Trigger notifications on:
   - Forecast saved
   - Clinic added (when implemented)
   - Task added/completed (when implemented)
3. Store notifications in database
4. Display notification center/bell icon

## Files to Create/Modify

### New Files
- `components/NotificationSetupModal.tsx` - Modal for setting up notifications
- `app/api/notifications/preferences/route.ts` - API for saving preferences
- `lib/admin.ts` - Admin helper functions
- `app/admin/page.tsx` - Admin dashboard (optional, for future)

### Modified Files
- `prisma/schema.prisma` - Add role and notification preferences
- `lib/auth.ts` - Add `isAdmin()` function, return role in `getCurrentUser()`
- `app/login/page.tsx` - Redirect to notification setup if viewer and not setup
- `app/page.tsx` or create middleware - Check and show notification setup modal
- `scripts/seed-user.ts` - Create admin user by default
- `components/Navigation.tsx` - Show admin indicator if admin

## User Flow

### Admin User
1. Logs in → Goes to home page
2. Sees admin badge/indicator
3. Has access to admin features (to be defined)

### Viewer User (First Time)
1. Logs in → Redirected to notification setup
2. Sees modal: "Set up your notifications"
3. Selects preferences
4. Submits → Preferences saved, `notificationsSetup = true`
5. Redirected to home page

### Viewer User (Subsequent Logins)
1. Logs in → Goes to home page
2. No notification setup prompt

## API Endpoints

### `POST /api/notifications/preferences`
- Body: `{ notifyOnForecastSave, notifyOnClinicAdded, notifyOnTaskAdded, notifyOnTaskCompleted }`
- Creates or updates `UserNotificationPreferences`
- Sets `notificationsSetup = true` on User
- Returns success/error

### `GET /api/notifications/preferences`
- Returns current user's notification preferences
- Used to check if setup is needed

## Environment Variables

No new environment variables needed. Admin user can be created via seed script or manually.

## Testing Checklist

- [ ] Prisma client regenerated and build succeeds
- [ ] Admin user can log in and see admin features
- [ ] Viewer user sees notification setup on first login
- [ ] Notification preferences save correctly
- [ ] Viewer user doesn't see setup modal after completing it
- [ ] Admin user doesn't see notification setup
- [ ] Role-based access control works
