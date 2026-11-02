"""
Change a staff username and/or password.

Run inside the backend folder with the virtual environment active:
    python change_account.py
"""
import getpass
import sys

from werkzeug.security import generate_password_hash

from app import User, app, db


def main():
    with app.app_context():
        print("Current accounts:")
        for u in User.query.order_by(User.id).all():
            print(f"  {u.username:<15} {u.role:<10} {u.full_name}")

        current = input("\nUsername of the account to change: ").strip()
        user = User.query.filter_by(username=current).first()
        if not user:
            sys.exit("No account with that username. Nothing was changed.")

        changed = []

        new_name = input(f"New username (press Enter to keep '{user.username}'): ").strip()
        if new_name and new_name != user.username:
            if len(new_name) < 3:
                sys.exit("Username must be at least 3 characters. Nothing was changed.")
            if User.query.filter_by(username=new_name).first():
                sys.exit("That username is already taken. Nothing was changed.")
            user.username = new_name
            changed.append("username")

        pw = getpass.getpass("New password (press Enter to keep the old one): ")
        if pw:
            if len(pw) < 6:
                sys.exit("Password must be at least 6 characters. Nothing was changed.")
            if pw != getpass.getpass("Type the new password again: "):
                sys.exit("The passwords do not match. Nothing was changed.")
            user.password_hash = generate_password_hash(pw)
            changed.append("password")

        if not changed:
            sys.exit("You did not enter anything new. Nothing was changed.")

        db.session.commit()
        print(f"\nDone. Updated the {' and '.join(changed)} for '{user.username}'.")


if __name__ == "__main__":
    main()
