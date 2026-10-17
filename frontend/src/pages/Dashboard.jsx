import {
    Bus,
    Users,
    Route,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    MapPin
} from "lucide-react";

const stats = [
    {
        title: "Total Buses",
        value: "24",
        change: "+2 this month",
        icon: Bus,
        color: "blue"
    },
    {
        title: "Active Buses",
        value: "18",
        change: "75% fleet active",
        icon: MapPin,
        color: "green"
    },
    {
        title: "Total Students",
        value: "1,240",
        change: "+8.2% this month",
        icon: Users,
        color: "purple"
    },
    {
        title: "Active Routes",
        value: "12",
        change: "2 delayed",
        icon: Route,
        color: "orange"
    }
];

const buses = [
    { id: "BUS-001", route: "Mathura - Campus", driver: "Amit Kumar", status: "On Time", time: "08:15 AM" },
    { id: "BUS-002", route: "Vrindavan - Campus", driver: "Rahul Sharma", status: "Delayed", time: "08:25 AM" },
    { id: "BUS-003", route: "Agra - Campus", driver: "Vikas Singh", status: "On Time", time: "08:30 AM" },
    { id: "BUS-004", route: "Hathras - Campus", driver: "Rohit Verma", status: "On Route", time: "08:40 AM" }
];

function Dashboard() {
    return (
        <div className="dashboard-page">
            <div className="page-heading">
                <div>
                    <h1>Dashboard Overview</h1>
                    <p>Monitor your college transportation system.</p>
                </div>

                <div className="date-badge">
                    <Clock size={16} />
                    Transport Overview
                </div>
            </div>

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
                            <h2>{stat.value}</h2>
                            <span className="stat-change">{stat.change}</span>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-grid">
                <div className="panel fleet-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Fleet Status</h2>
                            <p>Current transport activity</p>
                        </div>
                        <span className="live-indicator">
                            <span></span> Demo data
                        </span>
                    </div>

                    <div className="fleet-summary">
                        <div className="fleet-circle">
                            <div>
                                <strong>18</strong>
                                <span>Active</span>
                            </div>
                        </div>

                        <div className="fleet-legend">
                            <div><span className="legend-dot green-dot"></span> On time <strong>14</strong></div>
                            <div><span className="legend-dot orange-dot"></span> Delayed <strong>2</strong></div>
                            <div><span className="legend-dot gray-dot"></span> Inactive <strong>6</strong></div>
                            <div><span className="legend-dot blue-dot"></span> Total fleet <strong>24</strong></div>
                        </div>
                    </div>
                </div>

                <div className="panel alerts-panel">
                    <div className="panel-heading">
                        <div>
                            <h2>Recent Alerts</h2>
                            <p>Transport notifications</p>
                        </div>
                        <AlertTriangle size={20} className="alert-heading-icon" />
                    </div>

                    <div className="alert-item">
                        <div className="alert-icon orange">
                            <AlertTriangle size={17} />
                        </div>
                        <div>
                            <strong>Route delay detected</strong>
                            <p>BUS-002 · Vrindavan route</p>
                            <span>Demo alert</span>
                        </div>
                    </div>

                    <div className="alert-item">
                        <div className="alert-icon blue">
                            <MapPin size={17} />
                        </div>
                        <div>
                            <strong>Trip started</strong>
                            <p>BUS-003 · Agra route</p>
                            <span>Demo notification</span>
                        </div>
                    </div>

                    <div className="alert-item">
                        <div className="alert-icon red">
                            <AlertTriangle size={17} />
                        </div>
                        <div>
                            <strong>Incident reports</strong>
                            <p>Review pending reports</p>
                            <span>Demo notification</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel table-panel">
                <div className="panel-heading">
                    <div>
                        <h2>Bus Overview</h2>
                        <p>Summary of selected buses</p>
                    </div>
                    <button
                        className="secondary-button"
                        onClick={() => window.location.href = "/buses"}
                    >
                        View All
                    </button>
                </div>

                <div className="table-scroll">
                    <table className="bus-table">
                        <thead>
                            <tr>
                                <th>Bus ID</th>
                                <th>Route</th>
                                <th>Driver</th>
                                <th>Status</th>
                                <th>Departure</th>
                            </tr>
                        </thead>

                        <tbody>
                            {buses.map((bus) => (
                                <tr key={bus.id}>
                                    <td><strong>{bus.id}</strong></td>
                                    <td>{bus.route}</td>
                                    <td>{bus.driver}</td>
                                    <td>
                                        <span className={`status-pill ${bus.status.toLowerCase().replace(" ", "-")}`}>
                                            {bus.status}
                                        </span>
                                    </td>
                                    <td>{bus.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;