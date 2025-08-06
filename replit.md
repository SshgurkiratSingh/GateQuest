# Overview

A GATE ECE (Graduate Aptitude Test in Engineering - Electronics and Communication Engineering) study tracking application built with React and Express. The application helps students track their daily progress, monitor performance across different subjects, and maintain study streaks while preparing for the GATE exam. It features a comprehensive dashboard with analytics, progress tracking, and subject-wise performance monitoring.

# User Preferences

- Preferred communication style: Simple, everyday language.
- Data storage: JSON files instead of database
- Recent Changes: Converted from PostgreSQL to JSON file storage for simplified deployment and data management

# System Architecture

## Frontend Architecture
- **React** with TypeScript for the client-side application
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for server state management and API data fetching
- **React Hook Form** with Zod validation for form handling
- **Shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling with custom design tokens
- **Recharts** for data visualization and analytics charts

## Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design pattern for client-server communication
- **Drizzle ORM** for database operations with type-safe queries
- **Zod** schemas for API request/response validation
- **Session-based** request logging middleware
- **Storage abstraction layer** for database operations

## Database Design
- **JSON file storage** for simplified data persistence
- **Local file-based storage** with automatic directory creation
- **Data files** for:
  - subjects.json - GATE ECE curriculum subjects with topics
  - question-attempts.json - Study session tracking
  - daily-progress.json - Daily targets and streak tracking  
  - user-settings.json - User preferences and reminders
  - users.json - User authentication data

## Key Design Patterns
- **Repository Pattern**: Storage abstraction layer isolates database logic
- **API Layer**: Centralized request handling with consistent error responses
- **Component Composition**: Reusable UI components with consistent styling
- **Type Safety**: End-to-end TypeScript with shared schemas
- **Form Validation**: Zod schemas shared between client and server
- **State Management**: Server state via TanStack Query, local state via React hooks

## Build and Development
- **Monorepo structure** with shared schemas between client and server
- **Development mode**: Vite dev server with HMR and Express API
- **Production build**: Static client build served by Express
- **Path aliases** for clean imports (@/, @shared/, @assets/)
- **ESBuild** for server-side bundling in production

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: @neondatabase/serverless with WebSocket support

## UI Framework
- **Radix UI**: Headless component primitives for accessibility
- **Shadcn/ui**: Pre-built component library with consistent design
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **ESLint/Prettier**: Code formatting and linting (implied)

## Data Visualization
- **Recharts**: React charting library for analytics dashboards
- **Date-fns**: Date manipulation and formatting utilities

## Form Handling
- **React Hook Form**: Performant form library with minimal re-renders
- **Hookform Resolvers**: Zod integration for form validation

## Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Express sessions**: Server-side session management

## Replit Integration
- **Replit-specific plugins**: Development environment integration
- **Cartographer**: Replit development tooling (development only)