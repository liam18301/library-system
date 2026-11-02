import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function IssueBook() {
  const [regNo, setRegNo] = useState("");
  const [barcode, setBarcode] = useState("");
  const [msg, setMsg] = useState(null); // { type: "success" | "danger", text }
  const [loans, setLoans] = useState([]);

  const loadLoans = () =>
    api
      .get("/loans")
      .then((r) => setLoans(r.data))
      .catch(() => {});

  useEffect(() => {
    loadLoans();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/loans", {
        reg_no: regNo.trim(),
        barcode: barcode.trim(),
      });
      setMsg({
        type: "success",
        text: `Issued "${data.book}" to ${data.member}. Due on ${data.due_date}.`,
      });
      setBarcode("");
      loadLoans();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  const clear = () => {
    setRegNo("");
    setBarcode("");
    setMsg(null);
  };

  return (
    <>
      <h3 className="mb-3">Issue Book</h3>
      <form onSubmit={submit} style={{ maxWidth: 480 }}>
        <div className="mb-3">
          <label className="form-label">Member ID / Reg No</label>
          <input
            className="form-control"
            placeholder="e.g. 19/00001"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Book barcode</label>
          <input
            className="form-control"
            placeholder="e.g. B0001"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            required
          />
        </div>
        <p className="text-muted small">
          Issue date and due date are set automatically.
        </p>
        <button className="btn btn-primary me-2" type="submit">
          Issue
        </button>
        <button className="btn btn-outline-secondary" type="button" onClick={clear}>
          Clear
        </button>
      </form>

      {msg && <div className={`alert alert-${msg.type} mt-3`}>{msg.text}</div>}

      <h5 className="mt-4">Books currently on loan</h5>
      <table className="table table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th>Member</th>
            <th>Book</th>
            <th>Issued</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((l) => (
            <tr key={l.id} className={l.overdue ? "table-danger" : ""}>
              <td>
                {l.member} ({l.reg_no})
              </td>
              <td>{l.book}</td>
              <td>{l.issue_date}</td>
              <td>{l.due_date}</td>
            </tr>
          ))}
          {loans.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                No books are on loan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
