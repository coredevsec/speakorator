# Supabase Authentication Setup

The app includes email and password sign-up and sign-in at `/sign-up` and `/sign-in`. Supabase Auth stores credentials and sessions. The SQL script in `supabase/schema.sql` creates a secure profile table for the extra sign-up fields and copies the form's profile metadata into it automatically.

## 1. Create a Supabase project

1. Sign in to the Supabase dashboard and create a project.
2. Open the project's **Connect** dialog or **Project Settings > API**.
3. Copy the **Project URL** and the browser-safe **publishable key** (or legacy `anon` key).
4. Never put the `service_role` or secret key in a `VITE_` variable or any browser code.

## 2. Add local environment values

Copy `.env.example` to `.env` in the project root, then replace both example values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-publishable-or-anon-key
```

Keep `.env` private. It is ignored by Git. Restart the Vite dev server after changing environment values:

```sh
npm run dev
```

The sign-in and sign-up pages need both values to contact Supabase. Without them, an attempted request reports that authentication is unavailable.

## 3. Add the profile table and trigger

The sign-up form sends these metadata keys: `first_name`, `surname`, `country`, `state_region`, `occupation`, and `phone`.

1. In your Supabase dashboard, open **SQL Editor**.
2. Choose **New query**.
3. Open `supabase/schema.sql` in this project and copy the entire file.
4. Paste the SQL into the Supabase editor and click **Run**.
5. Confirm the query succeeds. In **Table Editor**, verify `public.profiles` exists and Row Level Security is enabled.

If you already ran an earlier version of `schema.sql`, run the current complete file again. It now grants authenticated users permission to insert their own profile row, which is needed for the Settings page's profile upsert when a profile row is missing. The RLS policy still restricts inserts to the signed-in user's own `auth.uid()`.

The script creates a profile row automatically whenever Supabase Auth creates a user. It grants signed-in users permission to read or update only the row whose `id` matches their own auth user ID. It does not allow anonymous reads or inserts. The auth trigger inserts the row using the metadata from the sign-up form.

The same script also creates `public.subscriptions` and the server-only `public.payment_attempts` table. Users may select only their own subscription row. Payment endpoints write these rows with the server-only Supabase service-role key.

Passwords are not copied into `public.profiles`. Supabase Auth stores and verifies passwords securely. Never create a password column or send a service-role key to the browser. User metadata is profile information, not a trusted source for access-control decisions.

## 4. Enable Google sign-in

Google sign-in must be configured in both Google Cloud and Supabase.

### Create Google OAuth credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and select or create a project.
2. Open **APIs & Services > OAuth consent screen**.
3. Choose **External** unless this is restricted to a Google Workspace organization.
4. Add the app name `Orator`, a support email, and your developer contact email. Save the consent screen.
5. Open **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
6. Choose **Web application**.
7. Under **Authorized JavaScript origins**, add your local app origin, for example `http://localhost:5173`. Add your production origin later, for example `https://your-domain.example`.
8. Under **Authorized redirect URIs**, add this Supabase callback URL:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Replace `YOUR_PROJECT_REF` with the project reference from your Supabase URL. Copy the generated **Client ID** and **Client secret**.

### Enable Google in Supabase

1. In Supabase, open **Authentication > Sign In / Providers**.
2. Select **Google** and enable it.
3. Paste the Google **Client ID** and **Client secret** into the provider fields.
4. Save the provider settings.

The Google callback URL above belongs in Google Cloud. The Orator redirect URL belongs in Supabase's URL Configuration, covered below. Do not put the Google client secret in `.env`, frontend code, or any `VITE_` variable.

Google users can now use **Continue with Google** on both auth pages. Google OAuth does not collect Orator's extra profile fields, so the profile trigger creates their profile row with empty defaults. You can add a profile-completion page later if those fields are required for Google users.

## 5. Enable email authentication

1. In the Supabase dashboard, open **Authentication > Sign In / Providers**.
2. Enable the **Email** provider.
3. Decide whether to require email confirmation. Requiring confirmation is recommended for a public app. With confirmation enabled, sign-up displays a message asking the user to check their inbox; after confirmation they can sign in.
4. For local testing only, you can turn off confirmation in the Email provider settings. New accounts can then receive a session immediately.

## 6. Configure allowed URLs

Open **Authentication > URL Configuration**:

1. Set **Site URL** to your local origin while developing, for example `http://localhost:5173`.
2. Add `http://localhost:5173/` to **Redirect URLs**. Also add `http://localhost:5173/sign-in` for email confirmation links. If you use another local port, add those exact URLs too.
3. Before deployment, set the production Site URL to your real HTTPS domain and add `https://your-domain.example/sign-in` to Redirect URLs.

The sign-up email confirmation link returns to `/sign-in`. If Supabase reports that a redirect URL is not allowed, compare the scheme, host, port, and path with the allowlist. They must match an allowed URL.

## 7. Test both flows

1. Start the app and open `http://localhost:5173/sign-up`.
2. Register with an email address you can access and a password with at least 8 characters.
3. If confirmation is enabled, open the email and follow its link. Return to `/sign-in` and sign in.
4. After successful sign-in, the page shows the current email and a **Sign out** button.
5. Use the **Sign in** link in the main navigation to return to authentication from the practice page.
6. On either auth page, select **Continue with Google**. Complete the Google consent flow and confirm you return to `/` and can access the practice platform.

After creating a test user, open **Table Editor > profiles** and confirm its row contains the submitted name, surname, country, state/region, phone, and optional occupation. A user should not be able to read another user's profile through the API because of the row-level security policies.

## 8. Configure deployment

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build-time environment variables in your hosting provider, then rebuild the app. Add the deployed domain and `/sign-in` redirect URL in Supabase. Only the public publishable/anon key belongs in these client-side variables; Supabase's Row Level Security and policies are required before adding private user data to database tables.

## 9. Configure Flutterwave subscriptions

Follow the provider setup and deployment steps in [FLUTTERWAVE_SETUP.md](FLUTTERWAVE_SETUP.md). This app creates hosted Flutterwave checkout sessions on the server and grants Premium only after the signed webhook is verified and the transaction is re-verified against Flutterwave.

For existing installations, apply `supabase/migrations/20261007_flutterwave_payments.sql` before deploying the new payment code. It preserves subscription status rows as legacy records while replacing provider-specific database columns. Existing recurring customers must be notified and their old subscriptions deliberately canceled or transitioned to avoid overlapping charges.

The core practice page remains available to every signed-in user without a subscription. Premium features require an `active` or `trialing` subscription. Flutterwave plans do not use the previous trial copy; the billing page now describes recurring plan charges.

## Troubleshooting

- **Authentication reports that it is unavailable:** verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist in `.env`, contain no surrounding quotes or spaces, and restart Vite.
- **Invalid API key or failed request:** use the key labeled publishable or `anon`, paired with the URL from the same Supabase project. Do not use a service-role key.
- **Email link says redirect URL is not allowed:** add the exact callback URL shown above under **Authentication > URL Configuration > Redirect URLs**.
- **No confirmation email arrives:** check spam, confirm Email is enabled, and review the project's email delivery settings. Hosted production email should use a configured SMTP provider.
- **Sign-up succeeds but there is no session:** this is expected when email confirmation is enabled. Confirm the email, then sign in.
