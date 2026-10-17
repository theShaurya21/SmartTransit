import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FeaturePage from "./pages/FeaturePage";
import DashboardLayout from "./layouts/DashboardLayout";
import Tracking from "./pages/Tracking";
import Buses from "./pages/Buses";
import RoutesPage from "./pages/Routes";
import IncidentsPage from "./pages/Incidents";
import AnalyticsPage from "./pages/Analytics";
import UsersPage from "./pages/Users";
import SettingsPage from "./pages/Settings";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                   <Route path="/tracking" element={<Tracking />} />
                   <Route path="/buses" element={<Buses />} />
                  <Route path="/routes" element={<RoutesPage />} />
                   <Route path="/incidents" element={<IncidentsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                   <Route path="/users" element={<UsersPage />} />
                   <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;