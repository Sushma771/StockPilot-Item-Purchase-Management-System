export default function StatCard({ icon, label, value, hint, tone = "" }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-top"><div className="stat-icon">{icon}</div><span>{hint}</span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
