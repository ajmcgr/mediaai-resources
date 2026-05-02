# Phase 3 deployment checklist (Stripe BYOK)

This project uses an external Supabase (uavbphkhomblzkjfuaot), not Lovable Cloud,
so SQL + edge functions must be deployed by you.

## 1. Run the SQL migration
In Supabase Dashboard → SQL Editor, run:
- `docs/migration/phase3_subscriptions.sql`

Verify:
```sql
select count(*) from public.subscriptions;       -- 0
select public.current_user_has_active_plan();    -- false (when signed out)
```

## 2. Add edge function secrets
Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Name                        | Value                                                      |
|-----------------------------|------------------------------------------------------------|
| `STRIPE_SECRET_KEY`         | `sk_live_...` (your live BYOK secret key)                  |
| `STRIPE_WEBHOOK_SECRET`     | `whsec_...` (filled in step 4 after creating the endpoint) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role JWT (Project Settings → API)                  |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are auto-injected.

## 3. Deploy the functions (Supabase CLI)
```bash
supabase link --project-ref uavbphkhomblzkjfuaot
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 4. Create the Stripe webhook endpoint
Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://uavbphkhomblzkjfuaot.functions.supabase.co/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`

Copy the signing secret (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET`,
then redeploy `stripe-webhook`.

## 5. Verify end-to-end
1. Sign in to the app.
2. Click a "Subscribe" button → Stripe Checkout opens with the live price.
3. Complete payment with a real card (or use Stripe test mode price IDs first).
4. Check `public.subscriptions` — a row should appear with `status = 'active'`.
5. Check `public.profiles.sub_active` for that user — should flip to `true`.
6. Click "Manage Billing" → Stripe portal opens.
