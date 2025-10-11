# Product Requirements Document: Community App (MVP)

## 1. Introduction/Overview

The Community App MVP enables global sales leaders, key opinion leaders, and sales representatives to share knowledge, discover curated resources, and maintain a lightweight professional profile. The first release prioritizes core authentication, profile management, and content consumption for an English-speaking audience. Integrations such as WhatsApp and branded UI will be abstracted but stubbed, allowing future expansion without delaying the initial launch.

## 2. Assumptions & Inputs

- Target Personas: Sales leaders and influencers who curate content; sales reps who consume it.
- Launch Scope: Global availability, English-only UI/content, desktop and mobile web support.
- Deployment Goal: Ship a locally hosted MVP as quickly as possible; production hardening comes later.
- Notifications: WhatsApp and email providers not yet chosen; MVP implements a provider interface and development stub only.
- Branding: No formal brand system yet. Use best-practice component libraries (recommend React + Tailwind + shadcn/ui) with accessibility in mind; final theming is a future enhancement.
- Storage & Infrastructure: PostgreSQL for persistence, FastAPI backend, React frontend, local filesystem storage for assets (avatars/files) is acceptable for MVP.
- Security/Compliance: Follow general best practices (bcrypt hashes, HTTPS, audit logging). Formal certifications (e.g., GDPR Article 30 records, PDPA) are future work.
- Admin Model: Single super-admin account maintains content catalog; no multi-level moderation yet.
- Rate Limiting/Queues: In-process solutions acceptable; Redis or external queues can be introduced later.

## 3. Goals

- Launch a functional closed beta for ≥20 sales leaders/reps within 6 weeks of development start.
- Achieve end-to-end account creation → profile completion → content download flow with <1.5s P95 API latency.
- Maintain ≥95% success rate for content downloads during beta (tracked via audit log).
- Provide a clean abstraction so real WhatsApp/email providers can be plugged in within two development days later.

## 4. User Stories (MVP Scope)

### Authentication & Accounts
- **As a prospective member**, I can register with my email, name, phone, and password so I can join the community.
- **As a member**, I can verify my email so that my account is activated.
- **As a returning member**, I can log in securely and stay signed in on trusted devices.
- **As a member who forgot my password**, I can request a reset link to regain access.

### Profiles
- **As a new member**, I can complete my profile (bio, interests, avatar) to introduce myself to the community.
- **As a member**, I can control the visibility of my profile details to remain private or share selectively.
- **As another member**, I can view profiles that are shared with me to learn about peers.

### Content
- **As a member**, I can browse and search community resources to find relevant material quickly.
- **As a member**, I can view a content detail page, preview metadata, and download files.
- **As a member**, I can like or comment on content to engage with the community.
- **As an admin**, I can upload new content with metadata and manage existing items.

### Notifications & Preferences
- **As a member**, I can opt in/out of future WhatsApp/email notifications so I control how I’m contacted.
- **As the system**, I log notification intents even if they use the stub provider so we can verify triggers.

## 5. Functional Requirements

Each requirement includes acceptance criteria (AC) to ensure clear verification.

### FR-1: User Registration & Verification
- AC-1: Registration requires email, first name, last name, phone (E.164 format), and password meeting complexity policy (≥8 chars, 1 upper, 1 lower, 1 digit, 1 special).
- AC-2: Duplicate email or phone returns HTTP 409 with field-level error message.
- AC-3: A verification email is queued via the notification stub and logged in `Audit_Logs`.
- AC-4: Accounts remain in `pending` state until the verification link is confirmed; unverified users cannot log in.

### FR-2: Authentication & Sessions
- AC-1: Verified users can log in with email/phone + password; invalid credentials return HTTP 401.
- AC-2: Rate limiting enforces ≥5 failed login attempts per 15 minutes per IP/user; exceeding returns HTTP 429.
- AC-3: Successful login issues a 15-minute JWT access token and sets a refresh token in a secure, HttpOnly cookie (7 days standard, 30 days with Remember Me).
- AC-4: Refresh endpoint rotates tokens; expired refresh tokens require re-authentication.

### FR-3: Password Recovery
- AC-1: Forgot-password form accepts email and sends a time-bound (30 minutes) reset link via stub provider.
- AC-2: Reset link invalidates after first use or expiry; invalid/expired links prompt re-request.
- AC-3: Password changes require the same complexity policy and trigger an audit log entry.

### FR-4: Profile Management
- AC-1: Members can view and edit profile fields: first/last name, phone, bio (500 chars), avatar, location, interests.
- AC-2: Avatar uploads accept JPG/PNG ≤5MB; files are resized to 512x512px max and stored locally with unique filenames.
- AC-3: Profile updates validate required fields and return HTTP 422 with details on failure.
- AC-4: Changes are versioned in `Audit_Logs` with actor ID and timestamp.

