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

