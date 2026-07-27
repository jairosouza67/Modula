# AI Development Rules - Firefiit

## Tech Stack Overview

- **Web**: React + Vite + TypeScript (Web-first, sem React Native no MVP)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) as BaaS
- **State Management**: Zustand for client state + TanStack React Query v5 for server state
- **Styling**: TailwindCSS v4 (tema dark RPG em `src/global.css`)
- **Navigation**: React Router DOM v6 (file-based routing com `src/router.tsx`)
- **Forms**: React Hook Form with Zod for validation and type-safe forms
- **Notifications**: Sonner for toast notifications (RPG-themed)
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for progression visualization (bar charts, XP por semana)
- **Payments**: N/A no MVP — pós-MVP
- **Offline**: N/A — Web-first, assumes conexão disponível (sem expo-sqlite)
- **Animations**: Framer Motion for RPG-style animations and transitions
- **Cache**: N/A no MVP — pós-MVP com Upstash Redis
- **Monitoring**: Sentry for error tracking (pós-MVP)
- **CI/CD**: GitHub Actions + Vercel Deploy
- **Idioma**: 100% Português do Brasil (pt-br) — todos os textos, labels e mensagens

## Library Usage Rules

### Database & Storage
- **ALWAYS** use Supabase PostgreSQL for all database operations
- **ALWAYS** use Supabase Storage for file uploads (avatars, guild banners, item assets)
- **ALWAYS** follow the database schema defined in Supabase migrations
- **ALWAYS** handle Supabase errors gracefully with user-friendly RPG-themed messages
- **ALWAYS** use Row Level Security (RLS) policies on every table - no exceptions
- **ALWAYS** use `supabase gen types typescript` to generate and keep types in sync
- **ALWAYS** use Supabase RPCs for complex operations instead of multiple client queries
- **ALWAYS** use Edge Functions for business logic that requires server-side validation

### State Management
- **ALWAYS** use Zustand for client-side global state (UI state, user preferences, offline queue)
- **ALWAYS** use TanStack React Query for server state (workouts, avatar, rankings)
- **NEVER** use Redux or Context API for new features
- **ALWAYS** keep stores focused and single-purpose
- **ALWAYS** use TypeScript interfaces for store types
- **NEVER** duplicate server state in Zustand - let React Query handle caching

### UI Components & Styling
- **ALWAYS** use TailwindCSS v4 className for styling
- **NEVER** write inline styles for new components
- **ALWAYS** use the custom color palette defined in `src/global.css` / `tailwind.config.ts`
- **ALWAYS** maintain dark theme consistency (RPG/gaming aesthetic)
- **ALWAYS** ensure touch targets are minimum 44px for mobile browser compatibility
- **ALWAYS** use Framer Motion for animations and transitions
- **ALWAYS** use loading skeletons while data is being fetched
- **NEVER** use native `<img>` without lazy loading — always use `loading="lazy"`

### Forms & Validation
- **ALWAYS** use React Hook Form for form management
- **ALWAYS** use Zod schemas for validation (shared between client and Edge Functions)
- **NEVER** handle form state manually with useState
- **ALWAYS** provide clear error messages and loading states
- **ALWAYS** validate workout data against anti-fraud rules before submission

### Authentication & Security
- **ALWAYS** use Supabase Auth for all authentication operations (pós-MVP)
- **MVP**: Use a fixed `user_id` from `localStorage` for testing — sem auth no MVP
- **ALWAYS** implement proper error handling for auth flows
- **ALWAYS** use the anon key in client code, service role key ONLY in Edge Functions
- **NEVER** hardcode API keys - use environment variables (`.env`)
- **NEVER** log tokens, passwords, or PII

### API & Edge Functions
- **ALWAYS** use `supabase-js` client for direct database queries
- **ALWAYS** use Supabase Edge Functions for business logic (XP calculation, boss attacks)
- **ALWAYS** validate all inputs with Zod in Edge Functions
- **NEVER** expose service role key to the client
- **ALWAYS** implement proper error boundaries for API calls
- **ALWAYS** use Supabase Realtime for live features (boss HP, rankings) — pós-MVP
- **Edge Functions naming**: use pt-br (e.g., `calcular-xp`, `atacar-boss`, `rotacionar-boss`)

### File Structure & Organization
- **ALWAYS** place pages in `src/pages/` following React Router routes
- **ALWAYS** place reusable components in `src/components/ui/` (primitives) or `src/components/features/` (complex)
- **ALWAYS** place custom hooks in `src/hooks/`
- **ALWAYS** place Zustand stores in `src/store/`
- **ALWAYS** place Supabase client and utilities in `src/lib/`
- **ALWAYS** place shared types in `src/types/`
- **ALWAYS** place Edge Functions in `supabase/functions/`
- **ALWAYS** place SQL migrations in `supabase/migrations/`
- **NEVER** create components larger than 100 lines - refactor into smaller components
- **ALWAYS** use descriptive file names with PascalCase for components, camelCase for utilities

