import { useEffect, useMemo, useState } from "react";
import { Search, Warehouse, AlertTriangle, PackageCheck } from "lucide-react";
import api from "../api";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/StatCard";
import Toast from "../components/Toast";

export default function Stock(){
  const[items,setItems]=useState([]);const[search,setSearch]=useState("");const[filter,setFilter]=useState("all");const[toast,setToast]=useState(null);
  const load=()=>api.get("/items").then(r=>setItems(r.data.data)).catch(e=>setToast({type:"error",message:e.response?.data?.message||"Could not load stock."}));
  useEffect(load,[]);
  const filtered=useMemo(()=>items.filter(i=>(!search||`${i.name} ${i.type_name}`.toLowerCase().includes(search.toLowerCase()))&&(filter==="all"||i.availability===filter)),[items,search,filter]);
  const low=items.filter(i=>i.stock_available>0&&i.stock_available<=5).length,out=items.filter(i=>i.stock_available===0).length,total=items.reduce((s,i)=>s+Number(i.stock_available),0);
  return <>
    <PageHeader eyebrow="INVENTORY HEALTH" title="Stock & Availability" description="A live view of current stock levels and items needing attention."/>
    <Toast toast={toast}/>
    <div className="stats-grid three"><StatCard icon={<Warehouse/>} label="Total units" value={total} hint="Across all items" tone="blue"/><StatCard icon={<AlertTriangle/>} label="Low stock" value={low} hint="1–5 units" tone="orange"/><StatCard icon={<PackageCheck/>} label="Out of stock" value={out} hint="0 units" tone="red"/></div>
    <div className="card"><div className="filter-bar"><div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search inventory..."/></div><select className="filter-plain" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All availability</option><option value="In Stock">In Stock</option><option value="Low Stock">Low Stock</option><option value="Out of Stock">Out of Stock</option></select></div>
      <div className="stock-grid">{filtered.map(i=><div className={`stock-card ${i.availability.toLowerCase().replaceAll(" ","-")}`} key={i.id}><div className="stock-card-head"><div className="mini-icon"><PackageCheck size={17}/></div><StatusBadge availability={i.availability}/></div><strong>{i.name}</strong><span>{i.type_name}</span><div className="stock-number">{i.stock_available}<small> units</small></div><div className="stock-bar"><i style={{width:`${Math.min(100, i.stock_available*10)}%`}}/></div></div>)}</div>
      {!filtered.length&&<div className="empty-state">No stock records match your filters.</div>}
    </div>
  </>;
}