### FR-5: Profile Privacy Controls
- AC-1: Members can choose privacy levels {Private (default), Community, Admin-only}.
- AC-2: Profile API enforces visibility rules server-side; unauthorized requests return HTTP 403.
- AC-3: Privacy preferences persist in `User_Preferences` and are applied to detail endpoints.

### FR-6: Content Browsing & Discovery
- AC-1: Members can list content with pagination (default 12 per page, max 50).
- AC-2: Filters support category, content type, upload date range, and keyword search on title/description.
- AC-3: Responses include metadata: title, description, category, uploader, likes count, comment count, last updated.
- AC-4: Empty states display a helpful message and call-to-action for admins to upload content.

### FR-7: Content Consumption
- AC-1: Content detail endpoint returns full metadata plus download URL secured via signed token (valid for 5 minutes).
- AC-2: Downloads increment the user’s download count and log an entry in `Audit_Logs` (user_id, content_id, timestamp).
- AC-3: File storage path is abstracted so migration to object storage requires config change only.

### FR-8: Content Engagement
- AC-1: Members can like/unlike content; repeated likes do not create duplicates.
- AC-2: Members can create, edit, and soft-delete their own comments; admins can delete any comment.
- AC-3: Comment bodies capped at 1,000 characters; HTML sanitized to prevent XSS.
- AC-4: Engagement actions update counters atomically and surface in list/detail responses.

### FR-9: Admin Content Management
- AC-1: Admin-only dashboard lists all content with filters for draft/published status.
- AC-2: Admins can upload files (PDF, PPT, DOCX, PNG, MP4) up to 200MB with mandatory metadata (title, description (250 chars), category).
- AC-3: Admins can update metadata or replace files; version history stored in `Audit_Logs`.
- AC-4: Admins can archive content; archived items hidden from member browse results but remain retrievable by admin.

### FR-10: Notification Preferences & Stub Provider
- AC-1: Members can opt in/out of three notification categories (Content, Community, Account) via settings screen.
- AC-2: Notification service exposes provider interface; default implementation logs payloads without external delivery.
- AC-3: Trigger points (e.g., successful registration, new admin content) call the abstraction and record success/failure.
- AC-4: Provider configuration lives in environment variables to simplify future vendor integration.

### FR-11: Audit Logging & Reporting
- AC-1: `Audit_Logs` captures key events (auth changes, profile edits, content CRUD, downloads) with actor, action, target, metadata JSON.
- AC-2: Admins can view a paginated audit feed filtered by action type and date.
- AC-3: Audit records are immutable; corrections create new entries referencing the original.

## 6. Non-Goals (Out of Scope for MVP)

- Two-way WhatsApp interactions, automated group management, or analytics beyond logging.
- Social logins (Google, LinkedIn), multi-language UI, or mobile apps.
- Advanced moderation workflow (separate moderator role, dispute resolution).
- Payment processing, monetization features, or revenue reporting.
- Real-time activity feed or push notifications.
- Compliance automation (DPIA tooling, formal retention workflows) beyond best-effort practices.

## 7. Design Considerations

- Responsive web layout targeting modern browsers; support viewport widths ≥320px.
- Default component stack: React + Tailwind CSS + shadcn/ui (Radix-based) for accessible, composable UI primitives.
- Provide clear empty states, error handling, and success confirmations for each flow.
- Accessibility: Follow WCAG AA basics (contrast ratios, keyboard navigation, form labels).
- Branding placeholder: neutral color palette with easy override once brand guide is delivered.

## 8. Technical Considerations

- Backend: FastAPI + SQLAlchemy + Pydantic. *Rationale:* FastAPI delivers async-first performance with automatic OpenAPI docs, while SQLAlchemy provides mature ORM support for PostgreSQL. Pydantic (v2) gives fast data validation aligned with FastAPI’s dependency injection.
- Frontend: React 19 + Vite + TypeScript + TanStack Query + React Router. *Rationale:* React 19 is the current stable channel and unlocks the new `use` hook and improved SSR/streaming, which keeps us current without relying on experimental APIs. Vite offers significantly faster dev builds than CRA; TypeScript boosts developer confidence; TanStack Query handles caching/retries for API data.
- UI Toolkit: Tailwind CSS + shadcn/ui (Radix Primitives). *Rationale:* Tailwind accelerates MVP styling while keeping design token friendly; shadcn/ui supplies accessible headless components we can theme once branding arrives.
- API Authentication: JWT access tokens + HttpOnly refresh cookie (SameSite=Lax in dev, Strict in prod). *Rationale:* Matches modern SPA best practices while balancing security (HttpOnly cookies) and developer productivity (JWT introspection-free).
- ORM Migrations: Alembic. *Rationale:* Well-supported with SQLAlchemy, enables version-controlled schema evolution and repeatable deployments.
- Testing: Pytest for backend (fixtures, async support); React Testing Library + Vitest for frontend to cover key user flows. Snapshot tests avoided to reduce maintenance.
- Background jobs: FastAPI `BackgroundTasks`/TaskGroup initially; abstract so we can swap to Celery/RQ if throughput demands increase.
- Config & Secrets: `.env`-driven settings parsed via Pydantic settings module. *Rationale:* Clear separation between environments, easy rotation later (can plug into AWS SSM/Secrets Manager).
- Dev Experience: Prettier + ESLint (frontend) and Ruff + Black (backend) for lint/format; Commit hooks optional but recommended once team grows.
- Observability: Structured JSON logging (loguru or stdlib logging) with request IDs; Prometheus-compatible metrics if we deploy to cloud providers later.

