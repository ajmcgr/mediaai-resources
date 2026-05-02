# Phase 1 — Auth Setup

Run these SQL files **in your existing Supabase SQL Editor** in order.
They are **idempotent** (safe to re-run).

## How to run

1. Go to https://supabase.com/dashboard/project/uavbphkhomblzkjfuaot/sql/new
2. Open the file below, paste contents, click **Run**.

## Files

- `phase1_auth.sql` — profiles table, user_roles table, RLS policies, signup trigger, has_role() function

## Auth provider config (Supabase dashboard)

1. **Auth → URL Configuration**
   - **Site URL**: `https://trymedia.ai`
   - **Redirect URLs** (add all): `https://trymedia.ai/**`, `https://resources.trymedia.ai/**`, `https://mediaai-resources.lovable.app/**`, `https://id-preview--546fe1b4-503d-4d75-a5e6-a57570fb4403.lovable.app/**`, `http://localhost:5173/**`
2. **Auth → Providers → Email**: Enable. Toggle **"Confirm email"** OFF for fastest dev/testing (turn back on for production).
3. **Auth → Providers → Google**: Enable, paste your Google OAuth Client ID + Secret. Add `https://uavbphkhomblzkjfuaot.supabase.co/auth/v1/callback` to authorized redirect URIs in Google Cloud Console.
4. **Auth → Policies → Email**: Enable **"Leaked password protection (HIBP)"** for production.

## Reply with what's already in your DB

If a `profiles` table already exists with different columns, paste the columns here and I'll adjust the migration before you run it.
