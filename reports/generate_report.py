#!/usr/bin/env python3
"""Clinic report: reads appointments from the API (admin login) and writes a PDF with charts.

Usage (from the project root, backend running):
    python reports/generate_report.py --email admin@clinic.test --password Admin@123
Options:
    --api   http://localhost:5000/api     API base URL
    --from  2026-10-01  --to 2026-10-31   optional date range
    --out   report.pdf                    output file
    --input rows.json                     use a saved JSON file instead of calling the API
"""
import argparse
import collections
import datetime
import json
import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

STATUS_COLORS = {
    "completed": "#12a37f", "no-show": "#c92a2a", "cancelled": "#98a8ac",
    "booked": "#0b7285", "waiting": "#f59f00", "in-consultation": "#f59f00",
}


def fetch_rows(args):
    if args.input:
        with open(args.input, encoding="utf-8") as f:
            return json.load(f)
    import requests  # only needed when talking to the API

    email = args.email or os.getenv("ADMIN_EMAIL")
    password = args.password or os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        sys.exit("Give --email and --password (or set ADMIN_EMAIL / ADMIN_PASSWORD).")
    login = requests.post(f"{args.api}/auth/login", json={"email": email, "password": password}, timeout=20)
    if login.status_code != 200:
        sys.exit(f"Login failed: {login.text}")
    token = login.json().get("token")
    if not token:
        sys.exit("Login response had no token.")
    params = {k: v for k, v in {"from": args.date_from, "to": args.to}.items() if v}
    res = requests.get(f"{args.api}/admin/appointments", headers={"Authorization": f"Bearer {token}"}, params=params, timeout=30)
    if res.status_code != 200:
        sys.exit(f"Could not load appointments: {res.text}")
    return res.json()


def summarise(rows):
    status = collections.Counter(r["status"] for r in rows)
    mode = collections.Counter(r["mode"] for r in rows)
    per_day = collections.Counter(r["date"] for r in rows if r["status"] != "cancelled")
    doctors = collections.defaultdict(collections.Counter)
    for r in rows:
        doctors[f"Dr. {r['doctor']}"][r["status"]] += 1
    seen = status["completed"] + status["no-show"]
    return {
        "total": len(rows),
        "status": status,
        "mode": mode,
        "per_day": per_day,
        "doctors": doctors,
        "attendance": round(100 * status["completed"] / seen) if seen else None,
        "cancel_rate": round(100 * status["cancelled"] / len(rows)) if rows else None,
    }


def build_pdf(rows, s, out, title_range):
    with PdfPages(out) as pdf:
        # ---- page 1: summary + charts
        fig = plt.figure(figsize=(8.27, 11.69))
        fig.suptitle("Clinic appointment report", fontsize=20, fontweight="bold", y=0.97)
        fig.text(0.5, 0.935, f"{title_range}  ·  generated {datetime.date.today():%d %b %Y}", ha="center", color="#5f7a80")
        kpis = [
            ("Appointments", s["total"]),
            ("Completed", s["status"]["completed"]),
            ("Attendance", "-" if s["attendance"] is None else f"{s['attendance']}%"),
            ("Cancelled", "-" if s["cancel_rate"] is None else f"{s['cancel_rate']}%"),
        ]
        for i, (label, value) in enumerate(kpis):
            x = 0.08 + i * 0.23
            fig.text(x, 0.885, str(value), fontsize=22, fontweight="bold", color="#0b7285")
            fig.text(x, 0.862, label, fontsize=10, color="#5f7a80")

        ax = fig.add_axes([0.1, 0.55, 0.82, 0.26])
        days = sorted(s["per_day"])
        ax.bar([d[5:] for d in days], [s["per_day"][d] for d in days], color="#0b7285")
        ax.set_title("Appointments per day (excluding cancelled)", loc="left", fontsize=11)
        ax.tick_params(axis="x", rotation=60, labelsize=7)
        ax.spines[["top", "right"]].set_visible(False)

        ax = fig.add_axes([0.1, 0.27, 0.38, 0.22])
        names = list(s["status"])
        ax.barh(names, [s["status"][n] for n in names], color=[STATUS_COLORS.get(n, "#0b7285") for n in names])
        ax.set_title("By status", loc="left", fontsize=11)
        ax.spines[["top", "right"]].set_visible(False)

        ax = fig.add_axes([0.58, 0.27, 0.34, 0.22])
        if s["mode"]:
            ax.pie(s["mode"].values(), labels=s["mode"].keys(), autopct="%1.0f%%", colors=["#0b7285", "#f59f00"])
        ax.set_title("Online vs in-person", loc="left", fontsize=11)

        ax = fig.add_axes([0.22, 0.05, 0.70, 0.16])
        docs = list(s["doctors"])
        left = [0] * len(docs)
        for st in ["completed", "booked", "waiting", "in-consultation", "no-show", "cancelled"]:
            vals = [s["doctors"][d][st] for d in docs]
            if any(vals):
                ax.barh(docs, vals, left=left, label=st, color=STATUS_COLORS[st])
                left = [a + b for a, b in zip(left, vals)]
        ax.set_title("Appointments per doctor", loc="left", fontsize=11)
        ax.legend(fontsize=7, ncol=3, frameon=False, loc="lower right")
        ax.spines[["top", "right"]].set_visible(False)
        pdf.savefig(fig)
        plt.close(fig)

        # ---- page 2+: appointment list
        per_page = 38
        for start in range(0, max(len(rows), 1), per_page):
            fig = plt.figure(figsize=(8.27, 11.69))
            fig.text(0.06, 0.96, "Appointment list", fontsize=14, fontweight="bold")
            chunk = rows[start:start + per_page]
            cells = [[r["date"], r["startTime"], r["queueNumber"], r["doctor"], r["patient"], r["mode"], r["status"]] for r in chunk]
            ax = fig.add_axes([0.04, 0.04, 0.92, 0.9])
            ax.axis("off")
            if cells:
                table = ax.table(cellText=cells, colLabels=["Date", "Time", "Queue", "Doctor", "Patient", "Mode", "Status"], loc="upper center", cellLoc="left")
                table.auto_set_font_size(False)
                table.set_fontsize(7.5)
                table.scale(1, 1.35)
            else:
                ax.text(0.5, 0.9, "No appointments in this range.", ha="center")
            pdf.savefig(fig)
            plt.close(fig)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--api", default=os.getenv("API_URL", "http://localhost:5000/api"))
    p.add_argument("--email")
    p.add_argument("--password")
    p.add_argument("--from", dest="date_from")
    p.add_argument("--to")
    p.add_argument("--out", default="report.pdf")
    p.add_argument("--input")
    args = p.parse_args()

    rows = fetch_rows(args)
    s = summarise(rows)
    rng = f"{args.date_from or 'start'} to {args.to or 'today'}"
    build_pdf(rows, s, args.out, rng)
    print(f"Report written to {args.out}  ({s['total']} appointments)")


if __name__ == "__main__":
    main()
