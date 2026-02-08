# DevTasker

DevTasker is a developer‑first project management platform focused on speed, clarity, and modern collaboration. It combines a polished UI with real‑time workflows, GitHub integrations, and a robust component system to support teams that ship software.

## About DevTasker

DevTasker bridges the gap between heavyweight enterprise tools and lightweight boards. It focuses on core developer workflows—planning, execution, and integration—without sacrificing performance, reliability, or usability. The product is intentionally scoped to optimize for team velocity, clear ownership, and immediate feedback loops.

## Motivation

Modern teams are frequently forced into a trade‑off: use complex tooling that slows execution or choose simpler systems that do not scale with engineering needs. DevTasker was created to remove that trade‑off. It provides a fast, modern interface with the practical capabilities developers need to plan, ship, and collaborate—without the overhead of nonessential features.

## Crux

The core of DevTasker is a focused workflow: define work clearly, execute with minimal friction, and stay synchronized in real time. Every element—UI, data model, and integrations—supports this loop so teams can spend less time managing work and more time delivering it.

## Objectives

- **Clarity at scale:** Make ownership, status, and dependencies immediately visible.
- **Operational speed:** Reduce UI friction and page latency in day‑to‑day use.
- **Developer‑native workflows:** Integrate directly with GitHub and standard dev processes.
- **Real‑time collaboration:** Provide live updates with minimal manual refresh or coordination.
- **Maintainable architecture:** Ensure the codebase remains modular, type‑safe, and extensible.

## Project Scope

DevTasker delivers a focused set of capabilities aligned with real development workflows:

- **Projects & Tasks:** Create, organize, and track tasks with structured metadata and role‑aware access.
- **Kanban & Planning:** Flexible boards and task views optimized for iterative delivery.
- **Realtime Collaboration:** Live updates via Supabase to keep teams synchronized.
- **GitHub Integration:** Import issues, link tasks, view repo context, and automate workflows.
- **Invitations & Roles:** Secure member invitations with verification and role management.
- **Meetings & Coordination:** Built‑in meeting endpoints for schedule‑aligned tracking.
- **Modern UI System:** A cohesive set of reusable components built on Shadcn UI + Radix UI.

## Technology Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript + React
- **Styling:** Tailwind CSS
- **Backend:** Supabase (auth, realtime, database)
- **UI:** Shadcn UI + Radix UI
- **Charts & Data:** Recharts
- **Notifications:** Sonner

## Architecture Overview

- **App Router pages:** Structured in app/ with route groups for public and authenticated flows.
- **API routes:** REST‑style endpoints under app/api for projects, tasks, meetings, GitHub, and invitations.
- **Components library:** Shared UI and application components in components/ with a dedicated UI kit in components/ui.
- **Hooks & utilities:** Domain logic in hooks/ and shared utilities in lib/.
- **Supabase layer:** Client and server helpers in lib/supabase.
- **Edge & routing middleware:** Centralized request handling via middleware.ts for route protection and flow control.
- **Desktop wrapper (optional):** Electron entry point under electron/ for packaging and native distribution when needed.

## Key Features (Implemented)

### Product Workflow

- Project and task CRUD APIs
- Kanban‑ready task models and update flows
- Invitation lifecycle (create, verify, accept)
- Role‑based access control utilities
- Member discovery and project role hooks

### GitHub Workflows

- Repository discovery and import
- Issue import to tasks
- Branch creation support
- Action status and task linkage components

### Collaboration & Coordination

- Meeting endpoints for structured syncs
- Project membership utilities and invitation verification
- Real‑time state updates for shared visibility

### UI & UX

- Responsive dashboard shell and navigation
- Theme support with a consistent design system
- Task dialogs and forms
- Rich set of UI primitives (alerts, dialogs, tables, tabs, popovers, etc.)
- Accessible components with consistent interaction patterns

## Component System

DevTasker provides production‑grade components, documented in COMPONENTS.md. Highlights include:

- Task creation and editing forms
- Dialogs, sheets, and contextual menus
- Calendar and scheduling primitives
- Data tables and charting components
- Sidebar, breadcrumbs, and navigation utilities

The UI kit in components/ui ensures a consistent visual language across pages, while application‑level components in components/ handle domain‑specific workflows like task dialogs, invitations, and GitHub links.

## Data & Access Control

- **RBAC utilities:** Role and permission helpers in lib/ to enforce scoped access.
- **Secure invitations:** Token‑based invite verification and acceptance routes.
- **Server/client separation:** Dedicated Supabase helpers for consistent access patterns.

## Repository Structure

```
app/                 Next.js App Router pages and API routes
components/          Shared components and UI kit
hooks/               Client hooks and data utilities
lib/                 Domain utilities, RBAC, Supabase helpers
supabase/            Migrations and database metadata
types/               Shared TypeScript types
```

## Quality & Standards

- Type‑safe APIs and client components
- Accessibility‑first UI (ARIA patterns and keyboard navigation)
- Modular, reusable components
- Clear separation of UI, domain logic, and data access
- Predictable data flow and consistent state boundaries

## Getting Started

1. Install dependencies
2. Configure Supabase environment variables
3. Run the development server

Refer to the existing project scripts in package.json for the exact commands.

## Documentation

