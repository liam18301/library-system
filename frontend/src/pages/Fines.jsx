import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () =>
    api
      .get("/fines")
      .then((r) => setFines(r.data))
      .catch((e) => setMsg({ type: "danger", text: errMsg(e) }));

  useEffect(() => {
    load();
  }, []);

  const pay = async (fine) => {
    try {
      await api.post(`/fines/${fine.id}/pay`);
      setMsg({ type: "success", text: `Fine of KES ${fine.amount} for ${fine.member} marked as paid.` });
      load();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  const unpaidTotal = fines
    .filter((f) => !f.paid)
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <>
      <h3 className="mb-3">Fines</h3>
      <p>
        Total unpaid: <strong>KES {unpaidTotal}</strong>
      </p>
      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Member</th>
            <th>Book</th>
            <th>Amount (KES)</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {fines.map((f) => (
            <tr key={f.id}>
              <td>
                {f.member} ({f.reg_no})
              </td>
              <td>{f.book}</td>
              <td>{f.amount}</td>
              <td>
                <span className={`badge text-bg-${f.paid ? "success" : "danger"}`}>
                  {f.paid ? "Paid" : "Unpaid"}
                </span>
              </td>
              <td>
                {!f.paid && (
                  <button className="btn btn-sm btn-outline-primary" onClick={() => pay(f)}>
                    Mark paid
                  </button>
                )}
              </td>
            </tr>
          ))}
          {fines.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-muted">
                No fines recorded
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