### Code Quality & Best Practices
- **ALWAYS** use TypeScript strict mode for all new files
- **ALWAYS** handle errors with try/catch blocks (unless specifically told not to)
- **ALWAYS** provide loading states for all async operations
- **ALWAYS** provide error states with retry option on all screens
- **ALWAYS** provide empty states with call-to-action
- **ALWAYS** implement proper accessibility (ARIA labels, screen reader support)
- **NEVER** leave TODO comments or placeholder implementations
- **ALWAYS** write complete, functional features - no partial implementations
- **NEVER** leave `console.log` in production code
- **ALWAYS** use 100% pt-br for all user-facing text, labels, and messages

### Performance & Optimization
- **ALWAYS** use React.memo for expensive components
- **ALWAYS** implement proper lazy loading for routes (`React.lazy` + `Suspense`)
- **ALWAYS** optimize images with `loading="lazy"` and proper sizing
- **NEVER** create unnecessary re-renders - profile with React DevTools
- **ALWAYS** animate only GPU-accelerated properties (transform, opacity) via Framer Motion
- **NEVER** animate width, height, margin, or padding

### Offline Support
- **NOT a priority for MVP** — Web-first app assumes stable connection
- **ALWAYS** show clear error state if network request fails
- **ALWAYS** handle sync conflicts gracefully (server wins for anti-fraud)

### Game Design & Content
- **ALWAYS** maintain the RPG/MMO fitness narrative tone in pt-br
- **ALWAYS** use motivational, RPG-adapted language (not generic coach speak)
- **ALWAYS** ensure anti-fraud mechanisms are fair and transparent
- **ALWAYS** balance XP and rewards to prevent pay-to-win
- **ALWAYS** cap premium XP boosts at 15% maximum (pós-MVP)
- **NEVER** allow cosmetic items to affect gameplay stats
- **ALWAYS** make the avatar feel like a reflection of the user's real effort

## Development Workflow

1. **Before coding**: Check if the feature already exists and read relevant AG Kit skills
2. **Before any screen**: Check the Etapa checklist in `docs/plano-execucao-final.md`
3. **During coding**: Follow all library usage rules above
4. **After coding**: Ensure TypeScript compilation, accessibility, and error handling
5. **Testing**: Test all user flows, edge cases, and error scenarios in the browser
6. **Documentation**: Update `docs/progress-checklist.md` and mark Etapa checkpoints

## AG Kit Skills to Load Per Context

| Context | Load Skill |
|---------|-----------|
| Any web screen | `mobile-design` (ALWAYS read mobile-design-thinking.md first) |
| Database changes | `database-design` |
| Edge Function APIs | `api-patterns` |
| Game mechanics (XP, bosses, PvP) | `game-development` |
| Architecture decisions | `architecture` |
| Writing tests | `testing-patterns` |
| Security review | `vulnerability-scanner` |
| Code review | `code-review-checklist`, `clean-code` |
| Project scaffolding | `app-builder/react-native-app` |

## Prohibited Patterns

- ❌ Using AsyncStorage or localStorage for sensitive data
- ❌ Inline styles for new components (use TailwindCSS classes)
- ❌ Manual form state management with useState
- ❌ Partial implementations or TODO comments
- ❌ Components larger than 100 lines without refactoring
- ❌ Ignoring TypeScript errors
- ❌ Skipping error handling or loading states
- ❌ Breaking the dark RPG theme consistency
- ❌ Exposing service role key to client code
- ❌ Tables without Row Level Security policies
- ❌ console.log in production builds
- ❌ Animating non-GPU properties (width, height, margin)
- ❌ Touch targets smaller than 44px
- ❌ English text in user-facing UI (100% pt-br required)
- ❌ Auth in the MVP — use fixed `user_id` from localStorage

## Required Patterns

- ✅ Supabase for all data operations with RLS
- ✅ Zustand for client state, React Query for server state
- ✅ TailwindCSS v4 for all styling
- ✅ React Hook Form + Zod for forms
- ✅ TypeScript interfaces for all data structures
- ✅ Error boundaries and graceful error handling
- ✅ Loading, error, and empty states on every screen
- ✅ Edge Functions for business logic validation (calcular-xp, atacar-boss)
- ✅ RPG-themed UX copy and notifications (pt-br)
- ✅ Framer Motion for all animations and transitions
- ✅ Recharts for XP/progression charts
- ✅ Sonner for toast notifications
- ✅ React Router DOM v6 for navigation
- ✅ Vercel for deployment
- ✅ Checkpoint validation before advancing to next Etapa
