import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import StatusBadge from "../components/StatusBadge";

const empty = {
  barcode: "",
  title: "",
  author: "",
  isbn: "",
  category: "",
  shelf_location: "",
};

export default function Books() {
  const [form, setForm] = useState(empty);
  const [books, setBooks] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () =>
    api
      .get("/books")
      .then((r) => setBooks(r.data))
      .catch((e) => setMsg({ type: "danger", text: errMsg(e) }));

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/books", form);
      setMsg({ type: "success", text: `Added "${data.title}".` });
      setForm(empty);
      load();
    } catch (err) {
      setMsg({ type: "danger", text: errMsg(err) });
    }
  };

  const setStatus = async (book, status) => {
    try {
      await api.put(`/books/${book.id}/status`, { status });
      setMsg({ type: "success", text: `"${book.title}" marked ${status}.` });
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
      <h3 className="mb-3">Books</h3>
      <form onSubmit={submit} className="row g-3 mb-3">
        {field("barcode", "Barcode *", true)}
        {field("title", "Title *", true)}
        {field("author", "Author *", true)}
        {field("isbn", "ISBN")}
        {field("category", "Category")}
        {field("shelf_location", "Shelf location")}
        <div className="col-12">
          <button className="btn btn-primary" type="submit">
            Add book
          </button>
        </div>
      </form>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Barcode</th>
            <th>Title</th>
            <th>Author</th>
            <th>Category</th>
            <th>Shelf</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id}>
              <td>{b.barcode}</td>
              <td>{b.title}</td>
              <td>{b.author}</td>
              <td>{b.category}</td>
              <td>{b.shelf_location}</td>
              <td>
                <StatusBadge status={b.status} />
              </td>
              <td>
                {b.status === "Available" && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setStatus(b, "Missing")}
                  >
                    Mark missing
                  </button>
                )}
                {b.status === "Missing" && (
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => setStatus(b, "Available")}
                  >
                    Mark found
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
