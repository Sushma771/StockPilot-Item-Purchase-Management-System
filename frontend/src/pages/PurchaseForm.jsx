import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ShoppingCart, Save, PackageCheck } from "lucide-react";
import api from "../api";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";

export default function PurchaseForm(){
  const {id}=useParams();const edit=Boolean(id);const navigate=useNavigate();
  const [items,setItems]=useState([]);const[date,setDate]=useState(new Date().toISOString().slice(0,10));const[lines,setLines]=useState([]);const[selected,setSelected]=useState("");const[qty,setQty]=useState(1);const[toast,setToast]=useState(null);const[saving,setSaving]=useState(false);const[orderId,setOrderId]=useState("");

  useEffect(()=>{Promise.all([api.get("/items"),edit?api.get(`/purchases/${id}`):Promise.resolve(null)]).then(([i,p])=>{setItems(i.data.data);if(p){setDate(p.data.data.purchase_date);setOrderId(p.data.data.order_id);setLines(p.data.data.items.map(x=>({item_id:x.item_id,quantity:x.quantity})))}}).catch(e=>setToast({type:"error",message:e.response?.data?.message||"Could not load purchase."}))},[id]);

  const activeItems=useMemo(()=>items.filter(i=>i.active),[items]);
  const availableOptions=activeItems.filter(i=>!lines.some(l=>l.item_id===i.id));
  const addLine=()=>{const item=items.find(i=>i.id===Number(selected));if(!item)return;if(Number(qty)<=0||Number(qty)>item.stock_available){setToast({type:"error",message:`Quantity must be between 1 and ${item.stock_available} for ${item.name}.`});return}setLines(l=>[...l,{item_id:item.id,quantity:Number(qty)}]);setSelected("");setQty(1)};
  const removeLine=itemId=>setLines(l=>l.filter(x=>x.item_id!==itemId));
  const updateQty=(itemId,value)=>setLines(l=>l.map(x=>x.item_id===itemId?{...x,quantity:Number(value)}:x));
  const getItem=id=>items.find(i=>i.id===id);

  const submit=async e=>{e.preventDefault();if(!lines.length)return setToast({type:"error",message:"Add at least one item to the purchase."});setSaving(true);try{const payload={purchase_date:date,items:lines};const r=edit?await api.put(`/purchases/${id}`,payload):await api.post("/purchases",payload);setToast({message:r.data.message});setTimeout(()=>navigate(`/purchases/${r.data.data.id}`),500)}catch(e){setToast({type:"error",message:e.response?.data?.message||"Could not save purchase."})}finally{setSaving(false)}};

  return <>
    <PageHeader eyebrow={edit?"EDIT PURCHASE":"NEW PURCHASE"} title={edit?`Update ${orderId}`:"Create purchase"} description="Build one order with multiple active items. Stock is adjusted atomically on submit."/>
    <Toast toast={toast}/>
    <form onSubmit={submit}>
      <div className="purchase-layout">
        <div className="card">
          <div className="form-section-title"><div className="form-section-icon"><ShoppingCart size={20}/></div><div><h2>Purchase information</h2><p>{edit?`Editing ${orderId}`:"Order ID is generated automatically."}</p></div></div>
          <div className="form-grid"><label className="field"><span>Purchase date <b>*</b></span><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label>{edit&&<label className="field"><span>Order ID</span><input value={orderId} disabled/></label>}</div>
        </div>

        <div className="card">
          <div className="section-head"><div><h2>Add items</h2><p>Only active items are available for new purchases.</p></div><div className="stock-hint"><PackageCheck size={16}/> Stock protected</div></div>
          <div className="add-line">
            <select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select active item</option>{availableOptions.map(i=><option key={i.id} value={i.id}>{i.name} — {i.stock_available} available</option>)}</select>
            <input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} />
            <button type="button" className="button secondary" onClick={addLine}><Plus size={17}/> Add</button>
          </div>

          <div className="purchase-lines">
            {lines.map(line=>{const item=getItem(line.item_id);return <div className="purchase-line" key={line.item_id}><div className="line-icon"><PackageCheck size={17}/></div><div className="line-main"><strong>{item?.name||"Item"}</strong><span>{item?.type_name} · {item?.stock_available} currently available</span></div><input type="number" min="1" value={line.quantity} onChange={e=>updateQty(line.item_id,e.target.value)}/><button type="button" className="icon-button danger-icon" onClick={()=>removeLine(line.item_id)}><Trash2 size={17}/></button></div>})}
            {!lines.length&&<div className="empty-state big-empty"><ShoppingCart size={28}/><strong>No items in this order</strong><span>Select an active item above to start.</span></div>}
          </div>
        </div>
      </div>
      <div className="form-actions"><Link className="button secondary" to="/purchases"><ArrowLeft size={17}/> Cancel</Link><button className="button primary" disabled={saving}>{saving?"Processing...":<><Save size={17}/>{edit?"Update purchase":"Submit purchase"}</>}</button></div>
    </form>
  </>;
}
