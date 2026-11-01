# Library Management System

A library book tracking and circulation system with a Flask REST API and a React/Vite web interface.

The application supports:

- Book catalog management, searching, and stock status tracking
- Member registration
- Book issue and return workflows
- Automatic overdue-fine calculation in KES
- Fine payment tracking
- Dashboard statistics and overdue reports
- Role-based access for administrators and librarians

## Technology stack

- **Backend:** Python, Flask, Flask-SQLAlchemy, SQLite, Flask-CORS
- **Frontend:** React, React Router, Axios, Bootstrap, Vite
- **Authentication:** Signed, time-limited bearer tokens

## Project structure

```text
library_system/
├── backend/
│   ├── app.py              # Flask API and database models
│   ├── run_tests.py        # API test suite
│   ├── instance/
│   │   └── library.db      # SQLite database
│   └── venv/               # Local Python virtual environment, if present
├── frontend/
│   ├── src/                # React application
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prerequisites

- Python 3.12 or a compatible recent Python 3 release
- Node.js 20 or later
- npm

## Backend setup

Open a terminal in the `backend` directory:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

On Windows PowerShell, activate the environment with:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install Flask Flask-Cors Flask-SQLAlchemy itsdangerous Werkzeug
```

Start the API:

```bash
python app.py
```

The API will be available at <http://localhost:5000>.

On first startup, the application creates the SQLite database tables and inserts sample books, members, and user accounts. The database is stored at `backend/instance/library.db`.

## Frontend setup

In a second terminal, open the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>.

The frontend expects the backend API at:

```text
http://localhost:5000/api
```

Start the backend before using the frontend. The frontend and backend are configured for local development and CORS is enabled by the Flask application.

## Sample accounts

The first backend startup creates these accounts:

| Username | Password | Role | Permissions |
|---|---|---|---|
| `admin` | `admin123` | Administrator | All librarian functions plus book management and stock status changes |
| `librarian` | `librarian123` | Librarian | Search, member registration, circulation, fines, and reports |

These are development credentials only. Change or remove the seeded accounts and replace the Flask `SECRET_KEY` before deploying this application.

## Circulation rules

- Books are loaned for **14 days**.
- A member may have at most **3 active loans**.
- The overdue fine is **KES 10 per day**.
- A member with an unpaid fine cannot borrow another book.
- Only books with status `Available` can be issued.
- A book on loan cannot be marked as `Missing`.
- Only administrators can add books or change book stock status.

## API overview

All API routes are under `/api`.

### Public endpoint

- `POST /api/login`

### Book endpoints

- `GET /api/books`
- `GET /api/books/search?q=<term>`
- `POST /api/books` — administrator only
- `PUT /api/books/<book_id>/status` — administrator only

### Member endpoints

- `GET /api/members`
- `POST /api/members`

### Circulation endpoints

- `POST /api/loans`
- `POST /api/returns`
- `GET /api/loans?status=active|all`

### Fine and reporting endpoints

- `GET /api/fines`
- `POST /api/fines/<fine_id>/pay`
- `GET /api/reports/overdue`
- `GET /api/stats`

Protected endpoints require the token returned by `/api/login`:

```text
Authorization: Bearer <token>
```

## Running tests

Start the backend in one terminal:

```bash
cd backend
source venv/bin/activate
python app.py
```

Run the API tests in a second terminal:

```bash
cd backend
source venv/bin/activate
python run_tests.py
```

The test runner writes its output to `backend/test_results.txt`. The current recorded test run contains 25 passing tests covering authentication, book and member management, issue/return rules, fines, reports, permissions, and response time.

The tests create uniquely named sample records in the configured database. Use a separate development or test database if you need to preserve a clean data set.

## Production notes

This project is currently configured for local development:

- `app.py` runs Flask with `debug=True`.
- The default secret key is not suitable for production.
- CORS is open through `CORS(app)`.
- Sample credentials are seeded automatically.
- No production WSGI server or migration framework is configured.

Before deployment, set secrets through environment variables, disable debug mode, restrict CORS to the frontend origin, replace the sample credentials, and use a production WSGI server and database backup strategy.
