# EduVault — Setup & Deployment Guide

This guide provides step-by-step instructions to configure **Google Cloud Console** and **Supabase** for the EduVault platform.

## 1. Google Cloud Console Setup
Google Cloud is used for **Google OAuth (Login with Google)**.

1.  **Create a New Project**:
    *   Go to [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project named `EduVault`.
2.  **Configure OAuth Consent Screen**:
    *   Navigate to **APIs & Services > OAuth consent screen**.
    *   Select **External** (if you want any user with a Gmail account to log in).
    *   Fill in required app information (App name, support email, etc.).
    *   In **Scopes**, ensure `openid`, `email`, and `profile` are added (should be default).
3.  **Create Credentials**:
    *   Navigate to **APIs & Services > Credentials**.
    *   Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
    *   Select **Web application** as the application type.
    *   **Name**: `EduVault Web`.
    *   **Authorized JavaScript origins**: `http://localhost:8080` (for development).
    *   **Authorized redirect URIs**: 
        *   `https://<YOUR_PROJECT_ID>.supabase.co/auth/v1/callback`
        *   (Get your Supabase URL first in the next section).
4.  **Save Client ID & Secret**:
    *   Copy the **Client ID** and **Client Secret**. You will need these for Supabase.

---

## 2. Supabase Setup
Supabase serves as the primary database and authentication provider.

1.  **Create a New Project**:
    *   Go to [Supabase Dashboard](https://supabase.com/dashboard/projects).
    *   Create a new project and select a region close to you.
2.  **Enable Google Auth**:
    *   Navigate to **Authentication > Providers**.
    *   Select **Google** and toggle it **ON**.
    *   Paste your **Google Client ID** and **Google Client Secret** saved from the Google Cloud Console.
    *   Copy the **Redirect URL** shown in the Supabase Google Auth settings and add it to your Google Cloud Console "Authorized redirect URIs".
3.  **Configure API Settings**:
    *   Navigate to **Project Settings > API**.
    *   Copy the **Project URL** (`VITE_SUPABASE_URL`).
    *   Copy the **Anon Key** (`VITE_SUPABASE_ANON_KEY`).
    *   Copy the **Service Role Key** (Used only in the `backend/.env`).
4.  **Database Initialization**:
    *   Run the provided SQL initialization scripts (found in your project's `supabase/` or `schema.sql` files) in the Supabase **SQL Editor**.

---

## 3. Local Environment Configuration

Update your local `.env` files with the credentials obtained above.

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Cloudflare R2 (Storage)
R2_ACCOUNT_ID=<your-id>
R2_ACCESS_KEY_ID=<your-key>
R2_SECRET_ACCESS_KEY=<your-secret>
R2_BUCKET_NAME=eduvault-materials

# Auth
JWT_SECRET=<random-long-string>

# Platform
FRONTEND_URL=http://localhost:8080
PORT=3001
```

---

## 4. Final Verification
1.  **Restart development servers**:
    *   Frontend: `npm run dev`
    *   Backend: `npm run start` (or `node server.js`)
2.  **Test Login**:
    *   Open `http://localhost:8080/login`.
    *   Attempt "Login with Google".
    *   Verify your user appears in the Supabase **Authentication** table.
