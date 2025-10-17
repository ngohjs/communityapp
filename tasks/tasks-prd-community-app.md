## Relevant Files

- `docs/tasks/prd-community-app.md` - Source PRD describing scope, acceptance criteria, and constraints.
- `backend/app/main.py` - FastAPI application entry point; mount routers and middleware here.
- `backend/app/config.py` - Centralized settings module for environment configuration.
- `backend/app/database.py` - SQLAlchemy engine/session utilities (new) backing all DB access.
- `backend/app/models/user.py` - SQLAlchemy models for users, profiles, preferences, sessions.
- `backend/app/models/content.py` - Models for categories, content items, comments, likes, audit logs.
- `backend/app/schemas/auth.py` - Pydantic schemas for auth requests/responses.
- `backend/app/schemas/profile.py` - Schemas for profile data and privacy preferences.
- `backend/app/schemas/content.py` - Schemas for content CRUD, comments, likes.
- `backend/app/api/routes/auth.py` - Auth endpoints (register, verify, login, refresh, password reset).
- `backend/app/api/routes/profile.py` - Profile CRUD and privacy routes.
- `backend/app/api/routes/content.py` - Member-facing content browse/detail/engagement routes.
- `backend/app/api/routes/admin.py` - Admin content management and audit log endpoints.
- `backend/app/services/auth_service.py` - Business logic for auth flows, token management.
- `backend/app/services/notification_service.py` - Notification provider abstraction + stub implementation.
- `backend/app/services/audit_service.py` - Helper for persisting audit log entries across modules.
- `backend/app/services/profile_service.py` - Profile retrieval and update business logic.
- `backend/app/security.py` - Password hashing and token helpers for auth flows.
- `backend/app/utils/rate_limiter.py` - In-process rate limiter state for auth endpoints.
- `backend/app/middleware/rate_limit.py` - Middleware enforcing auth endpoint rate limits.
- `backend/app/dependencies.py` - Shared FastAPI dependencies (auth, DB helpers).
- `backend/app/utils/files.py` - Helpers for avatar storage and image resizing.
- `backend/tests/test_auth.py` - Backend tests covering auth/session flows.
- `backend/tests/test_profile.py` - Backend tests validating profile endpoints.
- `backend/alembic/versions/0003_add_user_admin_and_privacy_defaults.py` - Migration adding admin flag and privacy defaults.
- `backend/scripts/seed_dev.py` - Seeds admin user and categories for development environments.
- `backend/tests/test_profiles.py` - Tests for profile privacy and update flows.
- `backend/tests/test_content.py` - Tests for content listing, engagement, and admin operations.
- `frontend/package.json` - Update scripts/dependencies for Vite, Tailwind, shadcn/ui.
- `frontend/vite.config.ts` - Vite configuration (new) replacing CRA tooling.
- `frontend/tailwind.config.ts` - Tailwind configuration (new) for styling system.
- `frontend/postcss.config.js` - Tailwind/PostCSS pipeline configuration.
- `frontend/src/main.tsx` - React entry; set up Router, QueryClient, providers.
- `frontend/src/App.tsx` - Application shell/layout, route composition.
- `frontend/src/lib/api/client.ts` - Axios/TanStack Query client with auth interceptors.
- `frontend/src/routes/auth/LoginPage.tsx` - Login form and validation.
- `frontend/src/routes/auth/RegisterPage.tsx` - Registration flow UI.
- `frontend/src/routes/auth/VerifyEmailPage.tsx` - Verification confirmation.
- `frontend/src/routes/auth/ForgotPasswordPage.tsx` - Reset request UI.
- `frontend/src/routes/auth/ResetPasswordPage.tsx` - Password reset form.
- `frontend/src/routes/profile/ProfilePage.tsx` - Profile view with privacy-aware rendering.
- `frontend/src/routes/profile/EditProfilePage.tsx` - Profile edit form, avatar upload.
- `frontend/src/routes/profile/SettingsPage.tsx` - Notification and privacy settings UI.
- `frontend/src/routes/content/LibraryPage.tsx` - Content list with filters/search/pagination.
- `frontend/src/routes/content/ContentDetailPage.tsx` - Content detail, likes, comments, download.
- `frontend/src/routes/admin/AdminContentDashboard.tsx` - Admin CRUD interface for content.
- `frontend/src/routes/admin/AuditLogPage.tsx` - Admin audit log viewer.
- `frontend/src/components/forms/*` - Shared form components (input, select, file upload).
- `frontend/src/components/content/*` - Reusable content cards, comment list components.
- `frontend/src/__tests__/auth.test.tsx` - Frontend tests for auth flows.
- `frontend/src/__tests__/profile.test.tsx` - Tests for profile edit/privacy UI.
- `frontend/src/__tests__/content.test.tsx` - Tests for content list/detail interactions.
- `docker-compose.yml` - Update services and volumes to support new backend/frontend flow.
- `README.md` - Document setup, env vars, seed instructions, rollout notes.
- `backend/requirements.txt` - Python dependencies for the backend services.
- `backend/alembic.ini` - Alembic configuration for database migrations.
- `backend/alembic/env.py` - Alembic environment script tying into application metadata.
- `backend/alembic/versions/0001_initial_schema.py` - Initial migration creating core database tables.
- `backend/app/database.py` - SQLAlchemy engine and session helpers.
- `backend/app/models/user.py` - SQLAlchemy model for core user entity.
- `backend/app/models/profile.py` - Profile metadata linked to users.
- `backend/app/models/preference.py` - User notification/privacy preferences model.
- `backend/app/models/category.py` - Content category model for taxonomy.
- `backend/app/models/content.py` - Content items with metadata and relations.
- `backend/app/models/comment.py` - Member comments on content.
- `backend/app/models/like.py` - Like records with uniqueness constraint.
- `backend/app/models/session.py` - Persistent user session records.
- `backend/app/models/audit.py` - Audit log entries for system actions.
- `backend/app/models/password_reset.py` - Password reset token records and expiry tracking.
- `backend/app/models/__init__.py` - Aggregate exports for SQLAlchemy models.
- `backend/scripts/seed_dev.py` - Development seed script for categories and super-admin.
- `backend/scripts/__init__.py` - Package marker for backend scripts.
- `backend/tests/test_placeholder.py` - Temporary pytest placeholder ensuring suite passes.

