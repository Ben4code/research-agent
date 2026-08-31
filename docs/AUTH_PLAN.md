# Authentication & Public/Private Research Plan

> **Status:** Implemented (v1) — admin role added 2026-08-30  
> **Date:** 2026-08-30  
> **Author:** AI Assistant  
> **Reviewers:** @nnaemekaobioha  

---

## 1. Overview

Implement user authentication using [Better Auth](https://better-auth.com) SDK and add public/private visibility controls for research projects.

**Current State:**
- Hardcoded `demo-user-id` in API controllers
- No authentication infrastructure
- All research implicitly private to demo user
- No sharing capabilities

**Target State:**
- Real user accounts (email/password, extensible to OAuth)
- Session-based auth via Better Auth
- Research visibility toggle: `PRIVATE` (owner only) or `PUBLIC` (shareable link)
- Public research accessible without authentication via unique token
- All new research is set to public by default.
- All existing research is set to public by default.


---

## 2. Goals

| Goal | Priority |
|------|----------|
| Replace hardcoded demo user with real auth | P0 |
| Users can create accounts and sign in | P0 |
| Research is private by default | P0 |
| Users can make research public via shareable link | P1 |
| Public links work without authentication | P1 |
| Admin role with code-based self-registration | P1 |
| Admin can view and edit/delete all research | P1 |
| Admin can make research public/private | P1 |
| Foundation for future OAuth providers | P2 |
- OAuth providers (Google) — Phase 2
- Public research discovery/indexing (unlisted only)
- Fine-grained RBAC permissions (editors, viewers beyond admin)


---

## 3. Non-Goals
- Team/organization accounts
- Rate limiting on public endpoints (separate concern)


---

## 4. Architecture

### 4.1 Auth Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   NestJS    │────▶│  PostgreSQL │
│   (web)     │◄────│   (api)     │◄────│   (db)      │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
  Better Auth         Better Auth
  React Client        Node.js Server
  (sessions)          (session validation)
```

### 4.2 Public/Private Access Model

| Scenario | Auth Required | Access Check |
|----------|-------------|--------------|
| Create research | Yes | `userId` from session |
| List own research | Yes | `userId` from session |
| View own research | Yes | `userId` matches OR `visibility = PUBLIC` |
| View public research | No | Valid `shareToken` |
| Toggle visibility | Yes | `userId` matches |
| List all research (admin) | Yes | `role = admin` |
| Delete / toggle any research (admin) | Yes | `role = admin` |
| Claim admin role | Yes | Valid `ADMIN_SIGNUP_CODE` |

---

## 5. Database Schema Changes

### 5.1 New/Modified Models

```prisma
// Modified for Better Auth — Better Auth generates the id (nanoid), email is unique.
model User {
  id            String    @id // Better Auth generates (nanoid)
  email         String    @unique
  name          String?
  emailVerified Boolean   @default(false)
  image         String?
  role          String    @default("user") // NEW — "user" | "admin"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  accounts      Account[]
  research      Research[]
}

// Modified — add visibility and shareToken
model Research {
  id          String     @id @default(cuid())
  userId      String
  question    String
  instructions String?
  status      String     @default("pending")
  workflowId  String?
  visibility  Visibility @default(PUBLIC)   // NEW — public by default
  shareToken  String?    @unique             // NEW — nanoid(21)
  createdAt   DateTime   @default(now())
  completedAt DateTime?
  updatedAt   DateTime   @updatedAt

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  sources  Source[]
  findings Finding[]
  reports  Report[]
  events   ResearchEvent[]

  @@index([userId])
  @@index([visibility])   // NEW
  @@index([shareToken])   // NEW
}

enum Visibility {
  PRIVATE
  PUBLIC
}

// New — Better Auth required tables
model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@unique([providerId, accountId])
  @@index([userId])
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([identifier, value])
}
```

### 5.2 Migration Strategy

1. **Development:** `prisma migrate dev` — creates new tables, adds columns
2. **Production:** `prisma migrate deploy` — Coolify auto-runs on API start
3. **Existing data:** All existing research gets `visibility = PRIVATE` (safe default)

---

## 6. API Changes

### 6.1 New Files

| File | Purpose |
|------|---------|
| `src/auth/auth.module.ts` | Better Auth NestJS integration |
| `src/auth/auth.guard.ts` | Route protection (`@UseGuards(AuthGuard)`) |
| `src/auth/admin.guard.ts` | Admin route protection (`@UseGuards(AdminGuard)`) |
| `src/auth/current-user.decorator.ts` | Extract user from request |
| `src/auth/session-user.ts` | Typed session user (includes `role`) |
| `src/admin/admin.module.ts` | Admin module wiring |
| `src/admin/admin.controller.ts` | Admin endpoints |
| `src/admin/admin.service.ts` | Admin queries (claim, list, delete, visibility) |
| `src/common/share-token.ts` | Share token generation (`nanoid(21)`) |

### 6.2 Modified Controllers

**Before:**
```typescript
const DEMO_USER_ID = 'demo-user-id';

