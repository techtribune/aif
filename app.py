from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import pandas as pd
import streamlit as st


ROOT = Path(__file__).resolve().parent
DEFAULT_DATABASE_DIR = ROOT / "database"


@dataclass(frozen=True)
class AifRecordSet:
    df: pd.DataFrame
    load_warnings: list[str]


def _norm(s: object) -> str:
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return ""
    return str(s).strip().upper()


def _pick_col(columns: Iterable[str], *, exact: Iterable[str], contains: Iterable[str] = ()) -> Optional[str]:
    cols = list(columns)
    cols_norm = {_norm(c): c for c in cols}

    for key in exact:
        if _norm(key) in cols_norm:
            return cols_norm[_norm(key)]

    for c in cols:
        cn = _norm(c)
        for needle in contains:
            if _norm(needle) in cn:
                return c

    return None


def _find_header_row(raw: pd.DataFrame, *, max_scan_rows: int = 40) -> Optional[int]:
    scan_rows = min(max_scan_rows, len(raw))
    required = {"NAME", "NUMBER", "NETWORK"}

    for i in range(scan_rows):
        row = raw.iloc[i].tolist()
        tokens = {_norm(v) for v in row if _norm(v)}
        if required.issubset(tokens):
            return i

    return None


def _read_aif_excel(path: Path) -> tuple[pd.DataFrame, list[str]]:
    warnings: list[str] = []

    try:
        raw = pd.read_excel(path, sheet_name=0, header=None)
    except Exception as e:
        return pd.DataFrame(), [f"Failed to read `{path.name}`: {e}"]

    header_row = _find_header_row(raw)
    if header_row is None:
        return pd.DataFrame(), [f"Could not find table header row in `{path.name}` (expected columns like NAME/NUMBER/NETWORK)."]

    columns = [_norm(v) if _norm(v) else "" for v in raw.iloc[header_row].tolist()]
    df = raw.iloc[header_row + 1 :].copy()
    df.columns = columns

    # Drop fully-empty rows/cols.
    df = df.dropna(axis=0, how="all").dropna(axis=1, how="all")

    name_col = _pick_col(df.columns, exact=["NAME"], contains=["NAME"])
    number_col = _pick_col(df.columns, exact=["NUMBER"], contains=["NUMBER", "MOBILE", "CONTACT"])
    network_col = _pick_col(df.columns, exact=["NETWORK"], contains=["NETWORK"])
    business_col = _pick_col(df.columns, exact=["BUSINESS NAME"], contains=["BUSINESS"])

    missing = [k for k, v in [("NAME", name_col), ("NUMBER", number_col), ("NETWORK", network_col), ("BUSINESS NAME", business_col)] if v is None]
    if missing:
        warnings.append(f"`{path.name}` is missing column(s): {', '.join(missing)}. It will still be loaded with what exists.")

    keep = [c for c in [name_col, number_col, network_col, business_col] if c is not None]
    slim = df[keep].copy() if keep else pd.DataFrame()

    # Standardize output column names.
    rename: dict[str, str] = {}
    if name_col:
        rename[name_col] = "Name"
    if number_col:
        rename[number_col] = "Number"
    if network_col:
        rename[network_col] = "Network"
    if business_col:
        rename[business_col] = "Business Name"
    slim = slim.rename(columns=rename)

    # Best-effort cleanup.
    for c in ["Name", "Network", "Business Name"]:
        if c in slim.columns:
            slim[c] = slim[c].astype(str).str.strip().replace({"nan": ""})
    if "Number" in slim.columns:
        # Preserve leading zeros if any; avoid scientific notation.
        slim["Number"] = slim["Number"].astype(str).str.replace(r"\.0$", "", regex=True).str.strip().replace({"nan": ""})

    slim["AIF"] = path.stem
    slim = slim[["AIF"] + [c for c in ["Name", "Number", "Network", "Business Name"] if c in slim.columns]]

    return slim, warnings


