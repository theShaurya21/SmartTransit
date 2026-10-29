import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Outlet
} from "react-router-dom";
import { lazy, Suspense } from "react";

import Landing from "./pages/Landing";
import { NotFound, Unauthorized } from "./pages/AccessPages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import Buses from "./pages/Buses";
import RoutesPage from "./pages/Routes";
import IncidentsPage from "./pages/Incidents";
import AnalyticsPage from "./pages/Analytics";
import UsersPage from "./pages/Users";
import SettingsPage from "./pages/Settings";

const Tracking = lazy(() => import("./pages/Tracking"));

function RequireAuth() {
    return localStorage.getItem("token")
        ? <Outlet />
        : <Navigate to="/login" replace />;
}

function RequireAdmin() {
    let user;
    try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch { user = null; }
    return user.role === "admin"
        ? <Outlet />
        : <Navigate to="/unauthorized" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                <Route element={<RequireAuth />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/tracking" element={
                            <Suspense fallback={<div className="page-content">Loading tracking map...</div>}>
                                <Tracking />
                            </Suspense>
                        } />
                        <Route path="/buses" element={<Buses />} />
                        <Route path="/routes" element={<RoutesPage />} />
                        <Route path="/incidents" element={<IncidentsPage />} />
                        <Route element={<RequireAdmin />}>
                            <Route path="/analytics" element={<AnalyticsPage />} />
                            <Route path="/users" element={<UsersPage />} />
                        </Route>
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;