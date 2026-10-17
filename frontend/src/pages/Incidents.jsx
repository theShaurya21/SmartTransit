
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Plus,
  Search,
  X,
  CheckCircle,
  Clock,
  ShieldAlert,
  Pencil,
} from "lucide-react";
import API from "../services/api";
import "../App.css";

const emptyForm = {
  bus: "",
  route: "",
  category: "Other",
  severity: "Medium",
  description: "",
  reporter: "Transport Admin",
  status: "Reported",
};

function formatIncident(incident) {
  return {
    ...incident,
    id: incident._id,
    displayId: `INC-${String(incident._id).slice(-6).toUpperCase()}`,
    time: incident.createdAt
      ? new Date(incident.createdAt).toLocaleString()
      : "Recently",
  };
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadIncidents() {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/incidents");
      setIncidents(response.data.map(formatIncident));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load incidents. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Total Incidents",
        value: incidents.length,
        icon: AlertTriangle,
      },
      {
        label: "Reported",
        value: incidents.filter((item) => item.status === "Reported").length,
        icon: Clock,
      },
      {
        label: "Investigating",
        value: incidents.filter((item) => item.status === "Investigating")
          .length,
        icon: ShieldAlert,
      },
      {
        label: "Resolved",
        value: incidents.filter((item) => item.status === "Resolved").length,
        icon: CheckCircle,
      },
    ],
    [incidents]
  );

  const filteredIncidents = incidents.filter((item) => {
    const term = search.toLowerCase();

    const matchesSearch = [
      item.displayId,
      item.bus,
      item.route,
      item.category,
      item.description,
      item.reporter,
    ].some((value) => String(value || "").toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    const matchesSeverity =
      severityFilter === "All" || item.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(incident) {
    setEditingId(incident.id);
    setForm({
      bus: incident.bus || "",
      route: incident.route || "",
      category: incident.category || "Other",
      severity: incident.severity || "Medium",
      description: incident.description || "",
      reporter: incident.reporter || "Transport Admin",
      status: incident.status || "Reported",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.bus.trim() || !form.route.trim() || !form.description.trim()) {
      setError("Please fill in the bus, route, and description.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await API.put(`/incidents/${editingId}`, form);
        setSuccess("Incident updated successfully.");
      } else {
        await API.post("/incidents", form);
        setSuccess("Incident reported successfully.");
      }

      setModalOpen(false);
      setForm({ ...emptyForm });
      setEditingId(null);
      await loadIncidents();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not save the incident."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    setError("");
    setSuccess("");

    try {
      await API.put(`/incidents/${id}`, { status });
      setSuccess("Incident status updated.");
      await loadIncidents();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update incident status."
      );
    }
  }

  return (
    <div className="incidents-page">
      <div className="incidents-heading">
        <div>
          <h1>Incident Management</h1>
          <p>Report, track, and manage college transport incidents.</p>
        </div>

        <button className="incident-primary-btn" onClick={openAddModal}>
          <Plus size={18} />
          Report Incident
        </button>
      </div>

      {error && !modalOpen && (
        <div className="incident-message incident-error">{error}</div>
      )}

      {success && (
        <div className="incident-message incident-success">{success}</div>
      )}

      <div className="incident-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="incident-stat-card" key={stat.label}>
              <div>
                <p>{stat.label}</p>
                <h2>{stat.value}</h2>
              </div>
              <Icon size={23} />
            </div>
          );
        })}
      </div>

      <div className="incident-panel">
        <div className="incident-toolbar">
          <div className="incident-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search incidents, buses, routes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
          >
            <option value="All">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {loading ? (
          <p className="incident-empty">Loading incidents...</p>
        ) : filteredIncidents.length === 0 ? (
          <p className="incident-empty">
            No incidents found. Click “Report Incident” to add one.
          </p>
        ) : (
          <div className="incident-table-wrap">
            <table className="incident-table">
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Bus / Route</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Reported At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <strong>{incident.displayId}</strong>
                    </td>

                    <td>
                      <strong>{incident.bus}</strong>
                      <small className="incident-subtext">
                        {incident.route}
                      </small>
                    </td>

                    <td>{incident.category}</td>

                    <td>
                      <span
                        className={`incident-severity ${incident.severity.toLowerCase()}`}
                      >
                        {incident.severity}
                      </span>
                    </td>

                    <td className="incident-description">
                      {incident.description}
                    </td>

                    <td>{incident.time}</td>

                    <td>
                      <select
                        className={`incident-status-select ${incident.status.toLowerCase()}`}
                        value={incident.status}
                        onChange={(event) =>
                          updateStatus(incident.id, event.target.value)
                        }
                        aria-label={`Change status for ${incident.displayId}`}
                      >
                        <option value="Reported">Reported</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>

                    <td>
                      <button
                        className="incident-icon-btn"
                        title="Edit incident"
                        aria-label={`Edit ${incident.displayId}`}
                        onClick={() => openEditModal(incident)}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="incident-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
              setError("");
            }
          }}
        >
          <div
            className="incident-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-modal-title"
          >
            <div className="incident-modal-heading">
              <div>
                <h2 id="incident-modal-title">
                  {editingId ? "Edit Incident" : "Report New Incident"}
                </h2>
                <p>Enter the incident details below.</p>
              </div>

              <button
                className="incident-icon-btn"
                onClick={() => {
                  setModalOpen(false);
                  setError("");
                }}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="incident-message incident-error">{error}</div>
            )}

            <form className="incident-form" onSubmit={handleSubmit}>
              <label>
                Bus Number *
                <input
                  name="bus"
                  value={form.bus}
                  onChange={handleChange}
                  placeholder="e.g. BUS-012"
                  required
                />
              </label>

              <label>
                Route *
                <input
                  name="route"
                  value={form.route}
                  onChange={handleChange}
                  placeholder="e.g. GLA Campus - Mathura Junction"
                  required
                />
              </label>

              <div className="incident-form-row">
                <label>
                  Category
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option>Delay</option>
                    <option>Breakdown</option>
                    <option>Safety</option>
                    <option>Route Deviation</option>
                    <option>Overcrowding</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Severity
                  <select
                    name="severity"
                    value={form.severity}
                    onChange={handleChange}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </label>
              </div>

              <label>
                Description *
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the incident..."
                  rows={4}
                  required
                />
              </label>

              <label>
                Reporter
                <input
                  name="reporter"
                  value={form.reporter}
                  onChange={handleChange}
                  placeholder="Person reporting the incident"
                />
              </label>

              {editingId && (
                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option>Reported</option>
                    <option>Investigating</option>
                    <option>Resolved</option>
                  </select>
                </label>
              )}

              <div className="incident-form-actions">
                <button
                  type="button"
                  className="incident-secondary-btn"
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="incident-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Submit Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
