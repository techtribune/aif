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

### Data location

```bash
./database/*.xlsx
```

The dashboard API reads Excel files from `./database` on the server. For Vercel, commit your `database/*.xlsx` files into the repo.

### Legacy (Streamlit)

The old Streamlit version is still in `app.py` if you need it locally.

