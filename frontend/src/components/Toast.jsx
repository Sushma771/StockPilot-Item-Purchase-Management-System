export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type || "success"}`}>
      <span className="toast-check">{toast.type === "error" ? "!" : "✓"}</span>
      <div><strong>{toast.title || (toast.type === "error" ? "Error" : "Success")}</strong><p>{toast.message}</p></div>
    </div>
  );
}
