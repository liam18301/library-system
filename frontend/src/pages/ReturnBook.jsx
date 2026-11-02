import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function ReturnBook() {
  const [barcode, setBarcode] = useState("");
  const [msg, setMsg] = useState(null); // { type, text }
  const [loans, setLoans] = useState([]);

  const loadLoans = () =>
    api
      .get("/loans")
      .then((r) => setLoans(r.data))
      .catch(() => {});

  useEffect(() => {
    loadLoans();
  }, []);

  const doReturn = async (code) => {
    try {
      const { data } = await api.post("/returns", { barcode: code.trim() });
      if (data.fine > 0) {
        setMsg({
          type: "warning",
          text: `"${data.book}" was returned late. Fine: KES ${data.fine}.`,
        });
      } else {
        setMsg({ type: "success", text: `"${data.book}" returned on time. No fine.` });
      }
      setBarcode("");
      loadLoans();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  const submit = (e) => {
    e.preventDefault();
    doReturn(barcode);
  };

  return (
    <>
      <h3 className="mb-3">Return Book</h3>
      <form onSubmit={submit} style={{ maxWidth: 480 }}>
        <div className="mb-3">
          <label className="form-label">Book barcode</label>
          <input
            className="form-control"
            placeholder="e.g. B0001"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            required
            autoFocus
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Return
        </button>
      </form>

      {msg && <div className={`alert alert-${msg.type} mt-3`}>{msg.text}</div>}

      <h5 className="mt-4">Books currently on loan</h5>
      <table className="table table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th>Barcode</th>
            <th>Book</th>
            <th>Member</th>
            <th>Due</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loans.map((l) => (
            <tr key={l.id} className={l.overdue ? "table-danger" : ""}>
              <td>{l.barcode}</td>
              <td>{l.book}</td>
              <td>
                {l.member} ({l.reg_no})
              </td>
              <td>{l.due_date}</td>
              <td>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => doReturn(l.barcode)}
                >
                  Return
                </button>
              </td>
            </tr>
          ))}
          {loans.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-muted">
                No books are on loan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