### Notes

- Co-locate unit/integration tests alongside their implementation where practical (e.g., `module_test.py` next to `module.py`, `Component.test.tsx` next to `Component.tsx`).
- Use `pytest` for backend and `pnpm vitest` (or `npm run test`) for frontend; update scripts accordingly.
- Document seeded admin credentials securely and avoid committing actual secrets.

## Tasks

- [x] 1.0 Backend Platform & Database Foundations
  - [x] 1.1 Review existing FastAPI scaffold, define application settings module, and wire environment-based configuration.
  - [x] 1.2 Introduce SQLAlchemy engine/session helpers and register them as FastAPI dependencies.
  - [x] 1.3 Configure Alembic with base migration scripts and generate the initial schema migration for core tables.
  - [x] 1.4 Implement SQLAlchemy models (Users, Profiles, Preferences, Sessions, Categories, Content, Comments, Likes, AuditLogs) with indices and relationships.
  - [x] 1.5 Seed development data script for baseline categories and bootstrap super-admin account.

- [x] 2.0 Backend Authentication & Session Management
  - [x] 2.1 Build registration endpoint with validation, password hashing, pending status, and audit entry.
  - [x] 2.2 Implement email verification tokens, verification endpoint, and pending→active transition.
  - [x] 2.3 Implement login, refresh, logout endpoints issuing/rotating JWT access + HttpOnly refresh cookies, persisting tokens in `User_Sessions`.
  - [x] 2.4 Implement forgot/reset password flow with time-bound tokens, stub email dispatch, and logging.
  - [x] 2.5 Add in-process rate limiting middleware for auth endpoints (5 attempts per 15 minutes) and tests.

- [x] 3.0 Backend Profiles, Privacy & Preferences
  - [x] 3.1 Implement profile retrieval/update endpoints with validation and audit logging.
  - [x] 3.2 Add avatar upload handling (file validation, resize to 512x512, local storage path management).
  - [x] 3.3 Implement privacy preference persistence (Private/Community/Admin) and enforce visibility rules on profile fetch.
  - [x] 3.4 Implement notification preference toggles (content/community/account) and expose settings endpoint.

- [ ] 4.0 Backend Content Library, Engagement & Admin Tools
  - [ ] 4.1 Build admin content CRUD endpoints (create, update, archive) with metadata validation and file storage.
  - [ ] 4.2 Implement member-facing content listing with filters, search, pagination, and response DTOs.
  - [ ] 4.3 Implement content detail endpoint with signed download token generation and download logging.
  - [ ] 4.4 Implement likes/comments endpoints with ownership checks, sanitization, and counter updates.
  - [ ] 4.5 Ensure all content actions emit audit log entries for traceability.

- [ ] 5.0 Backend Notifications Stub & Audit Logging
  - [ ] 5.1 Implement notification provider interface and default stub that logs payloads.
  - [ ] 5.2 Integrate notification triggers for key events (registration, verified account, new admin content) respecting user opt-in flags.
  - [ ] 5.3 Build audit log service/API endpoint for admins with pagination and filters.

- [ ] 6.0 Frontend Application Shell & Core Auth Flows
  - [ ] 6.1 Replace CRA scaffold with Vite + React 19 + TypeScript + Tailwind configuration.
  - [ ] 6.2 Configure routing, TanStack Query client, global styles, and basic layout/shell.
  - [ ] 6.3 Implement registration, email verification, login, logout, forgot/reset password pages wired to backend.
  - [ ] 6.4 Implement auth context/token refresh handling with Axios interceptors for HttpOnly cookie refresh process.

- [ ] 7.0 Frontend Profile Management & Settings
  - [ ] 7.1 Build profile view/edit forms with validation, avatar uploader, and API integration.
  - [ ] 7.2 Implement privacy level selector and notification preference toggles with optimistic UI updates.
  - [ ] 7.3 Ensure viewing other profiles respects privacy states; handle unauthorized/hidden cases gracefully.

- [ ] 8.0 Frontend Content Experience & Admin Dashboard
  - [ ] 8.1 Create content library page with filters, search, empty states, and pagination controls.
  - [ ] 8.2 Build content detail page with preview metadata, likes/comments UI, and download action.
  - [ ] 8.3 Build admin dashboard for content upload/edit/archive, including file validation and progress feedback.
  - [ ] 8.4 Implement admin audit log viewer with filter controls and pagination.

- [ ] 9.0 DevOps, Quality & Rollout Support
  - [ ] 9.1 Update Dockerfiles/docker-compose to support new build pipelines and persistent storage mounts.
  - [ ] 9.2 Configure linting/formatting (Ruff, Black, ESLint, Prettier) and add CI scripts or instructions.
  - [ ] 9.3 Document environment setup, `.env` variables, seed scripts, and deployment steps in README/docs.
  - [ ] 9.4 Add health check endpoint/tests, structured logging config, and placeholders for monitoring/metrics.
