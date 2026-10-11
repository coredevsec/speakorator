# Flutterwave Payments Setup

Orator uses Flutterwave-hosted checkout for recurring memberships. The browser sends only a plan name and the signed-in Supabase access token. The server validates the account, selects a configured Flutterwave plan ID, creates the checkout, and grants Premium only after receiving a Flutterwave webhook and verifying the transaction with Flutterwave's API.

## 1. Prepare Flutterwave

1. Create and verify your Flutterwave merchant account. Complete any business verification required to accept payments.
2. Confirm that your account can charge in **USD** and supports recurring card payments in your target countries. Availability depends on account/country and Flutterwave approval.
3. In the Flutterwave Dashboard, create a payment plan for each membership:
   - Weekly: USD 2.99, interval weekly.
   - Monthly: USD 5.99, interval monthly.
   - Yearly: USD 71.88, interval yearly.
4. Do not configure a free trial unless you separately confirm that your Flutterwave account and plan configuration support it. Orator currently advertises recurring billing without a trial.
5. Record each numeric payment plan ID. Do not use an amount or plan ID sent by the browser as the billing authority; Orator maps the selected plan to the server-configured ID and checks the verified charge amount.

## 2. Configure local environment

Keep your existing Supabase browser values (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). Add the Flutterwave and server-only Supabase values to your ignored `.env`, using `.env.example` as the template:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
FLW_SECRET_KEY=FLWSECK_TEST-your-test-secret-key
FLW_SECRET_HASH=the-webhook-secret-hash-you-configure-in-flutterwave
FLW_REDIRECT_URL=http://localhost:5173/billing
FLW_WEEKLY_PLAN_ID=12345
FLW_MONTHLY_PLAN_ID=23456
FLW_YEARLY_PLAN_ID=34567
```

Replace the sample plan IDs and credentials. Never prefix these secrets with `VITE_`, commit `.env`, or expose the Supabase service-role key or Flutterwave secret key in browser code. Remove obsolete payment-provider variables from your local `.env`; only the Flutterwave server variables are used now. Restart the dev server after changing environment values.

The local `.env.example` uses placeholders, not real credentials. The server handlers read server variables through the runtime's `process.env` interface. In the deployed Worker, configure the same names as server-side secrets/variables and verify the runtime exposes them there; if a handler reports that payment is not configured, the Worker bindings have not reached the server runtime.

## 3. Apply the Supabase migration

For an existing installation:

1. Back up the database.
2. Open Supabase SQL Editor.
3. Run the full `supabase/migrations/20261007_flutterwave_payments.sql` script, not only the index statement at its end.
4. Verify `public.subscriptions` has the generic `payment_provider`, `payment_subscription_id`, `payment_transaction_id`, `payment_plan_id`, and `plan_key` columns.
5. Verify `public.payment_attempts` exists with RLS enabled and no client grants.
6. Confirm `public.subscriptions` is enabled in the `supabase_realtime` publication. The setup SQL adds it when that publication exists. Realtime lets the practice page update Premium access immediately after webhook delivery or a subscription status change; the page also refreshes membership when it regains focus.

For a brand-new Supabase project, run the current `supabase/schema.sql` instead. If you already ran an older version of `schema.sql` and got a missing `payment_customer_id` column error, rerun the current full schema first. It now adds missing columns before creating indexes. Then run the migration to copy existing payment identifiers and remove legacy columns. Do not run the migration against a brand-new table that has never had the old provider columns.

## 4. Register the webhook

A webhook must be reachable over public HTTPS. For local testing, run a secure tunnel to your Vite port and use the tunnel URL; Flutterwave cannot send events to `localhost` directly.

1. In the Flutterwave Dashboard, open the webhook settings for your account.
2. Set the webhook URL to `https://YOUR_PUBLIC_HOST/api/flutterwave-webhook`.
3. Enable successful charge notifications (`charge.completed`). If available for your account, also enable subscription cancellation notifications (`subscription.cancelled`).
4. Set a long random webhook secret hash in the Dashboard and copy that exact value into `FLW_SECRET_HASH`.
5. The webhook verifies the `verif-hash` header before reading payment information. It then calls Flutterwave's transaction verification endpoint and checks the transaction reference, successful status, USD currency, and exact plan amount before updating Supabase.

Do not use a Flutterwave API secret as the webhook secret hash. Keep these two values separate.

## 5. Test in Flutterwave test mode

