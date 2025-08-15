# Supabase Migrations

This directory contains the database migrations for the Pagent Credits application.

## Current Migrations

### `20250815000001_waitlist_schema.sql`
- **Purpose**: Waitlist feature for user email collection
- **Tables**: `waitlist`
- **Features**: 
  - Email collection with deduplication
  - RLS policies for anon user access
  - Proper schema permissions
  - Trigger for updated_at timestamp

## Archived Migrations

The `archive/` directory contains older migrations that have been consolidated or superseded:

- Legacy schema migrations with mixed languages
- Fragmented permission fixes
- Development iterations

## Migration Guidelines

1. **One feature per migration**: Each migration should handle a single feature or change
2. **English only**: All comments and documentation in English
3. **Idempotent**: Use `IF NOT EXISTS` and `DO $$` blocks to handle re-runs
4. **Descriptive names**: Use clear, descriptive migration names with timestamps

## Database Schema

Current tables managed by these migrations:
- `waitlist`: User email collection for launch notifications
