import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errMsg } from "../api";
import { saveSession } from "../auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/login", { username, password });
      saveSession(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: 380 }}>
        <div className="card-header text-white" style={{ background: "#1F3864" }}>
          Library Book Tracking and Circulation System
        </div>
        <form className="card-body" onSubmit={submit}>
          <h5 className="mb-3">Staff login</h5>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary w-100" type="submit">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
