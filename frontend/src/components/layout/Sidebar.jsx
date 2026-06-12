import {
  BarChart3,
  Boxes,
  Crown,
  FileBarChart,
  ReceiptText,
  Settings,
  Truck,
  UsersRound,
  X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const navItems = [
  { label: "Dashboard", icon: BarChart3, to: "/dashboard" },
  { label: "Admin Panel", icon: Crown, to: "/admin", admin: true },
  { label: "Billing", icon: ReceiptText, to: "/billing" },
  { label: "Products", icon: Boxes, to: "/products" },
  { label: "Customers", icon: UsersRound, to: "/customers" },
  { label: "Inventory", icon: Boxes, to: "/inventory", admin: true },
  { label: "Suppliers", icon: Truck, to: "/suppliers", admin: true },
  { label: "Reports", icon: FileBarChart, to: "/reports", admin: true },
  { label: "Settings", icon: Settings, to: "/settings", admin: true }
];

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const visibleItems = navItems.filter((item) => !item.admin || isAdmin);

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="brand-block">
        <div className="brand-mark">S</div>
        <div>
          <span className="brand-name">Stockify</span>
          <small>Smart Retail Suite</small>
        </div>
        <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <nav className="nav flex-column gap-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink key={item.to} className="nav-link side-link" to={item.to} onClick={onClose}>
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span>API</span>
        <strong>Connected</strong>
      </div>
    </aside>
  );
};

export default Sidebar;
