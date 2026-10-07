import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Package } from "lucide-react";
import api from "../api";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";

const initial = { name:"", item_type_id:"", purchase_date:new Date().toISOString().slice(0,10), stock_available:0, active:true };

export default function ItemForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [types, setTypes] = useState([]);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/item-types"),
      edit ? api.get(`/items/${id}`) : Promise.resolve(null)
    ]).then(([t, i]) => {
      setTypes(t.data.data);
      if (i) {
        const x = i.data.data;
        setForm({name:x.name, item_type_id:String(x.item_type_id), purchase_date:x.purchase_date, stock_available:x.stock_available, active:Boolean(x.active)});
      }
    }).catch(e=>setToast({type:"error",message:e.response?.data?.message || "Could not load form."}));
  }, [id]);

  const change = e => setForm(f=>({...f,[e.target.name]:e.target.type==="checkbox"?e.target.checked:e.target.value}));

  const submit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {...form, stock_available:Number(form.stock_available), item_type_id:Number(form.item_type_id)};
      const r = edit ? await api.put(`/items/${id}`, payload) : await api.post("/items", payload);
      setToast({message:r.data.message});
      setTimeout(()=>navigate(edit ? `/items/${id}` : "/items"), 500);
    } catch(e) { setToast({type:"error",message:e.response?.data?.message || "Could not save item."}); }
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader eyebrow={edit ? "EDIT ITEM" : "NEW ITEM"} title={edit ? "Update item" : "Add a new item"} description="Keep item master data accurate and stock-ready." />
      <Toast toast={toast}/>
      <form className="form-layout" onSubmit={submit}>
        <div className="card form-card">
          <div className="form-section-title"><div className="form-section-icon"><Package size={20}/></div><div><h2>Item information</h2><p>Basic details used throughout the system.</p></div></div>
          <div className="form-grid">
            <label className="field full"><span>Item name <b>*</b></span><input name="name" value={form.name} onChange={change} placeholder="e.g. Wireless Keyboard" required maxLength="150"/></label>
            <label className="field"><span>Item type <b>*</b></span><select name="item_type_id" value={form.item_type_id} onChange={change} required><option value="">Select type</option>{types.map(t=><option key={t.id} value={t.id}>{t.type_name}</option>)}</select></label>
            <label className="field"><span>Purchase date <b>*</b></span><input type="date" name="purchase_date" value={form.purchase_date} onChange={change} required/></label>
            <label className="field"><span>Stock available <b>*</b></span><input type="number" min="0" step="1" name="stock_available" value={form.stock_available} onChange={change} required/></label>
          </div>
        </div>
        <div className="card form-card">
          <div className="form-section-title"><div className="form-section-icon"><Save size={20}/></div><div><h2>Availability</h2><p>Inactive items remain in history but cannot be purchased.</p></div></div>
          <label className="toggle-field"><input type="checkbox" name="active" checked={form.active} onChange={change}/><span className="toggle-ui"/><div><strong>{form.active ? "Active item" : "Inactive item"}</strong><small>{form.active ? "Available for new purchases." : "Blocked from new purchases."}</small></div></label>
        </div>
        <div className="form-actions"><Link className="button secondary" to={edit ? `/items/${id}` : "/items"}><ArrowLeft size={17}/> Cancel</Link><button className="button primary" disabled={saving}>{saving ? "Saving..." : <><Save size={17}/> {edit ? "Update item" : "Create item"}</>}</button></div>
      </form>
    </>
  );
}
