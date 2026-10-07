import { X } from "lucide-react";

export default function Modal({ open, title, children, onClose, width = "520px" }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{maxWidth: width}} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-button" onClick={onClose}><X size={19}/></button></div>
        {children}
      </div>
    </div>
  );
}
