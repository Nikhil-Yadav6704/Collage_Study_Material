# EduVault Supabase Database Setup

This directory contains the database schema, RLS policies, and functions for the EduVault project, organized as Supabase migrations.

## Execution Options

### Option 1: Supabase SQL Editor (Recommended for Cloud)
If you are using the Supabase Cloud Dashboard, run the contents of the files in the `migrations/` directory in the following order:

1. `20260403044549_extensions.sql`
2. `20260403044607_enums.sql`
3. `20260403044608_core_tables.sql`
4. `20260403044609_content_tables.sql`
5. `20260403044610_workflow_tables.sql`
6. `20260403044611_system_tables.sql`
7. `20260403044612_triggers_functions.sql`
8. `20260403044614_rls_policies.sql`
9. `20260403044615_analytics_views.sql`

### Option 2: Supabase CLI (Local Development)
If you have a local Supabase instance running:
```bash
npx supabase migration up
```

## Storage Configuration (Manual Step)

Register these buckets in your Supabase Dashboard > Storage:

1. **materials**
   - Public: `false`
   - Max file size: `50MB`
2. **request-temp**
   - Public: `false`
   - Max file size: `50MB`

## Environment Variables

Create a `.env` file in your **backend** directory (Prompt 2) with the following:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT (for roll number sessions)
JWT_SECRET=your-very-long-random-string-here
JWT_EXPIRES_IN=7d

# App
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3001
```
