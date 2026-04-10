# EduVault — Manual Admin Account Creation

Since the platform uses Supabase for authentication and includes a custom `public.users` table for role management, you can manually promote any user to an **Admin** role directly through the Supabase Dashboard.

## Method 1: Promote an Existing User (Recommended)
The easiest way is to sign up as a regular student first, then promote that account to Admin.

1.  **Sign Up**: Go to your local EduVault app and sign up as a new student.
2.  **Find User ID**:
    *   Go to your [Supabase Dashboard](https://supabase.com/dashboard/projects).
    *   Navigate to **Authentication > Users**.
    *   Copy the **User UID** of your newly created account.
3.  **Promote to Admin**:
    *   Navigate to **SQL Editor** in the Supabase sidebar.
    *   Run the following query (replace `<user-id>` with the UID you copied):
      ```sql
      UPDATE public.users 
      SET role = 'admin' 
      WHERE id = '<user-id>';
      ```
4.  **Login**: Refresh your app and log in. You will now have access to all administrative modules.

---

## Method 2: Direct SQL Insertion (For New Accounts)
If you haven't signed up yet, you can use this SQL to prepare an admin record. Note that you still need a corresponding entry in the `auth.users` table (created via sign-up).

```sql
-- Replace with the actual UUID from auth.users
INSERT INTO public.users (
  id, 
  full_name, 
  email, 
  role, 
  roll_number, 
  department_id, 
  year, 
  status
) VALUES (
  'your-uuid-here', 
  'System Administrator', 
  'admin@eduvault.edu', 
  'admin', 
  'ADMIN-001', 
  'your-department-uuid', -- Optional: link to a real department ID
  4, 
  'active'
);
```

## Troubleshooting
*   **Permissions**: Ensure your RLS (Row Level Security) policies allow the `admin` role to view and manage data. Most administrative pages verify this role before rendering.
*   **Session Refresh**: If you are already logged in when you run the SQL update, you may need to **Log Out** and **Log In** again for the new role to be reflected in your session.

> [!IMPORTANT]
> **Super Admin Security**: Admin accounts have full delete and modify permissions. Never share admin credentials and ensure your `JWT_SECRET` is rotated if you suspect any compromise.
