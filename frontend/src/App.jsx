import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Tags, ShoppingCart, Warehouse,
  Menu, X, ChevronRight, Boxes
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import ItemForm from "./pages/ItemForm";
import ItemDetails from "./pages/ItemDetails";
import ItemTypes from "./pages/ItemTypes";
import Purchases from "./pages/Purchases";
import PurchaseForm from "./pages/PurchaseForm";
import PurchaseDetails from "./pages/PurchaseDetails";
import Stock from "./pages/Stock";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/items", label: "Items", icon: Package },
  { to: "/item-types", label: "Item Types", icon: Tags },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/stock", label: "Stock & Availability", icon: Warehouse }
];

function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  const activeLabel = nav.find(n => n.to === location.pathname)?.label
    || (location.pathname.includes("/items/") ? "Item Details" : "")
    || (location.pathname.includes("/purchases/") ? "Purchase Details" : "")
    || "Workspace";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Boxes size={22} /></div>
          <div>
            <strong>StockPilot</strong>
            <span>Inventory Suite</span>
          </div>
          <button className="icon-button mobile-only" onClick={() => setOpen(false)}><X size={20}/></button>
        </div>

        <div className="nav-label">MAIN MENU</div>
        <nav>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={19} />
              <span>{label}</span>
              {label === "Purchases" && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="secure-card">
            <div className="secure-icon">✓</div>
            <div><strong>System Ready</strong><span>Stock-safe transactions</span></div>
          </div>
          <small>Item & Purchase Management v1.0</small>
        </div>
      </aside>

      {open && <div className="mobile-overlay" onClick={() => setOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setOpen(true)}><Menu size={22}/></button>
          <div className="breadcrumbs">
            <span>Workspace</span><ChevronRight size={15}/><strong>{activeLabel}</strong>
          </div>
          <div className="topbar-right">
            <div className="status-pill"><span className="pulse" /> API Online</div>
            <div className="avatar">SP</div>
          </div>
        </header>
        <section className="content">{children}</section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/items" element={<Items />} />
        <Route path="/items/new" element={<ItemForm />} />
        <Route path="/items/:id/edit" element={<ItemForm />} />
        <Route path="/items/:id" element={<ItemDetails />} />
        <Route path="/item-types" element={<ItemTypes />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/purchases/new" element={<PurchaseForm />} />
        <Route path="/purchases/:id/edit" element={<PurchaseForm />} />
        <Route path="/purchases/:id" element={<PurchaseDetails />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </AppShell>
  );
}
