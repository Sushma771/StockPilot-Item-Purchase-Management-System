import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Pencil, ShoppingCart } from "lucide-react";
import api from "../api";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";

export default function Purchases(){
  const [rows,setRows]=useState([]);const[toast,setToast]=useState(null);
  const load=()=>api.get("/purchases").then(r=>setRows(r.data.data)).catch(e=>setToast({type:"error",message:e.response?.data?.message||"Could not load purchases."}));
  useEffect(load,[]);
  return <>
    <PageHeader eyebrow="TRANSACTIONS" title="Purchases" description="Historical orders remain available for traceability and audit." action={<Link className="button primary" to="/purchases/new"><Plus size={18}/> New Purchase</Link>}/>
    <Toast toast={toast}/>
    <div className="card">
      <div className="history-note"><div><strong>Purchase history is immutable by deletion.</strong><span>Orders can be updated, but never deleted.</span></div><span className="history-lock">AUDIT SAFE</span></div>
      <div className="table-wrap"><table><thead><tr><th>Order ID</th><th>Purchase date</th><th>Line items</th><th>Total quantity</th><th>Created</th><th className="align-right">Actions</th></tr></thead><tbody>
        {rows.map(p=><tr key={p.id}><td><Link className="order-id" to={`/purchases/${p.id}`}><span className="order-icon"><ShoppingCart size={15}/></span>{p.order_id}</Link></td><td>{p.purchase_date}</td><td>{p.item_count}</td><td className="strong">{p.total_quantity}</td><td>{p.created_at}</td><td><div className="row-actions"><Link className="action-btn" to={`/purchases/${p.id}`}><Eye size={16}/></Link><Link className="action-btn" to={`/purchases/${p.id}/edit`}><Pencil size={16}/></Link></div></td></tr>)}
        {!rows.length&&<tr><td colSpan="6" className="empty-cell">No purchase history yet.</td></tr>}
      </tbody></table></div>
    </div>
  </>;
}
