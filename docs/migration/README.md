# Bubble → Supabase migration

## Files
- `phase2_bubble_schema.sql` — adds `plans`, `legacy_bubble_users`, extends `profiles`, updates `handle_new_user()` trigger.
- `bubble_seed.sql` — INSERTs 3 plans + 214 legacy Bubble user rows. Generated from the JSON exports below.
- `export_All-*.json` — raw Bubble exports (for reference / re-generation).

## Run order (Supabase SQL Editor)
1. `docs/supabase/phase1_auth.sql` (already noted in main README)
2. `docs/migration/phase2_bubble_schema.sql`
3. `docs/migration/bubble_seed.sql`

Re-runs are safe: schema uses `IF NOT EXISTS`, seed uses `ON CONFLICT DO UPDATE`.

## How the auto-claim works
When a returning Bubble user signs up here with the same email:
- The `handle_new_user()` trigger finds them in `legacy_bubble_users`.
- Their `stripe_customer_id`, plan, sub status, period end, and company are copied onto their new `profiles` row.
- `migrated_from_bubble = true` is set so you can filter them in the dashboard.
- Their legacy row is marked `claimed_by` + `claimed_at`.

## Caveat: plan mapping
The Bubble Users export does NOT include each user's plan identifier — only a `billing` FK to a Billings row that doesn't carry plan info either. So:
- If `sub_active = true` we provisionally assign **`both` (Media Pro)** as a safe default.
- Active subscribers (~23) should be manually verified against Stripe and corrected:
  ```sql
  update public.profiles set plan_identifier = 'creator'
   where stripe_customer_id = 'cus_XXXX';
  ```
- Once Stripe webhooks are wired (Phase 3), the `customer.subscription.updated` event will overwrite this with the real plan from the price ID.

## Passwords
Bubble password hashes are not exportable. Returning users must use **"Forgot password"** on first login. Consider sending a one-time announcement email with the reset link.
