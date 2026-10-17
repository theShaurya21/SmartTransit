import { useLocation } from "react-router-dom";
import {
    Map,
    Bus,
    Route,
    AlertTriangle,
    BarChart3,
    Users,
    Settings
} from "lucide-react";

const pageDetails = {
    "/tracking": {
        title: "Live Bus Tracking",
        description: "Monitor buses and view their routes on an interactive map.",
        icon: Map
    },
    "/buses": {
        title: "Bus Management",
        description: "Manage your fleet, bus details and operational status.",
        icon: Bus
    },
    "/routes": {
        title: "Route Management",
        description: "View and organize college transport routes.",
        icon: Route
    },
    "/incidents": {
        title: "Incident Reports",
        description: "Review and manage transport-related incidents.",
        icon: AlertTriangle
    },
    "/analytics": {
        title: "Transport Analytics",
        description: "Explore fleet usage, transport activity and performance.",
        icon: BarChart3
    },
    "/users": {
        title: "User Management",
        description: "View student, driver and administrator accounts.",
        icon: Users
    },
    "/settings": {
        title: "Settings",
        description: "Manage your SmartTransit preferences.",
        icon: Settings
    }
};

function FeaturePage() {
    const location = useLocation();
    const page = pageDetails[location.pathname] || pageDetails["/tracking"];
    const Icon = page.icon;

    return (
        <div className="feature-page">
            <div className="page-heading">
                <div>
                    <h1>{page.title}</h1>
                    <p>{page.description}</p>
                </div>
            </div>

            <div className="feature-placeholder panel">
                <div className="feature-placeholder-icon">
                    <Icon size={32} />
                </div>

                <h2>{page.title}</h2>
                <p>
                    This module is being developed for the SmartTransit
                    evaluation prototype.
                </p>
                <span className="module-tag">Module ready for development</span>
            </div>
        </div>
    );
}

export default FeaturePage;