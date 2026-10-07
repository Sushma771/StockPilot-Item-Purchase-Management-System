import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, ShoppingCart, PackageCheck } from "lucide-react";
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

export default function PurchaseDetails(){
  const{id}=useParams();const[data,setData]=useState(null);const[toast,setToast]=useState(null);
  useEffect(()=>{api.get(`/purchases/${id}`).then(r=>setData(r.data.data)).catch(e=>setToast({type:"error",message:e.response?.data?.message||"Purchase not found."}))},[id]);
  if(!data)return <><Toast toast={toast}/><div className="loading-page">Loading purchase...</div></>;
  return <>
    <div className="detail-top"><Link className="back-link" to="/purchases"><ArrowLeft size={16}/> Back to purchases</Link><Link className="button secondary" to={`/purchases/${id}/edit`}><Pencil size={16}/> Edit purchase</Link></div>
    <Toast toast={toast}/>
    <div className="purchase-hero"><div className="purchase-hero-icon"><ShoppingCart size={28}/></div><div><div className="eyebrow">PURCHASE ORDER</div><h1>{data.order_id}</h1><p>Created on {data.purchase_date} · {data.items.length} line items</p></div><div className="audit-pill">Historical record</div></div>
    <div className="card">
      <div className="section-head"><div><h2>Purchased items</h2><p>Item type and current stock are loaded using SQL JOINs.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Item</th><th>Type</th><th>Purchased</th><th>Current stock</th><th>Availability</th></tr></thead><tbody>{data.items.map(i=><tr key={i.item_id}><td><div className="item-cell"><div className="mini-icon"><PackageCheck size={16}/></div><div><strong>{i.item_name}</strong><small>Item #{i.item_id}</small></div></div></td><td>{i.type_name}</td><td className="strong">{i.quantity}</td><td className="strong">{i.stock_available}</td><td><StatusBadge availability={i.availability}/></td></tr>)}</tbody></table></div>
    </div>
    <div className="history-note bottom-note"><div><strong>Purchase deletion is disabled.</strong><span>This transaction remains available for audit and stock traceability.</span></div><span className="history-lock">PROTECTED</span></div>
  </>;
}
