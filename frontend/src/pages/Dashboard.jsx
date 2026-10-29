import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bus, Users, Route, AlertTriangle, ArrowUpRight, Clock, MapPin
} from "lucide-react";
import API from "../services/api";

function Dashboard() {
    const [data, setData] = useState({ stats: null, buses: [], incidents: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            API.get("/dashboard/stats"),
            API.get("/buses"),
            API.get("/incidents")
        ]).then(([statsResponse, busesResponse, incidentsResponse]) => {
            if (!cancelled) {
                setData({
                    stats: statsResponse.data,
                    buses: busesResponse.data,
                    incidents: incidentsResponse.data
                });
            }
        }).catch((requestError) => {
            if (!cancelled) {
                setError(requestError.response?.data?.message || "Unable to load current transport data.");
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => { cancelled = true; };
    }, []);

    const stats = [
        { title: "Total Buses", value: data.stats?.totalBuses, icon: Bus, color: "blue" },
        { title: "Active Buses", value: data.stats?.activeBuses, icon: MapPin, color: "green" },
        { title: "Students", value: data.stats?.totalStudents, icon: Users, color: "purple" },
        { title: "Active Routes", value: data.stats?.activeRoutes, icon: Route, color: "orange" },
        { title: "Active Trips", value: data.stats?.activeTrips, icon: Clock, color: "blue" },
        { title: "Unresolved Incidents", value: data.stats?.unresolvedIncidents, icon: AlertTriangle, color: "orange" }
    ];

    const buses = data.buses.slice(0, 5);
    const incidents = data.incidents.slice(0, 3);

    return (
        <div className="dashboard-page">
            <div className="page-heading">
                <div>
                    <h1>Dashboard Overview</h1>
                    <p>Operational overview from the connected transport records.</p>
                </div>

                <div className="date-badge">
                    <Clock size={16} />
                    {data.stats?.updatedAt
                        ? `Updated ${new Date(data.stats.updatedAt).toLocaleTimeString()}`
                        : "Transport Overview"}
                </div>
            </div>

            {error && <div className="incident-message incident-error" role="alert">{error}</div>}

            <div className="stats-grid">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div className="stat-card" key={stat.title}>
                            <div className="stat-top">
                                <div className={`stat-icon ${stat.color}`}>
                                    <Icon size={21} />
                                </div>
                                <ArrowUpRight size={18} className="stat-arrow" />
                            </div>

                            <p>{stat.title}</p>
                            <h2>{loading ? "…" : stat.value ?? "Unavailable"}</h2>
                            <span className="stat-change">
                                {stat.title === "Active Buses" ? "Fleet status records" :
                                    stat.title === "Students" && stat.value == null ? "Administrator metric" :
                                        "Stored database records"}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-grid">
                <div className="panel fleet-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Fleet Status</h2>
                            <p>Bus records and available operational status</p>
                        </div>
                        <span className="live-indicator">{loading ? "Loading" : "Database records"}</span>
                    </div>

                    <div className="fleet-summary">
                        <div className="fleet-circle">
                            <div>
                                <strong>{data.stats?.activeBuses ?? "—"}</strong>
                                <span>Active buses</span>
                            </div>
                        </div>

                        <div className="fleet-legend">
                            <div><span className="legend-dot green-dot"></span> Active <strong>{data.stats?.activeBuses ?? "—"}</strong></div>
                            <div><span className="legend-dot gray-dot"></span> Other status <strong>{data.stats ? data.stats.totalBuses - data.stats.activeBuses : "—"}</strong></div>
                            <div><span className="legend-dot blue-dot"></span> Total fleet <strong>{data.stats?.totalBuses ?? "—"}</strong></div>
                            <div><span className="legend-dot orange-dot"></span> Active trips <strong>{data.stats?.activeTrips ?? "—"}</strong></div>
                        </div>
                    </div>
                </div>

                <div className="panel alerts-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Recent Alerts</h2>
                            <p>Recent incident reports</p>
                        </div>
                        <AlertTriangle size={20} className="alert-heading-icon" />
                    </div>

                    {incidents.map((incident) => (
                        <div className="alert-item" key={incident._id}>
                            <div className="alert-icon orange"><AlertTriangle size={17} /></div>
                            <div>
                                <strong>{incident.category} · {incident.status}</strong>
                                <p>{incident.bus} · {incident.route}</p>
                                <span>{new Date(incident.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    {!loading && incidents.length === 0 && <p className="tracking-empty">No incident reports are available.</p>}
                </div>
            </div>

            <div className="panel table-panel">
                <div className="panel-heading">
                    <div>
                        <h2>Bus Overview</h2>
                        <p>Summary of selected buses</p>
                    </div>
                    <Link className="secondary-button" to="/buses">View All</Link>
                </div>

                <div className="table-scroll">
                    <table className="bus-table">
                        <thead>
                            <tr>
                                <th>Bus ID</th>
                                <th>Route</th>
                                <th>Driver</th>
                                <th>Status</th>
                                <th>Capacity</th>
                            </tr>
                        </thead>

                        <tbody>
                            {buses.map((bus) => (
                                <tr key={bus._id}>
                                    <td><strong>{bus.busNumber}</strong></td>
                                    <td>{bus.route}</td>
                                    <td>{bus.driver}</td>
                                    <td><span className={`status-pill ${bus.status.toLowerCase()}`}>{bus.status}</span></td>
                                    <td>{bus.capacity}</td>
                                </tr>
                            ))}
                            {!loading && buses.length === 0 && (
                                <tr><td colSpan="5">No buses are stored yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;