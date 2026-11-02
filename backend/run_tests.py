"""
Automated API tests for the Library Book Tracking and Circulation System.

How to run (backend must be running in another terminal):
    cd ~/library_system/backend
    source venv/bin/activate
    python run_tests.py

Each run creates its own test books and members, and saves the results
in test_results.txt (copy them into your test plan).
"""
import json
import os
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta
from urllib.parse import quote

BASE = "http://localhost:5000/api"
results = []  # (id, name, outcome, detail)


def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"error": raw.decode(errors="ignore")}


def record(tc, name, outcome, detail=""):
    results.append((tc, name, outcome, detail))
    line = f"{outcome:<5} {tc}  {name}"
    if detail and outcome != "PASS":
        line += f"   -> {detail}"
    print(line)


def check(tc, name, ok, detail=""):
    record(tc, name, "PASS" if ok else "FAIL", detail)


def skip(tc, name, why):
    record(tc, name, "SKIP", why)


def find_db():
    here = os.path.dirname(os.path.abspath(__file__))
    for p in (os.path.join(here, "instance", "library.db"),
              os.path.join(here, "library.db")):
        if os.path.exists(p):
            return p
    return None


def err(r):
    return str(r.get("error", "")).lower() if isinstance(r, dict) else ""


def main():
    s = str(int(time.time()) % 1000000)  # makes this run's test data unique

    try:
        call("GET", "/books")
    except urllib.error.URLError:
        sys.exit("Cannot reach the backend at http://localhost:5000 - "
                 "start it first with: python app.py")

    # ---------------------------------------------------------- login
    st, r = call("POST", "/login", {"username": "admin", "password": "wrong"})
    check("TC-22", "Login with a wrong password is refused",
          st == 401 and "error" in r, f"status {st}")

    st, r = call("POST", "/login", {"username": "admin", "password": "admin123"})
    check("TC-23", "Login with correct details returns a token",
          st == 200 and "token" in r, f"status {st}")
    admin = r.get("token") if isinstance(r, dict) else None

    st, r = call("POST", "/login", {"username": "librarian", "password": "librarian123"})
    lib = r.get("token") if isinstance(r, dict) else None
    if not admin or not lib:
        sys.exit("Cannot continue: the sample admin and librarian logins failed. "
                 "Did you run patch_auth.py and restart the backend?")

    st, _ = call("GET", "/stats")
    check("TC-24", "A protected page refuses a request with no login", st == 401, f"status {st}")

    st, _ = call("POST", "/books", {"barcode": f"T{s}Z", "title": "x", "author": "y"}, lib)
    check("TC-25", "A librarian cannot add books (admin only)", st == 403, f"status {st}")

    # ---------------------------------------------------------- books
    def newbook(n, title=None):
        return call("POST", "/books", {
            "barcode": f"T{s}B{n}", "title": title or f"ZTest{s} Book {n}",
            "author": "Test Author", "category": "Testing", "shelf_location": "T-01"}, admin)

    books = {}
    st, books[1] = newbook(1, f"ZTest{s} Alpha")
    check("TC-01", "Add a new book",
          st == 201 and books[1].get("status") == "Available", f"status {st}")

    st, _ = newbook(1)
    check("TC-02", "Adding a duplicate barcode is refused", st == 409, f"status {st}")

    st, _ = call("POST", "/books", {"barcode": f"T{s}X", "author": "A"}, admin)
    check("TC-03", "Adding a book with no title is refused", st == 400, f"status {st}")

    for n in range(2, 8):
        _, books[n] = newbook(n)
    bc = {n: books[n]["barcode"] for n in books}

    def book_status(barcode):
        _, res = call("GET", "/books/search?q=" + quote(barcode))
        return res[0]["status"] if res else None

    st, res = call("GET", "/books/search?q=" + quote(f"ZTest{s} Alpha"))
    check("TC-04", "Search by part of a title finds the book",
          st == 200 and any(x["barcode"] == bc[1] for x in res), f"status {st}")

    st, res = call("GET", "/books/search?q=" + quote(f"zzzzqq{s}"))
    check("TC-05", "A search with no match returns an empty list",
          st == 200 and res == [], f"status {st}")

    # ---------------------------------------------------------- members
    m1, m2 = f"T{s}M1", f"T{s}M2"
    st, _ = call("POST", "/members", {"reg_no": m1, "name": "Test Member One"}, lib)
    check("TC-06", "Register a member", st == 201, f"status {st}")
    call("POST", "/members", {"reg_no": m2, "name": "Test Member Two"}, lib)
    st, _ = call("POST", "/members", {"reg_no": m1, "name": "Again"}, lib)
    check("TC-07", "Registering a duplicate member is refused", st == 409, f"status {st}")

    # ---------------------------------------------------------- issuing
    def issue(reg, barcode):
        return call("POST", "/loans", {"reg_no": reg, "barcode": barcode}, lib)

    st, l1 = issue(m1, bc[1])
    due = (date.today() + timedelta(days=14)).isoformat()
    check("TC-08", "Issue an available book (due in 14 days, status On loan)",
          st == 201 and l1.get("due_date") == due and book_status(bc[1]) == "On loan",
          f"status {st}, due {l1.get('due_date') if isinstance(l1, dict) else l1}")

    st, r = issue(m2, bc[1])
    check("TC-09", "Issuing a book that is already on loan is refused",
          st == 400 and "not available" in err(r), f"status {st}, {r}")

    st, r = issue("NO-SUCH-MEMBER", bc[2])
    check("TC-10", "Issuing to an unknown member is refused", st == 404, f"status {st}")

    st2, _ = issue(m1, bc[2])
    st3, _ = issue(m1, bc[3])
    st4, r = issue(m1, bc[4])
    check("TC-11", "A 4th book is refused when the limit is 3",
          st2 == 201 and st3 == 201 and st4 == 400 and "limit" in err(r),
          f"statuses {st2}/{st3}/{st4}, {r}")

    # ---------------------------------------------------------- returning
    st, r = call("POST", "/returns", {"barcode": bc[1]}, lib)
    check("TC-13", "Return a book on time (no fine, status Available)",
          st == 200 and r.get("fine") == 0 and book_status(bc[1]) == "Available",
          f"status {st}, {r}")

    st, r = call("POST", "/returns", {"barcode": bc[1]}, lib)
    check("TC-14", "Returning a book that is not on loan is refused",
          st == 400 and "not currently on loan" in err(r), f"status {st}, {r}")

    # ---------------------------------------------------------- late return and fines
    db = find_db()
    st, l5 = issue(m2, bc[5])
    fine_made = False
    if st != 201:
        skip("TC-15", "Late return creates a fine", f"could not issue test book ({l5})")
        skip("TC-17", "Overdue report lists the late book", "could not issue test book")
    elif not db:
        skip("TC-15", "Late return creates a fine", "library.db not found next to this script")
        skip("TC-17", "Overdue report lists the late book", "library.db not found next to this script")
    else:
        con = sqlite3.connect(db)
        con.execute("UPDATE loan SET due_date = ? WHERE id = ?",
                    ((date.today() - timedelta(days=5)).isoformat(), l5["id"]))
        con.commit()
        con.close()

        st, rep = call("GET", "/reports/overdue", None, lib)
        row = next((x for x in rep if x["id"] == l5["id"]), None) if st == 200 else None
        check("TC-17", "Overdue report lists the late book with days overdue",
              row is not None and row["days_overdue"] == 5, f"status {st}, row {row}")

        st, r = call("POST", "/returns", {"barcode": bc[5]}, lib)
        fine_made = st == 200 and r.get("fine") == 50
        check("TC-15", "Returning a book 5 days late creates a fine of KES 50",
              fine_made, f"status {st}, {r}")

    if fine_made:
        st, r = issue(m2, bc[6])
        check("TC-12", "A member with an unpaid fine cannot borrow",
              st == 400 and "unpaid" in err(r), f"status {st}, {r}")

        st, fines = call("GET", "/fines", None, lib)
        fine = next((f for f in fines if f["loan_id"] == l5["id"]), None) if st == 200 else None
        paid_ok = False
        if fine:
            st, r = call("POST", f"/fines/{fine['id']}/pay", None, lib)
            paid_ok = st == 200 and r.get("paid") is True
        st, _ = issue(m2, bc[7]) if paid_ok else (0, None)
        check("TC-16", "Paying a fine lets the member borrow again",
              paid_ok and st == 201, f"paid={paid_ok}, issue status {st}")
    else:
        skip("TC-12", "A member with an unpaid fine cannot borrow", "needs TC-15 to pass first")
        skip("TC-16", "Paying a fine lets the member borrow again", "needs TC-15 to pass first")

    # ---------------------------------------------------------- dashboard
    _, before = call("GET", "/stats", None, lib)
    # m1 already holds 2 books (limit 3), so one more is allowed
    st, _ = issue(m1, bc[4])
    _, after = call("GET", "/stats", None, lib)
    check("TC-18", "Dashboard totals change after a book is issued",
          st == 201 and after["on_loan"] == before["on_loan"] + 1
          and after["available"] == before["available"] - 1,
          f"issue {st}, before {before}, after {after}")

    # ---------------------------------------------------------- missing books
    st, r = call("PUT", f"/books/{books[6]['id']}/status", {"status": "Missing"}, admin)
    st2, r2 = issue(m2, bc[6])
    check("TC-19", "Mark a book Missing; it can no longer be issued",
          st == 200 and r.get("status") == "Missing" and st2 == 400 and "not available" in err(r2),
          f"status {st}/{st2}, {r2}")

    st, r = call("PUT", f"/books/{books[4]['id']}/status", {"status": "Missing"}, admin)
    check("TC-20", "A book on loan cannot be marked Missing",
          st == 400 and "return it first" in err(r), f"status {st}, {r}")

    # ---------------------------------------------------------- speed
    t0 = time.perf_counter()
    call("GET", "/books/search?q=" + quote("ZTest"))
    t1 = time.perf_counter()
    call("GET", "/stats", None, lib)
    t2 = time.perf_counter()
    check("TC-21", "Search and dashboard respond in under 3 seconds",
          (t1 - t0) < 3 and (t2 - t1) < 3,
          f"search {t1 - t0:.2f}s, stats {t2 - t1:.2f}s")

    # ---------------------------------------------------------- summary
    results.sort(key=lambda x: x[0])
    p = sum(1 for r in results if r[2] == "PASS")
    f = sum(1 for r in results if r[2] == "FAIL")
    k = sum(1 for r in results if r[2] == "SKIP")
    print(f"\nRESULT: {p} passed, {f} failed, {k} skipped (of {len(results)} tests)")

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_results.txt")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(f"Test run: {datetime.now():%Y-%m-%d %H:%M}\n\n")
        for tc, name, outcome, detail in results:
            fh.write(f"{tc}\t{outcome}\t{name}" + (f"\t{detail}" if outcome != "PASS" and detail else "") + "\n")
        fh.write(f"\n{p} passed, {f} failed, {k} skipped\n")
    print(f"Results saved to {out}")


if __name__ == "__main__":
    main()
