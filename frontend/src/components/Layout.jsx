import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, getUser } from "../auth";

// [path, label, roles allowed to see it (omit = everyone logged in)]
const links = [
  ["/", "Dashboard"],
  ["/search", "Search Catalogue"],
  ["/issue", "Issue Book"],
  ["/return", "Return Book"],
  ["/books", "Books", ["admin"]],
  ["/members", "Members"],
  ["/fines", "Fines"],
  ["/reports", "Overdue Report"],
];

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-dark px-3" style={{ background: "#1F3864" }}>
        <span className="navbar-brand mb-0 h5">
          Library Book Tracking and Circulation System
        </span>
        <div className="text-white d-flex align-items-center gap-3">
          <span>
            {user?.full_name} ({user?.role})
          </span>
          <button className="btn btn-sm btn-outline-light" onClick={logout}>
            Log out
          </button>
        </div>
      </nav>
      <div className="d-flex flex-grow-1">
        <aside className="p-3 border-end bg-light" style={{ width: 220 }}>
          <div className="nav nav-pills flex-column gap-1">
            {links
              .filter(([, , roles]) => !roles || roles.includes(user?.role))
              .map(([to, label]) => (
                <NavLink key={to} to={to} end={to === "/"} className="nav-link">
                  {label}
                </NavLink>
              ))}
          </div>
        </aside>
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