@st.cache_data(show_spinner=False)
def load_all_aif_records(database_dir: str) -> AifRecordSet:
    db = Path(database_dir)
    if not db.exists():
        return AifRecordSet(df=pd.DataFrame(), load_warnings=[f"Database folder not found: `{db}`"])

    paths = sorted([p for p in db.glob("*.xlsx") if not p.name.startswith("~$")])
    if not paths:
        return AifRecordSet(df=pd.DataFrame(), load_warnings=[f"No .xlsx files found in `{db}`"])

    frames: list[pd.DataFrame] = []
    warnings: list[str] = []
    for p in paths:
        df, w = _read_aif_excel(p)
        warnings.extend(w)
        if not df.empty:
            frames.append(df)

    if not frames:
        return AifRecordSet(df=pd.DataFrame(), load_warnings=warnings or [f"Found files in `{db}`, but none could be parsed."])

    out = pd.concat(frames, ignore_index=True)
    for c in ["AIF", "Name", "Number", "Network", "Business Name"]:
        if c in out.columns:
            out[c] = out[c].fillna("").astype(str).str.strip()

    # Remove rows with no meaningful details.
    detail_cols = [c for c in ["Name", "Number", "Network", "Business Name"] if c in out.columns]
    if detail_cols:
        details_any = out[detail_cols].apply(lambda r: any(bool(str(v).strip()) for v in r), axis=1)
        out = out[details_any].copy()

    return AifRecordSet(df=out, load_warnings=warnings)


