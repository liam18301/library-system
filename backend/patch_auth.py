"""Adds login + roles to app.py. Safe to run once; makes a backup first."""
import re, shutil, sys

s = open("app.py", encoding="utf-8").read()
if "require_role" in s:
    sys.exit("app.py already has login support - nothing to do.")

def need(cond, what):
    if not cond:
        sys.exit(f"PATCH FAILED: could not find {what}. Send me this message.")

shutil.copy("app.py", "app.py.bak")

# 1. imports and settings
a = "from flask import Flask, jsonify, request"
need(a in s, "the Flask import line")
s = s.replace(a, "from functools import wraps\n\nfrom flask import Flask, g, jsonify, request")
a = "from flask_sqlalchemy import SQLAlchemy"
need(a in s, "the SQLAlchemy import line")
s = s.replace(a, a + "\nfrom itsdangerous import BadSignature, URLSafeTimedSerializer\nfrom werkzeug.security import check_password_hash, generate_password_hash")
a = 'app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False'
need(a in s, "the SQLALCHEMY_TRACK_MODIFICATIONS setting")
s = s.replace(a, a + '\napp.config["SECRET_KEY"] = "change-this-secret-key-before-real-use"')

# 2. User model + auth helpers (placed just before the HELPERS section)
auth_block = '''# ------------------------------------------------------------ USERS & AUTH
TOKEN_HOURS = 8
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin | librarian

    def to_dict(self):
        return {"id": self.id, "username": self.username,
                "full_name": self.full_name, "role": self.role}


def require_role(*roles):
    """Protect a route: caller must send a valid token with one of the roles."""
    def wrap(fn):
        @wraps(fn)
        def inner(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            if not header.startswith("Bearer "):
                return jsonify({"error": "Login required"}), 401
            try:
                data = serializer.loads(header[7:], max_age=TOKEN_HOURS * 3600)
            except BadSignature:
                return jsonify({"error": "Session expired - please log in again"}), 401
            if roles and data.get("role") not in roles:
                return jsonify({"error": "You do not have permission to do this"}), 403
            g.user = data
            return fn(*args, **kwargs)
        return inner
    return wrap


def seed_users():
    """Creates two sample accounts the first time (change the passwords!)."""
    if User.query.first():
        return
    db.session.add_all([
        User(username="admin", full_name="Administrator", role="admin",
             password_hash=generate_password_hash("admin123")),
        User(username="librarian", full_name="Librarian", role="librarian",
             password_hash=generate_password_hash("librarian123")),
    ])
    db.session.commit()


'''
m = re.search(r"^# -+ HELPERS$", s, re.M)
need(m, "the HELPERS section")
s = s[:m.start()] + auth_block + s[m.start():]

# 3. login route (placed just before the BOOKS section)
login_block = '''# ------------------------------------------------------------------- LOGIN
@app.post("/api/login")
def login():
    d = request.get_json(silent=True) or {}
    user = User.query.filter_by(username=(d.get("username") or "").strip()).first()
    if not user or not check_password_hash(user.password_hash, d.get("password") or ""):
        return error("Invalid username or password", 401)
    token = serializer.dumps({"id": user.id, "role": user.role})
    return jsonify({"token": token, "user": user.to_dict()})


'''
m = re.search(r"^# -+ BOOKS$", s, re.M)
need(m, "the BOOKS section")
s = s[:m.start()] + login_block + s[m.start():]

# 4. protect the routes
STAFF = '@require_role("admin", "librarian")'
ADMIN = '@require_role("admin")'
routes = {
    '@app.post("/api/books")': ADMIN,
    '@app.put("/api/books/<int:book_id>/status")': ADMIN,
    '@app.get("/api/members")': STAFF,
    '@app.post("/api/members")': STAFF,
    '@app.post("/api/loans")': STAFF,
    '@app.get("/api/loans")': STAFF,
    '@app.post("/api/returns")': STAFF,
    '@app.get("/api/fines")': STAFF,
    '@app.post("/api/fines/<int:fine_id>/pay")': STAFF,
    '@app.get("/api/reports/overdue")': STAFF,
    '@app.get("/api/stats")': STAFF,
}
for route, deco in routes.items():
    need(route + "\n" in s, f"the route {route}")
    s = s.replace(route + "\n", route + "\n" + deco + "\n", 1)

# 5. create users at start-up
a = "    db.create_all()\n    seed()\n"
need(a in s, "the start-up block")
s = s.replace(a, a + "    seed_users()\n")

open("app.py", "w", encoding="utf-8").write(s)
print("Done. Login support added (backup saved as app.py.bak).")
