import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import api from "../api";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import Toast from "../components/Toast";

export default function ItemTypes(){
  const [types,setTypes]=useState([]); const [open,setOpen]=useState(false); const [editing,setEditing]=useState(null); const [name,setName]=useState(""); const [toast,setToast]=useState(null);
  const load=()=>api.get("/item-types").then(r=>setTypes(r.data.data)).catch(e=>setToast({type:"error",message:e.response?.data?.message||"Could not load item types."}));
  useEffect(load,[]);
  const save=async e=>{e.preventDefault();try{const r=editing?await api.put(`/item-types/${editing.id}`,{type_name:name}):await api.post("/item-types",{type_name:name});setToast({message:r.data.message});setOpen(false);setName("");setEditing(null);load()}catch(e){setToast({type:"error",message:e.response?.data?.message||"Could not save type."})}};
  const remove=async id=>{if(!confirm("Delete this item type?"))return;try{const r=await api.delete(`/item-types/${id}`);setToast({message:r.data.message});load()}catch(e){setToast({type:"error",message:e.response?.data?.message||"Cannot delete this type."})}};
  return <>
    <PageHeader eyebrow="CONFIGURATION" title="Item Types" description="Organize inventory with clean, reusable categories." action={<button className="button primary" onClick={()=>{setEditing(null);setName("");setOpen(true)}}><Plus size={18}/> Add Type</button>}/>
    <Toast toast={toast}/>
    <div className="type-grid">{types.map(t=><div className="type-card" key={t.id}><div className="type-icon"><Tags size={19}/></div><div className="type-content"><strong>{t.type_name}</strong><small>Type ID #{t.id}</small></div><div className="row-actions"><button className="action-btn" onClick={()=>{setEditing(t);setName(t.type_name);setOpen(true)}}><Pencil size={15}/></button><button className="action-btn danger-action" onClick={()=>remove(t.id)}><Trash2 size={15}/></button></div></div>)}</div>
    <Modal open={open} title={editing?"Edit item type":"Create item type"} onClose={()=>setOpen(false)}>
      <form onSubmit={save}><label className="field"><span>Type name <b>*</b></span><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Electronics" required autoFocus/></label><div className="modal-actions"><button type="button" className="button secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="button primary">{editing?"Update":"Create"} type</button></div></form>
    </Modal>
  </>;
}
