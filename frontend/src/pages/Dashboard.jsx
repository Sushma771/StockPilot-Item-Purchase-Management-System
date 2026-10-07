import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package, ShoppingCart, Tags, AlertTriangle, TrendingUp, Warehouse, Plus } from "lucide-react";
import api from "../api";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [toast, setToast] = useState(null);

  const load = async () => {
    try {
      const [s, i, p] = await Promise.all([
        api.get("/items/stats"), api.get("/items"), api.get("/purchases")
      ]);
      setStats(s.data.data); setItems(i.data.data.slice(0, 5)); setPurchases(p.data.data.slice(0, 5));
    } catch (e) {
      setToast({type:"error", message: e.response?.data?.message || "Could not load dashboard."});
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader
        eyebrow="OVERVIEW"
        title="Good morning, Manager."
        description="Monitor your inventory, stock health and purchase activity from one place."
        action={<Link className="button primary" to="/purchases/new"><Plus size={18}/> New Purchase</Link>}
      />

      <Toast toast={toast}/>

      <div className="stats-grid">
        <StatCard icon={<Package/>} label="Total Items" value={stats?.totalItems ?? "—"} hint="All items" />
        <StatCard icon={<Warehouse/>} label="Total Stock" value={stats?.totalStock ?? "—"} hint="Units available" tone="blue" />
        <StatCard icon={<ShoppingCart/>} label="Purchases" value={stats?.totalPurchases ?? "—"} hint="Historical orders" tone="purple" />
        <StatCard icon={<AlertTriangle/>} label="Low / Out" value={`${(stats?.lowStock ?? 0) + (stats?.outOfStock ?? 0)}`} hint="Need attention" tone="orange" />
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="section-head"><div><h2>Inventory snapshot</h2><p>Latest items in your catalog</p></div><Link to="/items" className="text-link">View all <ArrowRight size={15}/></Link></div>
          <div className="table-wrap">
            <table><thead><tr><th>Item</th><th>Type</th><th>Stock</th><th>Status</th></tr></thead>
            <tbody>
              {items.length ? items.map(i => <tr key={i.id}>
                <td><Link className="table-primary" to={`/items/${i.id}`}>{i.name}</Link><small>#{String(i.id).padStart(4,"0")}</small></td>
                <td>{i.type_name}</td><td className="number">{i.stock_available}</td><td><StatusBadge availability={i.availability}/></td>
              </tr>) : <tr><td colSpan="4" className="empty-cell">No items yet.</td></tr>}
            </tbody></table>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><div><h2>Recent purchases</h2><p>Latest order activity</p></div><Link to="/purchases" className="text-link">View all <ArrowRight size={15}/></Link></div>
          <div className="activity-list">
            {purchases.length ? purchases.map(p => (
              <Link to={`/purchases/${p.id}`} className="activity-row" key={p.id}>
                <div className="activity-icon"><ShoppingCart size={17}/></div>
                <div><strong>{p.order_id}</strong><span>{p.purchase_date} · {p.item_count} items</span></div>
                <ArrowRight size={16}/>
              </Link>
            )) : <div className="empty-state">No purchases yet.</div>}
          </div>
        </section>
      </div>

      <div className="insight-banner">
        <div className="insight-icon"><TrendingUp size={22}/></div>
        <div><strong>Stock integrity is protected</strong><p>Purchases use database transactions and row locking so stock cannot become negative during concurrent orders.</p></div>
        <Link to="/stock" className="button ghost">Check stock</Link>
      </div>
    </>
  );
}