@Post()
create(@Body() dto: CreateResearchRequest) {
  return this.service.create(DEMO_USER_ID, dto);
}
```

**After:**
```typescript
@Post()
@UseGuards(AuthGuard)
create(@CurrentUser() user: User, @Body() dto: CreateResearchRequest) {
  return this.service.create(user.id, dto);
}
```

### 6.3 New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/research/:id/visibility` | Yes | Toggle public/private |
| `GET` | `/research/public/:token` | No | Get public research by share token |

**Visibility toggle request:**
```typescript
{
  "visibility": "PUBLIC"  // or "PRIVATE"
}
```

**Response (PUBLIC):**
```typescript
{
  "id": "...",
  "visibility": "PUBLIC",
  "shareToken": "abc123...",
  "shareUrl": "https://ui.celeboty.com/research/public/abc123..."
}
```

### 6.4 Service Layer Updates

```typescript
// findOne — allow public access without userId match
async findOne(userId: string | null, id: string) {
  const research = await this.prisma.research.findFirst({
    where: {
      id,
      OR: [
        { userId: userId ?? undefined },
        { visibility: 'PUBLIC' },
      ],
    },
    // ... include relations
  });
  
  if (!research) throw new NotFoundException();
  return research;
}

// New — generate share token
async updateVisibility(userId: string, id: string, visibility: Visibility) {
  const research = await this.prisma.research.findFirst({
    where: { id, userId },
  });
  
  if (!research) throw new NotFoundException();
  
  const shareToken = visibility === 'PUBLIC' 
    ? research.shareToken ?? nanoid(21)
    : null;
    
  return this.prisma.research.update({
    where: { id },
    data: { visibility, shareToken },
  });
}
```

### 6.5 Admin Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admin/claim` | Yes (any user) | Promote current user to `admin` with the signup code |
| `GET` | `/admin/research` | Admin | List every research project with owner (newest first) |
| `GET` | `/admin/users` | Admin | List all users with research count |
| `DELETE` | `/admin/research/:id` | Admin | Delete any research (cascades sources/findings/reports/events) |
| `POST` | `/admin/research/:id/visibility` | Admin | Set any research PUBLIC/PRIVATE |

**Admin claim request:**
```typescript
{ "code": "<ADMIN_SIGNUP_CODE>" }
```

`AdminGuard` extends `AuthGuard` and rejects non-`admin` users with `403 Forbidden`. The `role` is a Better Auth `additionalField` on the user, so it is returned in the session and read fresh from the DB on every `getSession` call.

---

## 7. Frontend Changes

### 7.1 New Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Better Auth React client config |
| `app/(auth)/login/page.tsx` | Sign in page |
| `app/(auth)/register/page.tsx` | Sign up page |
| `components/auth/AuthProvider.tsx` | Session context provider |
| `components/auth/SignOutButton.tsx` | Sign out action |
| `components/auth/RequireAuth.tsx` | Route guard (authenticated only) |
| `components/admin/RequireAdmin.tsx` | Route guard (admin only, with claim link) |
| `app/admin/register/page.tsx` | Admin code registration form |
| `app/admin/page.tsx` | Admin dashboard — all research + users |
| `components/research/VisibilityToggle.tsx` | Public/private switch |
| `components/research/ShareLink.tsx` | Copy public URL |
| `app/research/public/[token]/page.tsx` | Public research view (no auth) |

### 7.2 Auth Client Setup

```typescript
// lib/auth.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
```

### 7.3 Route Protection

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  const { data: session, isPending } = useSession()
  
  if (isPending) return <Loading />
  if (!session) redirect('/login')
  
  return <>{children}</>
}
```

### 7.4 Public Research Page

```typescript
// app/research/public/[token]/page.tsx
export default async function PublicResearchPage({ params }) {
  const research = await fetchPublicResearch(params.token)
  
  return (
    <PublicResearchView 
      research={research}
      readOnly
      hidePrivateFields
    />
  )
}
```

### 7.5 Admin Registration & Dashboard

**Admin registration flow (`/admin/register`):**

1. User must be signed in (`RequireAuth`).
2. User enters the `ADMIN_SIGNUP_CODE`; the form posts to `POST /api/admin/claim`.
3. On success, the Better Auth session is refetched (`useSession().refetch()`) so `role = admin` propagates immediately, then the user is redirected to `/admin`.
4. Already-admin users are redirected straight to `/admin`.

**Dashboard (`/admin`):**

- Wrapped in `RequireAdmin`, which shows a "Register as admin" panel when the session role is not `admin` and redirects unauthenticated visitors to `/login`.
- Fetches `GET /api/admin/research` and `GET /api/admin/users` in parallel.
- Renders stat cards (total research, public projects, total users) and two tabs: **Research** and **Users**.
- Each research row shows the owner, `StatusBadge`, visibility, created date, and admin actions: toggle visibility (`Eye`/`EyeOff`) and delete (`Trash2`), plus a link to open the research.
- Each user row shows name, email, role badge, research count, and join date.
- The nav (`UserNav`) shows an **Admin** link only for users with `role = admin`.

```typescript
// app/admin/page.tsx (excerpt)
export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}
```

---

## 8. Environment Variables

### API (`.env`)
```bash
# Existing
DATABASE_URL=postgresql://...
TEMPORAL_ADDRESS=temporal:7233

