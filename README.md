## AIF Dashboard

Dashboard for **Name**, **Number**, **Network**, **Business Name**, and which **AIF** (event/source file) each record came from.

### Run

In PowerShell, from this folder:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Deploy (Vercel)

- Import the GitHub repo into Vercel
- No special build settings required (Vercel auto-detects Next.js)
- Ensure the **Production Branch** is set to `main` in Vercel Project Settings

### Auth (Supabase)

This app can be restricted to authorized users using Supabase Auth (Email + Password).

1) Create a Supabase project
2) In Supabase: **Authentication → Providers → Email** (enable Email/Password)
3) Create users in **Authentication → Users**
4) Set these environment variables in Vercel (and optionally in a local `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then deploy. The site will redirect to `/login` until you sign in.

### Uploading new XLSX files (Supabase Storage)

Uploads require Supabase Storage (Vercel deployments cannot write to the repo filesystem).

1) In Supabase: **Storage → Create bucket**
   - Bucket name: `database` (or set `AIF_STORAGE_BUCKET` to your bucket name)
2) Add Storage access policies so authenticated users can read + upload objects in that bucket.
3) In Vercel, set:

- `AIF_USE_SUPABASE_STORAGE=true`
- `AIF_STORAGE_BUCKET=database` (optional; defaults to `database`)

After that, the sidebar **Add new XLSX** control will upload to Storage and the dashboard will refresh.

### AIF Events: digital attendee registration

This repo includes a simple event + attendee registration system backed by Supabase Postgres.

1) Run the SQL in `supabase.sql` in Supabase **SQL Editor**
2) Set these Vercel environment variables:

- `SUPABASE_SERVICE_ROLE_KEY` (Supabase Project Settings → API → service_role key)
- `AIF_ADMIN_EMAILS` (comma-separated, e.g. `you@company.com,admin@company.com`)

Then:
- Admin page: `/admin` (creates events and generates registration links)
- Public registration page: `/register/<event-slug>`

To include event registrations inside the main Excel dashboard, set:

- `AIF_INCLUDE_REGISTRATIONS=true`

### Preview Environment (Pre-production)

Preview environments let you deploy and test changes live **without affecting Production**.

By default, Vercel creates a **Preview Deployment** when you:

- Push a commit to a branch that is **not** the production branch (commonly `main`)
- Create a Pull Request (PR) in GitHub
- Deploy using the CLI without the `--prod` flag (for example, `vercel`)

Each preview deployment gets an automatically generated URL.

There are two common Preview URL types:

- **Branch-specific URL**: always points to the latest deployment of that branch
- **Commit-specific URL**: points to the deployment created for that exact commit

#### How to use it (GitHub)

```bash
git checkout -b feature/my-change
git commit -am "My change"
git push -u origin feature/my-change
```

Then open a PR to `main`. Vercel will post Preview links in the PR and show them in the Vercel dashboard.

### Data location

```bash
./database/*.xlsx
```

The dashboard API reads Excel files from `./database` on the server. For Vercel, commit your `database/*.xlsx` files into the repo.

### Legacy (Streamlit)

The old Streamlit version is still in `app.py` if you need it locally.