def _inject_modern_css() -> None:
    st.markdown(
        """
        <style>
          /* Tighter, more dashboard-like spacing */
          .block-container { padding-top: 1.25rem; padding-bottom: 2.5rem; }

          /* Headings */
          h1 { letter-spacing: -0.02em; }

          /* Sidebar polish */
          section[data-testid="stSidebar"] .block-container { padding-top: 1.0rem; }

          /* Card-like containers */
          .aif-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 14px 14px 6px 14px;
          }
          .aif-card h3 { margin: 0 0 0.25rem 0; font-size: 0.95rem; color: rgba(229,231,235,0.9); }
          .aif-kpi { font-size: 1.55rem; font-weight: 700; margin: 0; }
          .aif-sub { margin-top: 0.25rem; font-size: 0.85rem; color: rgba(229,231,235,0.65); }

          /* Make dataframe feel less cramped */
          div[data-testid="stDataFrame"] { border-radius: 14px; overflow: hidden; }

          /* Mobile: prevent horizontal overflow from Streamlit columns/tables */
          @media (max-width: 860px) {
            /* Streamlit's horizontal blocks (columns) should wrap into a single column */
            div[data-testid="stHorizontalBlock"] {
              flex-wrap: wrap !important;
              gap: 0.75rem !important;
            }
            div[data-testid="column"] {
              width: 100% !important;
              flex: 1 1 100% !important;
              min-width: 0 !important;
            }

            /* Avoid edge-to-edge UI on phones */
            .block-container { padding-left: 1rem; padding-right: 1rem; }
          }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _kpi_card(title: str, value: str, subtitle: str = "") -> None:
    st.markdown(
        f"""
        <div class="aif-card">
          <h3>{title}</h3>
          <div class="aif-kpi">{value}</div>
          <div class="aif-sub">{subtitle}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def main() -> None:
    # "centered" behaves better on phones; the CSS above makes desktop still feel roomy.
    st.set_page_config(page_title="AIF Dashboard", page_icon="📊", layout="centered")
    _inject_modern_css()

    st.title("AIF Dashboard")
    st.caption("Search Name, Number, Network, Business Name — and see which AIF event (source file) each record came from.")
    st.caption("Tip: use the download buttons below.")

    with st.sidebar:
        st.subheader("AIF Data")
        database_dir = st.text_input("Database folder", value=str(DEFAULT_DATABASE_DIR))
        st.caption("Loads all `*.xlsx` inside this folder.")

    record_set = load_all_aif_records(database_dir)
    df = record_set.df

    if record_set.load_warnings:
        with st.expander("Load notes", expanded=False):
            for w in record_set.load_warnings:
                st.warning(w)

    if df.empty:
        st.info("No data loaded yet. Confirm the database folder path and that it contains the AIF `.xlsx` files.")
        return

    with st.sidebar:
        st.divider()
        st.subheader("Filters")

        aif_options = sorted([v for v in df["AIF"].dropna().unique().tolist() if str(v).strip()])
        network_options = sorted(
            [v for v in df.get("Network", pd.Series(dtype=str)).dropna().unique().tolist() if str(v).strip()]
        )

        search = st.text_input("Search", value="", placeholder="Name, number, business…")
        selected_aif = st.multiselect("AIF event", options=aif_options, default=aif_options)
        selected_network = st.multiselect("Network", options=network_options, default=network_options)
        duplicate_mode = st.selectbox(
            "Number duplicates",
            options=["All", "Only duplicates", "Only unique"],
            index=0,
            help="Duplicates are computed from the Number field (blank numbers are ignored).",
        )

        st.divider()
        st.caption("Tip: paste a phone number to find matches instantly.")

    filtered = df.copy()
    if selected_aif:
        filtered = filtered[filtered["AIF"].isin(selected_aif)]
    if "Network" in filtered.columns and selected_network:
        filtered = filtered[filtered["Network"].isin(selected_network)]

    q = search.strip().lower()
    if q:
        cols = [c for c in ["Name", "Number", "Business Name", "Network", "AIF"] if c in filtered.columns]
        mask = False
        for c in cols:
            mask = mask | filtered[c].astype(str).str.lower().str.contains(q, na=False)
        filtered = filtered[mask]

    if duplicate_mode != "All" and "Number" in filtered.columns:
        numbers = filtered["Number"].astype(str).str.strip()
        has_number = (numbers != "") & (numbers.str.lower() != "nan")
        dup_mask = pd.Series(False, index=filtered.index)
        if has_number.any():
            dup_mask = numbers[has_number].duplicated(keep=False).reindex(filtered.index, fill_value=False)

        if duplicate_mode == "Only duplicates":
            filtered = filtered[dup_mask]
        elif duplicate_mode == "Only unique":
            filtered = filtered[~dup_mask]

    # Header KPIs (modern cards)
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        _kpi_card("Records", f"{len(filtered):,}", "After filters")
    with k2:
        _kpi_card("AIF events", f"{filtered['AIF'].nunique():,}", "Unique sources")
    if "Network" in filtered.columns:
        top_network = filtered["Network"].value_counts(dropna=True).head(1)
        top_name = top_network.index[0] if len(top_network) else "—"
        with k3:
            _kpi_card("Networks", f"{filtered['Network'].nunique():,}", "Unique")
        with k4:
            _kpi_card("Top network", f"{top_name}", f"{int(top_network.iloc[0]) if len(top_network) else 0:,} records")
    else:
        with k3:
            _kpi_card("Networks", "—")
        with k4:
            _kpi_card("Top network", "—")

    tab_overview, tab_analytics, tab_table = st.tabs(["Overview", "Analytics", "Table"])

    with tab_overview:
        left2, right2 = st.columns([0.55, 0.45])
        with left2:
            st.subheader("Top networks")
            if "Network" in filtered.columns:
                net_counts = filtered["Network"].replace("", pd.NA).dropna().value_counts().head(12)
                if len(net_counts):
                    st.bar_chart(net_counts, height=260)
                else:
                    st.info("No network values found after filters.")
            else:
                st.info("No Network column found.")

        with right2:
            st.subheader("AIF events (by record count)")
            aif_counts = filtered["AIF"].replace("", pd.NA).dropna().value_counts().head(12)
            st.bar_chart(aif_counts, height=260)

        st.divider()
        st.subheader("Quick actions")
        d1, d2 = st.columns([0.7, 0.3], vertical_alignment="center")
        with d1:
            st.caption("Download the currently filtered dataset as CSV.")
        with d2:
            col_order = [c for c in ["AIF", "Name", "Number", "Network", "Business Name"] if c in filtered.columns]
            view = filtered[col_order].reset_index(drop=True)
            st.download_button(
                "Download filtered CSV",
                data=view.to_csv(index=False).encode("utf-8"),
                file_name="aif_filtered.csv",
                mime="text/csv",
                use_container_width=True,
            )

    with tab_analytics:
        st.subheader("Analytics")
        st.caption("Quality checks and high-signal summaries based on the current filters.")

        a1, a2, a3, a4 = st.columns(4)

        # Uniqueness / duplicates on Number (if present)
        if "Number" in filtered.columns:
            numbers = filtered["Number"].astype(str).str.strip()
            numbers = numbers[(numbers != "") & (numbers.str.lower() != "nan")]
            unique_numbers = int(numbers.nunique()) if len(numbers) else 0
            dup_numbers = int(numbers.duplicated().sum()) if len(numbers) else 0
        else:
            unique_numbers = 0
            dup_numbers = 0

        # Completeness across key fields
        key_cols = [c for c in ["Name", "Number", "Network", "Business Name"] if c in filtered.columns]
        if key_cols:
            nonempty_counts = {}
            for c in key_cols:
                s = filtered[c].astype(str).str.strip()
                nonempty_counts[c] = int(((s != "") & (s.str.lower() != "nan")).sum())
            total = len(filtered)
            completeness = int(round(100 * sum(nonempty_counts.values()) / (max(1, total) * len(key_cols))))
        else:
            completeness = 0
            total = len(filtered)

        with a1:
            _kpi_card("Unique numbers", f"{unique_numbers:,}", "Distinct phone numbers")
        with a2:
            _kpi_card("Duplicate entries", f"{dup_numbers:,}", "Repeated phone numbers")
        with a3:
            _kpi_card("Completeness", f"{completeness}%", "Across key fields")
        with a4:
            _kpi_card("Filtered records", f"{len(filtered):,}", "Current selection")

        st.divider()

        left3, right3 = st.columns([0.55, 0.45])
        with left3:
            st.subheader("Top AIF events")
            aif_counts_all = filtered["AIF"].replace("", pd.NA).dropna().value_counts().head(20)
            st.dataframe(
                aif_counts_all.rename_axis("AIF").reset_index(name="Records"),
                use_container_width=True,
                hide_index=True,
            )

        with right3:
            st.subheader("Missing fields (count)")
            if key_cols:
                miss_rows = []
                for c in key_cols:
                    s = filtered[c].astype(str).str.strip()
                    miss_rows.append({"Field": c, "Missing": int(((s == "") | (s.str.lower() == "nan")).sum())})
                miss_df = pd.DataFrame(miss_rows).sort_values("Missing", ascending=False)
                st.bar_chart(miss_df.set_index("Field"), height=260)
            else:
                st.info("Key fields not found in this dataset.")

        st.divider()

        b1, b2 = st.columns(2)
        with b1:
            st.subheader("Top networks")
            if "Network" in filtered.columns:
                net = filtered["Network"].astype(str).str.strip()
                net = net[(net != "") & (net.str.lower() != "nan")]
                net_counts2 = net.value_counts().head(20)
                st.dataframe(
                    net_counts2.rename_axis("Network").reset_index(name="Records"),
                    use_container_width=True,
                    hide_index=True,
                )
            else:
                st.info("No Network column found.")

        with b2:
            st.subheader("Top business names (normalized)")
            if "Business Name" in filtered.columns:
                biz = filtered["Business Name"].astype(str).str.strip()
                biz = biz[(biz != "") & (biz.str.lower() != "nan")]
                biz_norm = (
                    biz.str.replace(r"\s+", " ", regex=True)
                    .str.replace(r"\s*-\s*", " - ", regex=True)
                    .str.strip()
                    .str.title()
                )
                biz_counts = biz_norm.value_counts().head(20)
                st.dataframe(
                    biz_counts.rename_axis("Business Name").reset_index(name="Records"),
                    use_container_width=True,
                    hide_index=True,
                )
            else:
                st.info("No Business Name column found.")

    with tab_table:
        st.subheader("Records")
        st.caption("Sorted, searchable via filters in the sidebar.")

        col_order = [c for c in ["AIF", "Name", "Number", "Network", "Business Name"] if c in filtered.columns]
        view = filtered[col_order].reset_index(drop=True)

        st.dataframe(
            view,
            use_container_width=True,
            hide_index=True,
            column_config={
                "AIF": st.column_config.TextColumn("AIF (event/source)", width="large"),
                "Name": st.column_config.TextColumn("Name", width="medium"),
                "Number": st.column_config.TextColumn("Number", width="medium"),
                "Network": st.column_config.TextColumn("Network", width="small"),
                "Business Name": st.column_config.TextColumn("Business Name", width="large"),
            },
        )

        c_dl1, c_dl2 = st.columns([0.7, 0.3], vertical_alignment="center")
        with c_dl2:
            st.download_button(
                "Download CSV",
                data=view.to_csv(index=False).encode("utf-8"),
                file_name="aif_filtered.csv",
                mime="text/csv",
                use_container_width=True,
            )


if __name__ == "__main__":
    main()

