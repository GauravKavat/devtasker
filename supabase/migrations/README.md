# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended for Quick Changes)

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy the contents of the migration file you want to run
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link your project (first time only)
supabase link --project-ref your-project-ref

# Run a specific migration
supabase db push
```

## Available Migrations

### `add_project_dates.sql`

Adds start date and deadline fields to the projects table:
- `start_date` (DATE, optional): Project start date, defaults to current date if not provided
- `deadline` (DATE, required): Project deadline/tentative completion date

**To apply this migration:**
1. Open the file `add_project_dates.sql`
2. Copy its contents
3. Run it in the Supabase SQL Editor

**Note:** Existing projects will have their `start_date` set to their `created_at` date automatically.

## Important Notes

- Always backup your database before running migrations in production
- Test migrations in a development environment first
- Migrations should be run in the order they were created
- Each migration file should be idempotent (safe to run multiple times)