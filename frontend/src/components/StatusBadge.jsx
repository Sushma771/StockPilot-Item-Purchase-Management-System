export default function StatusBadge({ active, availability }) {
  if (availability) {
    const cls = availability === "In Stock" ? "success" : availability === "Low Stock" ? "warning" : "danger";
    return <span className={`badge ${cls}`}>{availability}</span>;
  }
  return <span className={`badge ${active ? "success" : "muted"}`}>{active ? "Active" : "Inactive"}</span>;
}
