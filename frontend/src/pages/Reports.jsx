import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function Reports() {
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reports/overdue")
      .then((r) => setLoans(r.data))
      .catch((e) => setError(errMsg(e)));
  }, []);

  return (
    <>
      <h3 className="mb-3">Overdue Report</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Member</th>
            <th>Book</th>
            <th>Barcode</th>
            <th>Due date</th>
            <th>Days overdue</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((l) => (
            <tr key={l.id}>
              <td>
                {l.member} ({l.reg_no})
              </td>
              <td>{l.book}</td>
              <td>{l.barcode}</td>
              <td>{l.due_date}</td>
              <td>
                <span className="badge text-bg-danger">{l.days_overdue}</span>
              </td>
            </tr>
          ))}
          {loans.length === 0 && !error && (
            <tr>
              <td colSpan="5" className="text-center text-muted">
                No overdue books
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
