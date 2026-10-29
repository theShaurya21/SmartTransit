import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Bus, CheckCircle, Clock, Download, Route,
} from "lucide-react";
import API from "../services/api";

const periods = { "7 Days": 7, "30 Days": 30, "90 Days": 90 };

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7 Days");
  const [records, setRecords] = useState({ buses: [], routes: [], incidents: [], generatedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    API.get("/analytics", { params: { days: periods[period] } })
      .then(({ data }) => {
        if (!cancelled) {
          setRecords({
            buses: data.buses,
            routes: data.routes,
            incidents: data.incidents,
            generatedAt: data.generatedAt,
          });
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Unable to load analytics records.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [period]);
  const displayedIncidents = records.incidents;

  const dailyCounts = useMemo(() => {
    const days = periods[period];
    const now = new Date(records.generatedAt || 0).getTime();
    const buckets = Array.from({ length: 7 }, (_, index) => ({
      label: `${Math.floor((index * days) / 7) + 1}-${Math.floor(((index + 1) * days) / 7)}d`,
      incidents: 0,
    }));

    displayedIncidents.forEach((incident) => {
      const age = Math.max(0, now - new Date(incident.createdAt).getTime());
      const bucket = Math.min(6, Math.floor((days - age / (24 * 60 * 60 * 1000)) * 7 / days));
      buckets[bucket].incidents += 1;
    });

    return buckets;
  }, [displayedIncidents, period, records.generatedAt]);

  const maxIncidents = Math.max(1, ...dailyCounts.map((day) => day.incidents));

  function downloadReport() {
    try {
      const rows = [
        ["ID", "Created", "Bus", "Route", "Category", "Severity", "Status", "Description"],
        ...displayedIncidents.map((incident) => [
          incident._id,
          incident.createdAt,
          incident.bus,
          incident.route,
          incident.category,
          incident.severity,
          incident.status,
          incident.description,
        ]),
      ];
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `smarttransit-incidents-${period.toLowerCase().replace(" ", "-")}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (exportError) {
      setError(`Unable to export the displayed incident data: ${exportError.message}`);
    }
  }

  return (
    <div className="analytics-page">
      <div className="analytics-heading">
        <div>
          <p className="analytics-eyebrow">DATABASE SUMMARY</p>
          <h1>Transport Analytics</h1>
          <p className="analytics-subtitle">Counts and incident reports from stored records; trip-performance metrics are not available.</p>
        </div>
        <div className="analytics-actions">
          <select value={period} onChange={(event) => {
            setLoading(true);
            setError("");
            setPeriod(event.target.value);
          }} aria-label="Incident reporting period">
            {Object.keys(periods).map((value) => <option key={value}>{value}</option>)}
          </select>
          <button className="analytics-export" onClick={downloadReport} disabled={loading || Boolean(error)}>
            <Download size={17} /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="incident-message incident-error" role="alert">{error}</div>}

      <div className="analytics-stats">
        {[
          { title: "Total Buses", value: records.buses.length, icon: Bus, note: "Stored bus records" },
          { title: "Active Routes", value: records.routes.filter((route) => route.status === "Active").length, icon: Route, note: "Stored route records" },
          { title: "Incidents in Period", value: displayedIncidents.length, icon: AlertTriangle, note: `Last ${period.toLowerCase()}` },
          { title: "Unresolved Incidents", value: displayedIncidents.filter((incident) => incident.status !== "Resolved").length, icon: CheckCircle, note: "Within selected period" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="analytics-stat-card" key={stat.title}>
              <div className="analytics-stat-icon blue"><Icon size={21} /></div>
              <p>{stat.title}</p>
              <h2>{loading ? "…" : stat.value}</h2>
              <span>{stat.note}</span>
            </div>
          );
        })}
      </div>

      <div className="analytics-chart-grid">
        <section className="analytics-panel">
          <div className="analytics-panel-heading">
            <div><h2>Reported Incidents</h2><p>Stored incidents grouped across the selected period</p></div>
            <Activity size={21} />
          </div>
          <div className="analytics-incident-list">
            {dailyCounts.map((day) => (
              <div className="analytics-incident-row" key={day.label}>
                <span>{day.label}</span>
                <div className="analytics-incident-track">
                  <div className="analytics-incident-bar" style={{ width: `${(day.incidents / maxIncidents) * 100}%` }} />
                </div>
                <strong>{day.incidents}</strong>
              </div>
            ))}
          </div>
          {!loading && displayedIncidents.length === 0 && <p className="tracking-empty">No incidents were reported in this period.</p>}
          <div className="analytics-chart-footer warning"><Clock size={17} /><span>Trip counts, ridership, and efficiency are unavailable without trip records.</span></div>
        </section>

        <section className="analytics-panel analytics-route-panel">
          <div className="analytics-panel-heading">
            <div><h2>Routes</h2><p>Actual configured route information</p></div>
            <Bus size={21} />
          </div>
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead><tr><th>Route</th><th>Status</th><th>Distance</th><th>Duration</th></tr></thead>
              <tbody>
                {records.routes.map((route) => (
                  <tr key={route._id}>
                    <td><strong>{route.name}</strong></td>
                    <td>{route.status}</td>
                    <td>{route.distance} km</td>
                    <td>{route.duration} min</td>
                  </tr>
                ))}
                {!loading && records.routes.length === 0 && <tr><td colSpan="4">No route records are available.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {error && <p className="analytics-chart-footer"><AlertTriangle size={17} /> Analytics may be incomplete because one or more requests failed.</p>}
    </div>
  );
}
