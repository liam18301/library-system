import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import IssueBook from "./pages/IssueBook";
import ReturnBook from "./pages/ReturnBook";
import Books from "./pages/Books";
import Members from "./pages/Members";
import Fines from "./pages/Fines";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="search" element={<Search />} />
        <Route path="issue" element={<IssueBook />} />
        <Route path="return" element={<ReturnBook />} />
        <Route
          path="books"
          element={
            <RequireAuth roles={["admin"]}>
              <Books />
            </RequireAuth>
          }
        />
        <Route path="members" element={<Members />} />
        <Route path="fines" element={<Fines />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
