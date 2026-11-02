const colours = { Available: "success", "On loan": "warning", Missing: "danger" };

export default function StatusBadge({ status }) {
  return (
    <span className={`badge text-bg-${colours[status] || "secondary"}`}>
      {status}
    </span>
  );
}
