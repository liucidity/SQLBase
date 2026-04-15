import { useContext, useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { GlobalContext } from "../../state/GlobalStateProvider";
import { useAuth } from "../../state/AuthProvider";
import useDatabase from "../../state/hooks/useDatabase";
import "./Layout.scss";
import HomeIcon from "@mui/icons-material/Home";
import StorageIcon from "@mui/icons-material/Storage";
import TableChartIcon from "@mui/icons-material/TableChart";
import DataArrayIcon from "@mui/icons-material/DataArray";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import BarChartIcon from "@mui/icons-material/BarChart";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import CircleIcon from "@mui/icons-material/Circle";
import LogoutIcon from "@mui/icons-material/Logout";

const navItems = [
  { path: "/",                label: "Home",         icon: <HomeIcon fontSize="small" /> },
  { path: "/user-databases",  label: "My Databases", icon: <StorageIcon fontSize="small" /> },
  { path: "/tables",          label: "Schema",       icon: <TableChartIcon fontSize="small" /> },
  { path: "/seeds",           label: "Seeds",        icon: <DataArrayIcon fontSize="small" /> },
  { path: "/queries",         label: "Queries",      icon: <QueryStatsIcon fontSize="small" /> },
  { path: "/charts",          label: "Charts",       icon: <BarChartIcon fontSize="small" /> },
];

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [state] = useContext(GlobalContext);
  const { user, logout } = useAuth();
  const { loadProgress } = useDatabase();
  const loadedForUser = useRef(null);

  // Auto-load the most recently used database when the user authenticates
  useEffect(() => {
    if (user && user.id !== loadedForUser.current) {
      loadedForUser.current = user.id;
      loadProgress().catch(() => {});
    }
  }, [user?.id]);

  const handleLogout = async () => {
    loadedForUser.current = null;
    await logout();
    navigate("/");
  };

  const dbName = state.databaseName;
  const hasDb = dbName && dbName !== "database_name";

  return (
    <div className={`app-shell${collapsed ? " collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          {!collapsed && <span className="sidebar-logo">◈</span>}
          {!collapsed && <span className="sidebar-title">SQLBase</span>}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(c => !c)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
          </button>
        </div>

        {!collapsed && (
          <div className={`db-badge${hasDb ? " active" : ""}`}>
            <CircleIcon sx={{ fontSize: 8 }} />
            <span>{hasDb ? dbName : "No database loaded"}</span>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item${location.pathname === item.path ? " active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="sidebar-footer">
            {!collapsed && <span className="sidebar-user">{user.email}</span>}
            <button
              className="sidebar-logout"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogoutIcon fontSize="small" />
            </button>
          </div>
        )}
      </aside>

      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