# New — Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=https://api.celeboty.com

# New — Admin
ADMIN_SIGNUP_CODE=your-secret-admin-code
```

### Web (`.env.local`)
```bash
# Existing
NEXT_PUBLIC_API_URL=https://api.celeboty.com

# No new vars needed — uses same API URL
```

---

## 9. Implementation Phases

### Phase 1: Database & Auth Foundation
- [x] Update Prisma schema (User, Session, Account, Verification, Research visibility)
- [x] Create migration
- [x] Install Better Auth dependencies
- [x] Configure Better Auth in NestJS
- [x] Create auth guard and decorator

### Phase 2: API Auth Integration
- [x] Replace `DEMO_USER_ID` with `@CurrentUser()`
- [x] Protect all `/research/*` endpoints
- [x] Add visibility toggle endpoint
- [x] Add public research endpoint

### Phase 3: Frontend Auth
- [x] Install Better Auth React client
- [x] Create login/register pages
- [x] Add auth provider to app layout
- [x] Protect dashboard routes
- [x] Update API calls to include credentials

### Phase 4: Public Sharing
- [x] Create visibility toggle component
- [x] Create share link component
- [x] Build public research page
- [x] Test public access without auth

### Phase 5: Admin Role & Dashboard
- [x] Add `role` additional field to Better Auth user (default `"user"`)
- [x] Add `AdminGuard` (extends `AuthGuard`, requires `role = admin`)
- [x] Add `POST /admin/claim` with `ADMIN_SIGNUP_CODE`
- [x] Add `GET /admin/research`, `GET /admin/users`
- [x] Add `DELETE /admin/research/:id`, `POST /admin/research/:id/visibility`
- [x] Add `/admin/register` page (code claim, session refetch)
- [x] Add `/admin` dashboard (all research + users, admin actions)
- [x] Add `RequireAdmin` guard and Admin nav link for admins

---

## 10. Testing Checklist

| Test | Expected Result |
|------|---------------|
| Create account | User persisted, session created |
| Sign in | Session cookie set, redirects to dashboard |
| Sign out | Session cleared, redirects to login |
| Create research (authed) | Research created with `userId` |
| Create research (unauthed) | 401 Unauthorized |
| Toggle to PUBLIC | `shareToken` generated, URL returned |
| Access public URL | Research visible without auth |
| Access private research (other user) | 404 Not Found |
| Access private research (owner) | Research visible |
| Toggle back to PRIVATE | `shareToken` cleared, public URL 404s |
| Claim admin with correct code | User role becomes `admin`, session refreshed |
| Claim admin with wrong code | 403 Forbidden |
| `GET /admin/research` (non-admin) | 403 Forbidden |
| `GET /admin/research` (admin) | All research across users with owners |
| `DELETE /admin/research/:id` | Research removed for all users |
| Admin dashboard | Lists all research/users, visibility + delete actions work |

---

## 11. Migration Path

### Existing Data
- All existing research: `visibility = PUBLIC` (default)
- Demo user: **Resolved** — replaced by Better Auth accounts; historical research stays with its original owner (or a clean-slate reseed for staging)

### Rollback Plan
- Better Auth tables are additive — safe to rollback code
- `visibility` and `shareToken` columns have defaults — safe to keep
- No breaking changes to existing API contract

---

## 12. Open Questions

| Question | Decision Needed | Owner |
|----------|---------------|-------|
| OAuth providers in scope? | Google, GitHub, or none | @nnaemekaobioha |
| Public research discovery? | Unlisted only, or searchable index | @nnaemekaobioha |
| Rate limiting on public endpoints? | Separate ticket or included | @nnaemekaobioha |
| Email verification required? | Yes or skip for MVP | @nnaemekaobioha |
| Password reset flow? | Include or defer | @nnaemekaobioha |
| Beyond admin RBAC (editors/viewers)? | Deferred — only `user`/`admin` shipped | @nnaemekaobioha |

---

## 13. References

- [Better Auth Documentation](https://better-auth.com)
- [Better Auth NestJS Integration](https://better-auth.com/docs/integrations/nestjs)
- [Better Auth Next.js Integration](https://better-auth.com/docs/integrations/next-js)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## Appendix A: Better Auth Config (NestJS)

```typescript
// src/auth/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // MVP
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
})
```

## Appendix B: Share Token Generation

```typescript
import { customAlphabet } from 'nanoid'

// URL-safe, no ambiguous characters
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  21
)

// Collision probability: ~1% after generating 1 billion tokens
// Sufficient for share links
```
