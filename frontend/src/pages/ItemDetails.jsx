import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Power, Package, CalendarDays, Boxes, Tag } from "lucide-react";
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import Toast from "../components/Toast";

export default function ItemDetails() {
  const {id}=useParams(); const [item,setItem]=useState(null); const [toast,setToast]=useState(null);
  const load=()=>api.get(`/items/${id}`).then(r=>setItem(r.data.data)).catch(e=>setToast({type:"error",message:e.response?.data?.message||"Item not found."}));
  useEffect(load,[id]);
  const toggle=async()=>{try{const r=await api.patch(`/items/${id}/toggle`);setToast({message:r.data.message});load()}catch(e){setToast({type:"error",message:e.response?.data?.message})}};
  if(!item) return <div className="loading-page">Loading item...</div>;
  return <>
    <div className="detail-top"><Link className="back-link" to="/items"><ArrowLeft size={16}/> Back to items</Link><div className="detail-actions"><Link className="button secondary" to={`/items/${id}/edit`}><Pencil size={16}/> Edit</Link><button className="button secondary" onClick={toggle}><Power size={16}/> {item.active?"Deactivate":"Activate"}</button></div></div>
    <Toast toast={toast}/>
    <div className="detail-hero">
      <div className="detail-icon"><Package size={32}/></div><div><div className="eyebrow">ITEM #{String(item.id).padStart(4,"0")}</div><h1>{item.name}</h1><div className="detail-badges"><StatusBadge active={item.active}/><StatusBadge availability={item.availability}/></div></div>
    </div>
    <div className="detail-grid">
      <div className="card"><h2>Item overview</h2><div className="info-grid">
        <div><span>Item type</span><strong><Tag size={15}/>{item.type_name}</strong></div>
        <div><span>Purchase date</span><strong><CalendarDays size={15}/>{item.purchase_date}</strong></div>
        <div><span>Current stock</span><strong><Boxes size={15}/>{item.stock_available} units</strong></div>
        <div><span>Availability</span><strong>{item.availability}</strong></div>
      </div></div>
      <div className="card accent-card"><div className="big-stock">{item.stock_available}</div><span>Units currently available</span><p>{item.stock_available===0?"Restock required.":item.stock_available<=5?"Low stock — consider restocking soon.":"Healthy stock level."}</p></div>
    </div>
  </>;
}