1. Use the Dashboard's test/sandbox secret key and test payment plan IDs locally.
2. Sign in to Orator and open `/billing`.
3. Start each plan and finish Flutterwave checkout using the test payment details provided in the Flutterwave dashboard/docs for your account.
4. Confirm the browser returns to the configured billing URL.
5. In Supabase, check that a pending row was created in `payment_attempts` before checkout, and that a successful verified webhook creates or updates the signed-in user's row in `subscriptions` with `payment_provider = flutterwave`, the expected `plan_key`, and `status = active`.
6. Verify Premium access unlocks only after the webhook updates the subscription. A return from checkout by itself must not grant access.
7. Use Flutterwave's webhook delivery tools to resend a notification. Reprocessing should safely upsert the same user's subscription instead of creating another row.
8. Test invalid webhook hashes, failed/canceled payments, and a mismatched amount. These must not grant Premium.
9. Test renewal and cancellation with your Flutterwave test account. Confirm the recurring notification includes a subscription ID that maps to the user's existing subscription row. Cancellation should set the row status to `canceled`.

If test mode cannot create your chosen USD recurring plan, resolve currency/payment-plan availability with Flutterwave before enabling the plan in Orator.

## 6. Deploy to production

1. Create the same three plans in Flutterwave live mode and record their live plan IDs.
2. Set the production `FLW_SECRET_KEY`, `FLW_SECRET_HASH`, `FLW_REDIRECT_URL`, and three `FLW_*_PLAN_ID` values in the hosting provider's server-side secret/variable settings.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server-only values. Keep the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as client build variables.
4. Register the production webhook at `https://YOUR_DOMAIN/api/flutterwave-webhook`, configure the live webhook secret hash, and select successful charge and subscription-cancellation events.
5. Build and deploy the app. Check the deployment logs for missing runtime variables without logging their values.
6. Complete a low-value live checkout, confirm the webhook updates the correct Supabase user, and refund it if appropriate. Check Flutterwave's delivery logs and Supabase before announcing launch.

For a Cloudflare Worker deployment, add `SUPABASE_SERVICE_ROLE_KEY`, `FLW_SECRET_KEY`, and `FLW_SECRET_HASH` under **Worker > Settings > Variables and Secrets > Secrets**. Add `SUPABASE_URL`, `FLW_REDIRECT_URL`, and the three plan IDs as server-side bindings. Ensure the Worker runtime exposes these bindings through `process.env`, which the server handlers read; do not add them as `VITE_` client variables.

## 7. Transition existing subscribers

The database migration labels existing payment rows as `legacy` and preserves their current access status. It does **not** cancel their old recurring payments or transfer those subscriptions to Flutterwave. Before switching production checkout:

1. Identify current paying subscribers and their renewal dates.
2. Notify them about the payment-provider change and give them a clear action/timeline.
3. Cancel their old recurring subscriptions in the previous provider, or let them reach their agreed paid-through date.
4. Avoid asking a subscriber to start the new plan until their old renewal is canceled, or they may be charged twice.
5. After the paid-through date, mark each transitioned legacy row canceled so the app can accept a new plan. Run this for each verified user ID, not for all customers at once:

```sql
update public.subscriptions
set status = 'canceled',
      cancel_at_period_end = false,
      updated_at = now()
where user_id = 'THE_AUTH_USER_UUID'
   and payment_provider = 'legacy';
```

6. Have the user start the new Flutterwave plan. Once a verified Flutterwave charge arrives, that row is updated to `payment_provider = flutterwave`.

## Troubleshooting

- **Payment checkout is not configured:** check all required server variables and the Worker runtime's access to them. Do not add secret values to `VITE_` variables.
- **This payment plan is not configured yet:** verify the corresponding `FLW_*_PLAN_ID` is the numeric ID of a plan in the same Flutterwave mode as the secret key.
- **Checkout opens but Premium stays locked:** check Flutterwave webhook delivery logs, the exact `FLW_SECRET_HASH`, the public webhook URL, Supabase service-role access, the payment attempt's `tx_ref`, and the transaction verification result.
- **Webhook rejects the signature:** confirm Flutterwave sends `verif-hash` and that its configured secret hash exactly matches `FLW_SECRET_HASH` for the same test/live environment.
- **Charge is verified but ignored:** ensure the verified transaction amount and currency exactly match USD 2.99, 5.99, or 71.88 and that its `tx_ref` exists in `payment_attempts` or its subscription ID matches an existing Flutterwave subscription.
