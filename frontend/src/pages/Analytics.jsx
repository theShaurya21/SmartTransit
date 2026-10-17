import { useMemo, useState } from "react";
import {
  Activity,
  Bus,
  CheckCircle,
  Clock,
  Download,
  TrendingUp,
  AlertTriangle,
  Users,
} from "lucide-react";

const weeklyData = [
  { day: "Mon", students: 720, incidents: 4 },
  { day: "Tue", students: 860, incidents: 3 },
  { day: "Wed", students: 790, incidents: 5 },
  { day: "Thu", students: 940, incidents: 2 },
  { day: "Fri", students: 880, incidents: 4 },
  { day: "Sat", students: 420, incidents: 1 },
  { day: "Sun", students: 180, incidents: 0 },
];

const routeData = [
  { name: "Route A", buses: 6, students: 320, efficiency: 92 },
  { name: "Route B", buses: 5, students: 280, efficiency: 86 },
  { name: "Route C", buses: 4, students: 245, efficiency: 95 },
  { name: "Route D", buses: 5, students: 310, efficiency: 78 },
  { name: "Route E", buses: 4, students: 185, efficiency: 89 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7 Days");

  const totals = useMemo(() => {
    const students = weeklyData.reduce((sum, item) => sum + item.students, 0);
    const incidents = weeklyData.reduce((sum, item) => sum + item.incidents, 0);

    return { students, incidents };
  }, []);

  const displayedData =
    period === "7 Days"
      ? weeklyData
      : period === "30 Days"
        ? weeklyData.map((item) => ({
            ...item,
            students: item.students * 4,
            incidents: item.incidents * 4,
          }))
        : weeklyData.map((item) => ({
            ...item,
            students: item.students * 12,
            incidents: item.incidents * 12,
          }));

  const maxStudents = Math.max(...displayedData.map((item) => item.students));

  function downloadReport() {
    const rows = [
      ["Day", "Student Trips", "Incidents"],
      ...displayedData.map((item) => [
        item.day,
        item.students,
        item.incidents,
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "smarttransit-analytics.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="analytics-page">
      <div className="analytics-heading">
        <div>
          <p className="analytics-eyebrow">PERFORMANCE OVERVIEW</p>
          <h1>Transport Analytics</h1>
          <p className="analytics-subtitle">
            Monitor transportation usage, safety, and route performance.
          </p>
        </div>

        <div className="analytics-actions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>7 Days</option>
            <option>30 Days</option>
            <option>90 Days</option>
          </select>

          <button className="analytics-export" onClick={downloadReport}>
            <Download size={17} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="analytics-stats">
        <div className="analytics-stat-card">
          <div className="analytics-stat-icon blue">
            <Bus size={21} />
          </div>
          <p>Total Buses</p>
          <h2>24</h2>
          <span>Across all routes</span>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon purple">
            <Users size={21} />
          </div>
          <p>Student Trips</p>
          <h2>{totals.students.toLocaleString("en-IN")}</h2>
          <span>Sample weekly data</span>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon green">
            <CheckCircle size={21} />
          </div>
          <p>Avg. Route Efficiency</p>
          <h2>88%</h2>
          <span>Sample performance score</span>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-icon orange">
            <AlertTriangle size={21} />
          </div>
          <p>Reported Incidents</p>
          <h2>{totals.incidents}</h2>
          <span>Sample weekly data</span>
        </div>
      </div>

      <div className="analytics-chart-grid">
        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Student Transport Usage</h2>
              <p>Student trips by day</p>
            </div>
            <Activity size={21} />
          </div>

          <div className="analytics-bar-chart">
            {displayedData.map((item) => (
              <div className="analytics-bar-column" key={item.day}>
                <span className="analytics-bar-value">
                  {item.students.toLocaleString("en-IN")}
                </span>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar"
                    style={{
                      height: `${(item.students / maxStudents) * 100}%`,
                    }}
                  />
                </div>
                <span className="analytics-bar-label">{item.day}</span>
              </div>
            ))}
          </div>

          <div className="analytics-chart-footer">
            <TrendingUp size={17} />
            <span>Usage overview for the selected period</span>
          </div>
        </section>

        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Incident Overview</h2>
              <p>Reported incidents by day</p>
            </div>
            <AlertTriangle size={21} />
          </div>

          <div className="analytics-incident-list">
            {displayedData.map((item) => (
              <div className="analytics-incident-row" key={item.day}>
                <span>{item.day}</span>
                <div className="analytics-incident-track">
                  <div
                    className="analytics-incident-bar"
                    style={{
                      width: `${
                        (item.incidents /
                          Math.max(
                            1,
                            ...displayedData.map((day) => day.incidents),
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <strong>{item.incidents}</strong>
              </div>
            ))}
          </div>

          <div className="analytics-chart-footer warning">
            <Clock size={17} />
            <span>Review reported incidents regularly</span>
          </div>
        </section>
      </div>

      <section className="analytics-panel analytics-route-panel">
        <div className="analytics-panel-heading">
          <div>
            <h2>Route Performance</h2>
            <p>Sample route-wise transportation statistics</p>
          </div>
          <Bus size={21} />
        </div>

        <div className="analytics-table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Buses</th>
                <th>Student Trips</th>
                <th>Efficiency</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {routeData.map((route) => (
                <tr key={route.name}>
                  <td>
                    <strong>{route.name}</strong>
                  </td>
                  <td>{route.buses}</td>
                  <td>{route.students}</td>
                  <td>{route.efficiency}%</td>
                  <td>
                    <div className="analytics-efficiency-track">
                      <div
                        className="analytics-efficiency-bar"
                        style={{ width: `${route.efficiency}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}