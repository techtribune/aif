## AIF Dashboard

Dashboard for **Name**, **Number**, **Network**, **Business Name**, and which **AIF** (event/source file) each record came from.

### Run

In PowerShell, from this folder:

```bash
python -m pip install -r requirements.txt
streamlit run app.py --server.headless true --browser.gatherUsageStats false
```

Then open `http://localhost:8501`.

### Data location

By default the app loads Excel files from `./database/*.xlsx` (and ignores temporary Excel lock files that start with `~$`).

If your folder is different, change **Database folder** in the sidebar.

