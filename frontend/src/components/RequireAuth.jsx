import { Navigate } from "react-router-dom";
import { getUser } from "../auth";

// Wrap a page so only logged-in users (optionally with certain roles) can see it
export default function RequireAuth({ roles, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="alert alert-warning">
        You do not have permission to view this page.
      </div>
    );
  }
  return children;
}
