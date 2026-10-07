import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2, Power, Filter, PackageOpen } from "lucide-react";
import api from "../api";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

export default function Items() {
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("all");
  const [type, setType] = useState("all");
  const [toast, setToast] = useState(null);

  const load = async () => {
    try {
      const [i, t] = await Promise.all([api.get("/items", {params:{search, active, type}}), api.get("/item-types")]);
      setItems(i.data.data); setTypes(t.data.data);
    } catch(e) { setToast({type:"error", message:e.response?.data?.message || "Could not load items."}); }
  };

  useEffect(() => { load(); }, [search, active, type]);

  const toggle = async id => {
    try { const r = await api.patch(`/items/${id}/toggle`); setToast({message:r.data.message}); load(); }
    catch(e) { setToast({type:"error", message:e.response?.data?.message || "Action failed."}); }
  };

  const remove = async id => {
    if (!window.confirm("Delete this item? Items with purchase history cannot be deleted.")) return;
    try { const r = await api.delete(`/items/${id}`); setToast({message:r.data.message}); load(); }
    catch(e) { setToast({type:"error", message:e.response?.data?.message || "Could not delete item."}); }
  };

  return (
    <>
      <PageHeader eyebrow="CATALOG" title="Items" description="Create, update and manage your item master." action={<Link className="button primary" to="/items/new"><Plus size={18}/> Add Item</Link>} />
      <Toast toast={toast}/>
      <div className="card">
        <div className="filter-bar">
          <div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items or types..." /></div>
          <div className="filter-select"><Filter size={16}/><select value={type} onChange={e=>setType(e.target.value)}><option value="all">All types</option>{types.map(t=><option key={t.id} value={t.id}>{t.type_name}</option>)}</select></div>
          <select className="filter-plain" value={active} onChange={e=>setActive(e.target.value)}><option value="all">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Type</th><th>Purchase date</th><th>Stock</th><th>Availability</th><th>Status</th><th className="align-right">Actions</th></tr></thead>
            <tbody>
              {items.map(i => <tr key={i.id}>
                <td><div className="item-cell"><div className="mini-icon"><PackageOpen size={17}/></div><div><Link className="table-primary" to={`/items/${i.id}`}>{i.name}</Link><small>ID #{i.id}</small></div></div></td>
                <td>{i.type_name}</td><td>{i.purchase_date}</td><td className="number strong">{i.stock_available}</td><td><StatusBadge availability={i.availability}/></td><td><StatusBadge active={i.active}/></td>
                <td><div className="row-actions">
                  <Link className="action-btn" title="View" to={`/items/${i.id}`}><Eye size={16}/></Link>
                  <Link className="action-btn" title="Edit" to={`/items/${i.id}/edit`}><Pencil size={16}/></Link>
                  <button className="action-btn" title={i.active ? "Deactivate":"Activate"} onClick={()=>toggle(i.id)}><Power size={16}/></button>
                  <button className="action-btn danger-action" title="Delete" onClick={()=>remove(i.id)}><Trash2 size={16}/></button>
                </div></td>
              </tr>)}
              {!items.length && <tr><td colSpan="7" className="empty-cell">No items match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
