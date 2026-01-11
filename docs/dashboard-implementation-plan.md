# Dashboard Implementation Plan

## Overview
Create a unified dashboard as the landing page for logged-in users, centralizing all features with clear upgrade paths for free users.

---

## Phase 1: Core Dashboard Page

### 1.1 Create Dashboard Page (`/(platform)/dashboard/page.tsx`)
- **Quick Stats Row**: Last scan score, scans this month, critical issues
- **Primary CTA**: Large "Scan Now" button
- **Feature Cards Grid**:
  - Saved Scans (locked for free users)
  - Scheduled Scans (locked for free users)
  - History (with recent 2-3 items preview)
  - Settings
- **Account Status Card**: Tier, upgrade CTA for free users

### 1.2 Create Dashboard Stats API (`/api/dashboard/stats`)
- Endpoint: GET `/api/dashboard/stats`
- Returns:
  - `lastScanDate`, `lastScanScore`, `lastScanHealthStatus`
  - `scansThisMonth`
  - `criticalIssuesThisMonth`
  - `connectedCRMs` (count)
  - `savedScansCount`
  - `scheduledScansCount`
  - `subscriptionTier`, `subscriptionStatus`

### 1.3 Update Routing
- Redirect authenticated users from `/` to `/dashboard`
- Update navigation/header links

---

## Phase 2: Scan Page (Replaces Upload)

### 2.1 Create Scan Options Page (`/(platform)/scan/page.tsx`)
- **Upload Section**: Drag-and-drop file upload (migrate from `/upload`)
- **Saved Scans Section** (paid): List of saved scans with "Run" button
- **CRM Section**: List connected CRMs with "Scan Now" button each
- **Configure CRM Link**: Button to add new CRM connection

### 2.2 Migrate Upload Functionality
- Move file upload logic from `/upload/page.tsx` to `/scan/page.tsx`
- Keep same processing flow (upload → processing → results)
- Delete or redirect old `/upload` route

### 2.3 CRM Scan Integration
- Add "Scan from CRM" functionality
- Reuse existing CRM data fetch logic from scheduled reviews
- Create endpoint: POST `/api/scan/crm/{connection_id}`

---

## Phase 3: Saved Scans Feature

### 3.1 Database Model
```prisma
model SavedScan {
  id              String    @id @default(uuid())
  userId          String
  name            String
  description     String?
  sourceType      String    // "crm"
  crmConnectionId String?
  crmConnection   CRMConnection? @relation(fields: [crmConnectionId], references: [id])
  filters         Json?     // Stage filters, owner filters, date ranges
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastUsedAt      DateTime?

  user            User      @relation(fields: [userId], references: [id])
}
```

### 3.2 API Endpoints
- `GET /api/saved-scans` - List user's saved scans
- `POST /api/saved-scans` - Create saved scan
- `PUT /api/saved-scans/{id}` - Update saved scan
- `DELETE /api/saved-scans/{id}` - Delete saved scan
- `POST /api/saved-scans/{id}/run` - Execute saved scan

### 3.3 Subscription Gating
- Check `subscriptionTier` in ["pro", "team", "enterprise"]
- Return 403 for free users attempting to create/run saved scans
- Frontend shows locked state with upgrade prompt

### 3.4 UI Components
- SavedScanCard component
- CreateSavedScanModal
- SavedScansList on dashboard and scan page

---

## Phase 4: Settings Page

### 4.1 Create Settings Page (`/(platform)/settings/page.tsx`)
Tabbed or sectioned layout:

**CRM Connections Section**
- List connected CRMs (migrate from `/crm`)
- Add new connection buttons (Salesforce, HubSpot)
- Test connection, disconnect options
- Last sync status

**Delivery Options Section**
- Default email recipients (for reports)
- Slack webhook configuration
- Test delivery buttons

**Subscription Section**
- Current plan display
- Usage stats (if applicable)
- Upgrade button (for free users)
- Manage subscription button → Stripe portal (for paid users)

**Account Section**
- Profile info (from Clerk)
- Link to Clerk user management

### 4.2 API Endpoints
- `GET /api/settings/delivery` - Get delivery preferences
- `PUT /api/settings/delivery` - Update delivery preferences

### 4.3 Database Model Addition
```prisma
model UserSettings {
  id                String   @id @default(uuid())
  userId            String   @unique
  defaultEmailRecipients String[]
  slackWebhookUrl   String?
  slackEnabled      Boolean  @default(false)
  emailEnabled      Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id])
}
```

---

## Phase 5: Free vs Paid User Experience

### 5.1 Locked Feature Cards
- Saved Scans card: Shows lock icon, "Pro" badge, preview text
- Scheduled Scans card: Shows lock icon, "Pro" badge, preview text
- Click triggers upgrade modal

### 5.2 Upgrade Modal Component
- Feature comparison (what they get)
- Price display
- CTA to pricing page or direct checkout

### 5.3 Feature Visibility
- Free users SEE all features (creates desire)
- Free users CANNOT use paid features (clear feedback)
- Upgrade path is always 1-2 clicks away

---

## Phase 6: Polish & Navigation

### 6.1 Navigation Updates
- Update header/sidebar to show "Dashboard" as primary
- Remove "Upload" from navigation
- Add "Settings" to navigation

### 6.2 Recent Activity on Dashboard
- Show last 3 scans inline on History card
- Quick-click to view results

### 6.3 Getting Started Checklist (New Users)
- Shown only if: no scans run AND no CRMs connected
- Steps: Run first scan, Connect CRM, Set up schedule
- Dismissible, stored in localStorage or database

---

## File Changes Summary

### New Files
```
frontend/app/(platform)/dashboard/page.tsx
frontend/app/(platform)/scan/page.tsx
frontend/app/(platform)/settings/page.tsx
frontend/components/dashboard/QuickStatsRow.tsx
frontend/components/dashboard/FeatureCard.tsx
frontend/components/dashboard/AccountStatusCard.tsx
frontend/components/dashboard/UpgradeModal.tsx
frontend/components/scan/FileUploadSection.tsx
frontend/components/scan/SavedScansSection.tsx
frontend/components/scan/CRMSection.tsx
frontend/components/settings/CRMConnectionsSection.tsx
frontend/components/settings/DeliveryOptionsSection.tsx
frontend/components/settings/SubscriptionSection.tsx
backend/app/routes/dashboard.py
backend/app/routes/saved_scans.py
backend/app/routes/settings.py
backend/prisma/migrations/xxx_add_saved_scans_and_settings/
```

### Modified Files
```
frontend/app/(platform)/layout.tsx (navigation updates)
frontend/app/page.tsx (redirect logic for authenticated users)
frontend/components/Header.tsx or similar (nav links)
backend/app/main.py (register new routers)
backend/prisma/schema.prisma (new models)
```

### Deprecated/Removed
```
frontend/app/(platform)/upload/page.tsx → redirect to /scan
frontend/app/(platform)/crm/page.tsx → functionality moved to /settings
```

---

## Implementation Order

1. **Dashboard page** - Core layout with placeholder cards
2. **Dashboard stats API** - Backend endpoint for stats
3. **Scan page** - Migrate upload, add CRM scan options
4. **Settings page** - CRM + Delivery + Subscription sections
5. **Saved Scans** - Database model, API, UI
6. **Navigation updates** - Routing, redirects, header links
7. **Free/Paid UX** - Locked states, upgrade modal
8. **Polish** - Recent activity, getting started checklist

---

## Questions Resolved
- [x] Replace `/upload` with `/scan` flow: YES
- [x] Add subscription to Settings: YES
- [x] Layout style: Card-based
