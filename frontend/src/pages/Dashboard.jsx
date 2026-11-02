import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

const cards = [
  ["total_books", "Total books", "primary"],
  ["available", "Available", "success"],
  ["on_loan", "On loan", "warning"],
  ["missing", "Missing", "danger"],
  ["members", "Members", "info"],
  ["overdue", "Overdue", "danger"],
  ["unpaid_fines", "Unpaid fines (KES)", "secondary"],
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/stats")
      .then((r) => setStats(r.data))
      .catch((e) => setError(errMsg(e)));
  }, []);

  return (
    <>
      <h3 className="mb-4">Dashboard</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {!stats && !error && <p>Loading...</p>}
      {stats && (
        <div className="row g-3">
          {cards.map(([key, label, colour]) => (
            <div className="col-6 col-lg-3" key={key}>
              <div className={`card border-${colour}`}>
                <div className="card-body">
                  <div className="text-muted small">{label}</div>
                  <div className="display-6">{stats[key]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
