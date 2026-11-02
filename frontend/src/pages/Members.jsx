import { useEffect, useState } from "react";
import api, { errMsg } from "../api";

const empty = { reg_no: "", name: "", faculty: "", email: "", phone: "" };

export default function Members() {
  const [form, setForm] = useState(empty);
  const [members, setMembers] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () =>
    api
      .get("/members")
      .then((r) => setMembers(r.data))
      .catch((e) => setMsg({ type: "danger", text: errMsg(e) }));

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/members", form);
      setMsg({ type: "success", text: `Registered ${data.name}.` });
      setForm(empty);
      load();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  const field = (name, label, required = false) => (
    <div className="col-md-4">
      <label className="form-label">{label}</label>
      <input
        className="form-control"
        name={name}
        value={form[name]}
        onChange={change}
        required={required}
      />
    </div>
  );

  return (
    <>
      <h3 className="mb-3">Members</h3>
      <form onSubmit={submit} className="row g-3 mb-3">
        {field("reg_no", "Registration / staff no. *", true)}
        {field("name", "Full name *", true)}
        {field("faculty", "Faculty")}
        {field("email", "Email")}
        {field("phone", "Phone")}
        <div className="col-12">
          <button className="btn btn-primary" type="submit">
            Register member
          </button>
        </div>
      </form>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Reg No</th>
            <th>Name</th>
            <th>Faculty</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.reg_no}</td>
              <td>{m.name}</td>
              <td>{m.faculty}</td>
              <td>{m.email}</td>
              <td>{m.phone}</td>
              <td>{m.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
