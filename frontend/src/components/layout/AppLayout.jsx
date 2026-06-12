import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <button
        className={`sidebar-scrim ${sidebarOpen ? "show" : ""}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />
      <main className="app-main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="content-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
