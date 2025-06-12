/**
 * Database schemas organized by domain
 *
 * This file combines all domain schemas for Drizzle ORM.
 * Each domain (auth, applications, etc.) has its own schema file.
 */

// Auth domain (current - Phase 1)
export * from "./auth";

// Future domains will be added here as we implement features:
// export * from './applications';  // Phase 2: Application tracking
// export * from './documents';     // Phase 2: Document management
// export * from './emails';        // Phase 3: Gmail integration
// export * from './notifications'; // Phase 4: Notification system

/**
 * Note: This approach allows us to:
 * 1. Keep schemas organized by feature domain
 * 2. Add new schemas incrementally as we build features
 * 3. Maintain clean separation of concerns
 * 4. Easy to find and modify domain-specific tables
 */