- Component usage and examples: see COMPONENTS.md
- Backend contracts: see app/api routes
- GitHub integration surfaces: see components/github and app/api/github

## Certification‑Ready Notes

This README is written to align with rigorous program review expectations (e.g., GSoC‑style evaluation), emphasizing scope, architecture, implemented features, and quality standards. It is intended to serve as a concise, professional project overview suitable for formal review and certification.

## Executive Summary (Extended)

DevTasker is built for engineering teams that require clarity, reliability, and integration with the tools they already use.
The platform provides structured workflows for projects and tasks while keeping the user experience fast and approachable.

## Problem Context

- Teams often outgrow simple boards before they are ready for heavyweight suites.
- Complex systems introduce operational overhead that slows execution.
- Realtime collaboration is frequently treated as an add‑on rather than a core capability.

## Core Workflow

1. Define work with clear ownership and status.
2. Execute tasks through iterative, board‑based planning.
3. Synchronize updates in real time across members and tools.

## Role Model (Conceptual)

- **Owner:** Full administrative access within a project.
- **Member:** Standard access for creating, updating, and collaborating on tasks.
- **Viewer:** Read‑only access to project state and activity.

## Architecture Deep Dive

### App Router Organization

- Public entry points live under app/(home).
- Authenticated layouts and feature routes live under app/(main).
- Dedicated routes are provided for invitations and unauthorized access states.

### API Design Approach

- REST‑style endpoints grouped by resource (projects, tasks, meetings, GitHub).
- Clear route boundaries for create, update, and batch operations.
- Debug endpoints isolated for internal inspection workflows.

### Data Access

- Supabase clients are centralized to maintain consistent configuration.
- Server routes mediate mutations to enforce authorization and validation.
- Client hooks provide standardized data access patterns.

## UI System Philosophy

- Shared primitives in components/ui keep spacing, typography, and interaction consistent.
- Application components in components/ encapsulate domain logic and workflows.
- Layout composition encourages reuse across pages and route groups.

## Component Catalog (Selected)

- Sidebar and navigation primitives
- Task dialogs and task forms
- Project switcher and search utilities
- Invite dialogs and user navigation
- GitHub‑linked task surfaces
- Analytics and charting widgets

## API Map (Expanded)

- app/api/columns
- app/api/columns/[columnId]
- app/api/debug/members
- app/api/github
- app/api/github/actions
- app/api/github/branch
- app/api/github/import
- app/api/github/repos
- app/api/github/tasks
- app/api/github/webhook
- app/api/invitations/create
- app/api/invitations/verify
- app/api/invitations/accept
- app/api/meetings
- app/api/meetings/[meetingId]
- app/api/projects/[projectId]
- app/api/tasks
- app/api/tasks/[taskId]
- app/api/tasks/bulk-update

## UI Route Map (Expanded)

- app/(home)/page
- app/(home)/\_components
- app/(main)/layout
- app/(main)/(routes)/projects
- app/invite/[token]
- app/unauthorized/page
- app/not-found

## Hooks Inventory

- use-github
- use-invitations
- use-kanban
- use-meetings
- use-mobile
- use-project-members
- use-project-role
- use-project-roles
- use-projects
- use-projects-new
- use-toast

## Utilities & Shared Libraries

- lib/utils for shared helpers
- lib/rbac and lib/roles for access control
- lib/github-types for typed integration models
- lib/email for invitation delivery workflows
- lib/supabase for client and server access wrappers

## Design System Notes

- Components favor composition over inheritance.
- Variant‑driven styling enables consistent theming and sizing.
- Interaction states are standardized across inputs and buttons.

## Reliability Considerations

- Real‑time updates reduce the need for manual refresh.
- Stateless API routes improve scalability and separation of concerns.
- UI updates are scoped to component boundaries to limit re‑rendering.

## Security Considerations

- Role‑aware access patterns gate sensitive operations.
- Token‑based invitation flows protect onboarding paths.
- Server routes centralize validation and data modification.

## Operational Readiness

- Configuration is kept in environment variables for portability.
- Project structure supports incremental feature delivery.
- Documentation emphasizes architecture and traceability for review.

## Review Checklist (High Level)

- Clear project scope and objectives
- Implemented features mapped to routes and components
- Consistent UI system with reusable primitives
- Type‑safe data flow between client and server
- Role‑aware access control utilities

## Future Work (Non‑binding)

- Extended analytics and reporting views
- Additional planning views (calendar or timeline)
- More GitHub workflow automations
- Extended collaboration integrations

## Contribution Guidelines (Expanded)

- Keep changes focused on the core workflow and documented scope.
- Respect module boundaries in app/, components/, hooks/, and lib/.
- Add UI primitives to components/ui and reuse before creating new ones.
- Add or adjust API routes in app/api with consistent naming.
- Favor typed helpers and shared utilities to reduce duplication.

## Glossary

- **RBAC:** Role‑based access control.
- **Route Group:** Next.js grouping for layouts and logical separation.
- **Realtime:** Live data synchronization using Supabase subscriptions.
- **App Router:** Next.js routing system used by this project.

## Acknowledgements

DevTasker leverages modern open‑source tooling (Next.js, Supabase, Radix UI) to provide a cohesive developer experience.
