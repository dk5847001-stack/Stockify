import { AlertTriangle, Bell, CheckCheck, LogOut, Menu, Moon, RefreshCw, Search, Sun, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const Topbar = ({ onMenuClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stockifyReadNotifications")) || [];
    } catch {
      return [];
    }
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readIds.includes(notification.id)).length,
    [notifications, readIds]
  );

  const fetchNotifications = async () => {
    if (!isAdmin) {
      setNotifications([]);
      return;
    }

    setNotificationsLoading(true);
    try {
      const { data } = await api.get("/dashboard/stock-alerts");
      const lowStock = (data.lowStockProducts || []).slice(0, 6).map((product) => ({
        id: `low-${product._id}`,
        type: "low",
        title: "Low stock alert",
        message: `${product.name} has ${product.stock} ${product.unit} left.`,
        productId: product._id
      }));
      const outOfStock = (data.outOfStockProducts || []).slice(0, 6).map((product) => ({
        id: `out-${product._id}`,
        type: "out",
        title: "Out of stock",
        message: `${product.name} needs immediate restock.`,
        productId: product._id
      }));

      setNotifications([...outOfStock, ...lowStock]);
    } catch {
      setNotifications([
        {
          id: "notification-error",
          type: "error",
          title: "Unable to load alerts",
          message: "Check backend connection or admin access."
        }
      ]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem("stockifyReadNotifications", JSON.stringify(readIds));
  }, [readIds]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const markAllRead = () => {
    setReadIds(notifications.map((notification) => notification.id));
  };

  const openNotification = (notification) => {
    setReadIds((current) => [...new Set([...current, notification.id])]);
    setNotificationsOpen(false);

    if (notification.productId) {
      navigate(notification.type === "low" ? "/low-stock" : `/products/${notification.productId}`);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="icon-btn menu-btn" type="button" aria-label="Open navigation" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div>
          <p className="eyebrow mb-1">Retail Command Center</p>
          <h1 className="page-title mb-0">Smart Billing & Inventory</h1>
        </div>
      </div>

      <div className="top-actions">
        <div className="search-box">
          <Search size={18} />
          <input type="search" placeholder="Search products, bills, customers" />
        </div>
        <button className="icon-btn" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="notification-menu">
          <button
            className="icon-btn notification-btn"
            type="button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen((current) => !current)}
          >
            <Bell size={18} />
            {unreadCount > 0 ? <span className="notification-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
          </button>
          {notificationsOpen ? (
            <div className="notification-dropdown">
              <div className="notification-head">
                <div>
                  <strong>Notifications</strong>
                  <span>{unreadCount} unread alerts</span>
                </div>
                <div className="notification-head-actions">
                  <button type="button" aria-label="Refresh notifications" onClick={fetchNotifications}>
                    <RefreshCw size={15} />
                  </button>
                  <button type="button" aria-label="Mark all as read" onClick={markAllRead}>
                    <CheckCheck size={15} />
                  </button>
                </div>
              </div>
              <div className="notification-list">
                {notificationsLoading ? (
                  <div className="notification-empty">Loading alerts...</div>
                ) : notifications.length ? (
                  notifications.map((notification) => (
                    <button
                      className={`notification-item ${readIds.includes(notification.id) ? "read" : ""}`}
                      type="button"
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                    >
                      <span className={`notification-icon notification-${notification.type}`}>
                        <AlertTriangle size={16} />
                      </span>
                      <span>
                        <strong>{notification.title}</strong>
                        <small>{notification.message}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="notification-empty">No stock alerts right now.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="user-menu">
          <button className="user-pill" type="button" onClick={() => setMenuOpen((current) => !current)}>
            <UserRound size={18} />
            <span>{user?.name || "User"}</span>
          </button>
          {menuOpen ? (
            <div className="user-dropdown">
              <div className="dropdown-profile">
                <strong>{user?.name || "Stockify User"}</strong>
                <span>{user?.email}</span>
              </div>
              <button type="button" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
