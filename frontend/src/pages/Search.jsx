import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Search() {
  const [q, setQ] = useState("");
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");

  // Search 300 ms after the user stops typing; empty box shows every book
  useEffect(() => {
    const t = setTimeout(() => {
      const url = q.trim() ? `/books/search?q=${encodeURIComponent(q.trim())}` : "/books";
      api
        .get(url)
        .then((r) => {
          setBooks(r.data);
          setError("");
        })
        .catch((e) => setError(errMsg(e)));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <h3 className="mb-3">Search Catalogue</h3>
      <input
        className="form-control mb-3"
        style={{ maxWidth: 480 }}
        placeholder="Search by title, author, ISBN or barcode"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {error && <div className="alert alert-danger">{error}</div>}
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Barcode</th>
            <th>Title</th>
            <th>Author</th>
            <th>Shelf</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id}>
              <td>{b.barcode}</td>
              <td>{b.title}</td>
              <td>{b.author}</td>
              <td>{b.shelf_location}</td>
              <td>
                <StatusBadge status={b.status} />
              </td>
            </tr>
          ))}
          {books.length === 0 && !error && (
            <tr>
              <td colSpan="5" className="text-center text-muted">
                No books found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