## 9. Data Model Overview

| Entity | Key Fields | Notes |
| --- | --- | --- |
| Users | id (UUID), email (unique), phone (unique), password_hash, first_name, last_name, status (`pending`/`active`/`suspended`), created_at | Stores core account data. |
| User_Preferences | user_id (FK), privacy_level, notify_content, notify_community, notify_account | Boolean flags + enum for privacy. |
| Profiles | user_id (PK/FK), bio, location, interests (array/tag table), avatar_path, last_completed_at | Optional metadata. |
| Categories | id, name (unique), description | Admin-maintained taxonomy. |
| Content_Items | id, title, description, file_path, file_type, file_size, category_id, owner_id, status (`published`/`archived`), published_at | Core content records. |
| Comments | id, content_id, author_id, body, status (`active`/`deleted`), created_at, updated_at | Soft delete retains record. |
| Likes | id, content_id, user_id, created_at | Unique constraint on (content_id, user_id). |
| User_Sessions | id, user_id, refresh_token_hash, expires_at, device_info, ip_address | Supports refresh token rotation and revocation. |
| Audit_Logs | id, actor_id, action_type, target_type, target_id, metadata JSON, created_at | Immutable event log. |

Indexes: email, phone, status on `Users`; (content_id, user_id) on `Likes`; created_at on `Content_Items` and `Audit_Logs`; text search index on content title/description.

## 10. API Endpoints (MVP)

| Method | Path | Description | Auth | Rate Limit | Success | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | Register new user | Public | 5/min/IP | 201 + user_id | 409, 422 |
| POST | `/auth/verify` | Confirm email verification token | Public | 10/min/IP | 204 | 400, 404 |
| POST | `/auth/login` | Authenticate user | Public | 5/15m/IP | 200 + tokens | 401, 429 |
| POST | `/auth/refresh` | Refresh tokens | Cookie | 10/15m/IP | 200 + tokens | 401 |
| POST | `/auth/logout` | Invalidate refresh token | Authenticated | 20/hour | 204 | 401 |
| POST | `/auth/forgot-password` | Request reset link | Public | 5/15m/email | 204 | 404 (obscured), 429 |
| POST | `/auth/reset-password` | Reset via token | Public | 5/15m/IP | 204 | 400, 410 |
| GET | `/profile/me` | Fetch own profile | Authenticated | 60/min | 200 | 401 |
| PATCH | `/profile/me` | Update own profile | Authenticated | 30/min | 200 | 401, 422 |
| GET | `/profile/{user_id}` | View other profile (respect privacy) | Authenticated | 30/min | 200 | 403, 404 |
| GET | `/content` | List/browse content | Authenticated | 120/min | 200 | 401 |
| GET | `/content/{content_id}` | Content detail | Authenticated | 60/min | 200 | 401, 404 |
| POST | `/content/{content_id}/download` | Generate download link/log | Authenticated | 30/min | 200 | 401, 404 |
| POST | `/content/{content_id}/likes` | Like content | Authenticated | 60/min | 204 | 401, 404 |
| DELETE | `/content/{content_id}/likes` | Unlike content | Authenticated | 60/min | 204 | 401, 404 |
| GET | `/content/{content_id}/comments` | List comments | Authenticated | 120/min | 200 | 401 |
| POST | `/content/{content_id}/comments` | Add comment | Authenticated | 30/min | 201 | 401, 422 |
| PATCH | `/comments/{comment_id}` | Update comment | Authenticated (owner/admin) | 20/min | 200 | 401, 403, 404 |
| DELETE | `/comments/{comment_id}` | Delete (soft) | Authenticated (owner/admin) | 20/min | 204 | 401, 403, 404 |
| GET | `/admin/content` | Admin list/manage content | Admin | 60/min | 200 | 401, 403 |
| POST | `/admin/content` | Upload new content | Admin | 10/min | 201 | 401, 403, 422 |
| PATCH | `/admin/content/{content_id}` | Update metadata/status | Admin | 20/min | 200 | 401, 403, 404, 422 |
| GET | `/admin/audit-logs` | View audit feed | Admin | 20/min | 200 | 401, 403 |

