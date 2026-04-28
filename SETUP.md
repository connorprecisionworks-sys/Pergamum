# Pergamum — Manual Setup Guide

Complete these steps once to get the app running against a real Supabase project.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Fill in:
   - **Name:** `pergamum` (or anything you like)
   - **Database password:** generate a strong password and save it
   - **Region:** pick the one closest to your users
4. Wait ~2 minutes for provisioning.

---

## 2. Grab your API keys

In the Supabase dashboard → **Project Settings → API**:

| Key | Where to paste |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` |
| **anon / public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` |
| **service_role** key (secret — keep it off client) | `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` |

---

## 3. Run the database migration

**Option A — Supabase CLI (recommended)**

```bash
# Install the CLI (if you haven't already)
brew install supabase/tap/supabase   # macOS
# or: npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

Your project ref is the part after `https://` in your project URL, e.g. `abcdefghijklmnop`.

**Option B — SQL editor**

1. Supabase dashboard → **SQL Editor → New query**.
2. Paste the entire contents of `supabase/migrations/0001_init.sql`.
3. Click **Run**.

---

## 4. Configure Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or use an existing one).
3. **APIs & Services → OAuth consent screen** — fill in app name, support email, etc.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**.
6. In Supabase dashboard → **Authentication → Providers → Google**:
   - Toggle **Enable Google provider** ON.
   - Paste the Client ID and Client Secret.
   - Save.

---

## 5. Configure GitHub OAuth

1. Go to [github.com/settings/developers](https://github.com/settings/developers).
2. Click **New OAuth App**.
   - **Application name:** Pergamum (or your app name)
   - **Homepage URL:** `http://localhost:3000` (update to your Vercel URL later)
   - **Authorization callback URL:** `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Register the app and generate a **Client Secret**.
4. In Supabase dashboard → **Authentication → Providers → GitHub**:
   - Toggle **Enable GitHub provider** ON.
   - Paste the Client ID and Client Secret.
   - Save.

---

## 6. Set your Site URL

In Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (dev) — update to your Vercel deployment URL in production.
- **Redirect URLs:** add `http://localhost:3000/auth/callback` and `https://your-vercel-domain.vercel.app/auth/callback`.

---

## 7. Create your admin user

1. Sign up at `http://localhost:3000/auth/signup` with your email.
2. Confirm your email (check your inbox — Supabase sends a magic link).
3. In Supabase dashboard → **Table Editor → profiles**, find your row and set `is_admin = true`.

---

## 8. Vercel deployment (when ready)

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Import Project** → select your repo.
3. Add all environment variables from `.env.local` in the Vercel project settings.
4. Update Supabase **Site URL** and **Redirect URLs** to your Vercel domain.
5. Update the GitHub OAuth app's callback URL to `https://your-vercel-domain.vercel.app`.
6. Deploy.

---

## Email template polish

In the Supabase dashboard → **Authentication → Email Templates → Confirm signup**, replace the default template with the following HTML. This keeps the Pergamum brand and provides a plain-text fallback.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your Pergamum account</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,-apple-system,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;padding:48px 40px;">
          <tr>
            <td>
              <!-- Wordmark -->
              <p style="margin:0 0 32px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9370db;">
                PERGAMUM
              </p>

              <!-- Headline -->
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
                Confirm your email
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#a0a0a0;line-height:1.6;">
                Click the button below to confirm your address and get into the library.
              </p>

              <!-- CTA -->
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;">
                Confirm email
              </a>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #2a2a2a;margin:36px 0;" />

              <!-- Footer -->
              <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                If you didn&rsquo;t create a Pergamum account, you can safely ignore this email.<br />
                Community-powered and free forever &mdash; <a href="https://pergamum.app" style="color:#9370db;text-decoration:none;">pergamum.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

Plain-text fallback (paste into the "Text" tab of the same template):

```
PERGAMUM

Confirm your email address to get into the library.

{{ .ConfirmationURL }}

If you didn't create a Pergamum account, ignore this email.
— pergamum.app
```

---

## Checklist

- [ ] Supabase project created
- [ ] API keys in `.env.local`
- [ ] Migration run (`0001_init.sql`)
- [ ] Google OAuth configured in Supabase + GCP
- [ ] GitHub OAuth configured in Supabase + GitHub
- [ ] Site URL and redirect URLs set in Supabase Auth settings
- [ ] Admin user created (`is_admin = true` in `profiles` table)
- [ ] `pnpm dev` running at http://localhost:3000
- [ ] Signed up, confirmed email, can browse and submit prompts
