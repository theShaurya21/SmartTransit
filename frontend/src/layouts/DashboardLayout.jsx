
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Map,
    Bus,
    Route,
    AlertTriangle,
    BarChart3,
    Users,
    Bell,
    Settings,
    LogOut,
    Menu,
    Search
} from "lucide-react";

import { useEffect, useState } from "react";

const navigation = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard, end: true },
    { name: "Live Tracking", path: "/tracking", icon: Map },
    { name: "Bus Management", path: "/buses", icon: Bus },
    { name: "Routes", path: "/routes", icon: Route },
    { name: "Incidents", path: "/incidents", icon: AlertTriangle },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Users", path: "/users", icon: Users }
];

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
}

function DashboardLayout() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(getStoredUser);

    useEffect(() => {
        const syncUser = () => {
            setUser(getStoredUser());
        };

        // Listen for profile changes within the application.
        window.addEventListener("userUpdated", syncUser);

        // Listen for localStorage changes from other tabs.
        window.addEventListener("storage", syncUser);

        return () => {
            window.removeEventListener("userUpdated", syncUser);
            window.removeEventListener("storage", syncUser);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("userUpdated"));
        navigate("/login");
    };

    const userName = user.name || "User";
    const userRole = user.role || "Student";
    const avatarLetter = userName.charAt(0).toUpperCase();

    return (
        <div className="app-layout">
            <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
                <div className="brand">
                    <div className="brand-icon">
                        <Bus size={24} />
                    </div>
                    <div>
                        <h2>SmartTransit</h2>
                        <span>Transport Management</span>
                    </div>
                </div>

                <div className="nav-label">MAIN MENU</div>

                <nav className="sidebar-nav">
                    {navigation.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? "active" : ""}`
                                }
                                onClick={() => setMenuOpen(false)}
                            >
                                <Icon size={19} />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <NavLink to="/settings" className="nav-item">
                        <Settings size={19} />
                        <span>Settings</span>
                    </NavLink>

                    <button className="nav-item logout" onClick={handleLogout}>
                        <LogOut size={19} />
                        <span>Logout</span>
                    </button>

                    <div className="profile">
                        <div className="avatar">
                            {avatarLetter}
                        </div>
                        <div className="profile-info">
                            <strong>{userName}</strong>
                            <span>{userRole}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main-area">
                <header className="topbar">
                    <button
                        className="mobile-menu"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <Menu size={22} />
                    </button>

                    <div className="breadcrumb">
                        <span>SmartTransit</span>
                        <span>/</span>
                        <strong>Management Portal</strong>
                    </div>

                    <div className="topbar-actions">
                        <div className="search-box">
                            <Search size={17} />
                            <input placeholder="Search..." />
                        </div>

                        <button
                            className="icon-button"
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </button>

                        <div className="top-avatar">
                            {avatarLetter}
                        </div>
                    </div>
                </header>

                <section className="page-content">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}

export default DashboardLayout;