## 11. Security & Privacy

- Passwords hashed with bcrypt (cost factor 12). Password resets enforced via signed, single-use tokens.
- All endpoints served over HTTPS; HTTP disabled in production environments.
- Refresh cookies flagged `HttpOnly`, `Secure`, `SameSite=Lax` (upgrade to Strict post-beta).
- Input validation and output encoding to prevent injection attacks; sanitize user-generated content.
- Role-based access enforced server-side; admin routes require `Administrator` role claim.
- Audit logs retained for ≥180 days in MVP; define retention policy before public launch.
- Backup strategy: nightly database dump stored securely, manual restore plan documented.
- PII classification: email/phone considered sensitive; restrict logging of raw values except where essential.

## 12. Non-Functional Requirements

- Performance: API endpoints P95 < 1.5s, P99 < 2.5s under 100 concurrent users.
- Availability: 99% uptime target during beta (business hours focus).
- Scalability: Support 10k content records and 5k users without schema redesign.
- Observability: Structured logging with request IDs; basic metrics (requests/sec, errors) exposed.
- Rate Limiting: Implement in-process limiter (e.g., Redis optional later).
- File Storage: Local filesystem with clear path convention (`/storage/{env}/content/...`); plan for S3 migration.
- Accessibility: WCAG 2.1 AA basics (labels, focus states, contrast).

## 13. UI/Page Map

- Auth: Register, Verify Email confirmation screen, Login, Forgot/Reset Password, Logout confirmation.
- Profile: View My Profile, Edit Profile, Privacy Settings, View Other Profile (permission-aware).
- Content: Content Library (filters/search), Content Detail (metadata + comments + download), My Downloads (optional table view).
- Admin: Content Dashboard, Upload/Edit Content, Audit Log Viewer.
- Legal: Terms of Service (`/terms-of-service` placeholder), Privacy Policy (`/privacy-policy` placeholder).
- Settings: Notification Preferences (toggle categories).

## 14. Rollout & Migration Plan

- Database: Initial Alembic migration creates core tables; seed categories (if any) and one super-admin.
- Configuration: `.env` template documenting secrets (JWT keys, storage paths, provider toggles).
- Email/WhatsApp: Provide stub implementations that write to console/log; feature flag to disable triggers if needed.
- Deployment: Start with local Docker Compose; document steps to deploy to cloud (e.g., Fly.io, Render) post-beta.
- Data Import: Manual content upload by admin; no migration from legacy systems.
- Monitoring: Set up basic uptime check (e.g., health endpoint ping) and log rotation.

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Notification providers undecided | Delays real user messaging | Maintain provider interface + stub; document integration steps. |
| Large media files exceed local storage | Service disruption | Enforce 200MB limit; monitor disk usage; plan S3 migration. |
| Email deliverability issues | Users blocked from activation | Add admin override to manually verify accounts; integrate provider when chosen. |
| Manual admin workload | Slower content curation | Keep admin tools simple; document bulk upload script as future enhancement. |
| Security gaps for public launch | Reputational risk | Schedule security review before public GA; enforce best practices even in MVP. |

## 16. Success Metrics

- Closed beta adoption: ≥20 verified users within first month; ≥70% profile completion rate.
- Engagement: At least 30 content downloads and 15 comments per week during beta.
- Reliability: <5% failed download attempts; no critical Sev-1 incidents during beta.
- Time-to-integration: Ability to plug a real WhatsApp/email provider and send first message within 2 working days post-selection.

## 17. Open Questions

1. **Notification Providers (Owner: Product, Needed by: prior to public launch)** — Which email and WhatsApp vendors will we standardize on (e.g., SendGrid, Twilio)?
2. **Hosting Environment (Owner: Engineering, Needed by: end of beta)** — Where will the MVP be deployed after local testing (cloud provider, container platform)?
3. **Compliance Roadmap (Owner: Product/Legal, Needed by: pre-public launch)** — Which regulations (GDPR, PDPA) need formal documentation and when?
4. **Branding & Theming (Owner: Design, Needed by: Q2)** — When will brand guidelines be available to replace neutral UI styling?
5. **Future Multi-language Support (Owner: Product, Needed by: roadmap planning)** — Timeline and priority for adding localization/internationalization.
