
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Route as RouteIcon,
  MapPin,
  Bus,
  Clock,
} from "lucide-react";
import API from "../services/api";
import "../App.css";

const emptyRoute = {
  name: "",
  code: "",
  start: "GLA University",
  destination: "",
  stops: "",
  distance: "20",
  duration: "40",
  bus: "",
  status: "Active",
};

function Routes() {
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyRoute);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load routes from MongoDB through the backend API.
  async function loadRoutes() {
    try {
      setError("");
      const response = await API.get("/routes");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.routes || [];

      setRoutes(
        data.map((route) => ({
          ...route,
          id: route._id,
        }))
      );
    } catch (err) {
      console.error("Failed to load routes:", err);
      setError("Could not load routes. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  const activeCount = routes.filter(
    (route) => route.status === "Active"
  ).length;

  const totalDistance = routes.reduce(
    (sum, route) => sum + Number(route.distance || 0),
    0
  );

  const filteredRoutes = routes.filter((route) => {
    const term = search.toLowerCase();

    const matchesSearch = [
      route.name,
      route.code,
      route.start,
      route.destination,
      route.bus,
      route.stops,
    ].some((value) =>
      String(value || "").toLowerCase().includes(term)
    );

    const matchesStatus =
      statusFilter === "All" || route.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyRoute });
    setError("");
    setShowForm(true);
  }

  function openEditForm(route) {
    setEditingId(route.id);
    setForm({
      name: route.name || "",
      code: route.code || "",
      start: route.start || "",
      destination: route.destination || "",
      stops: route.stops || "",
      distance: String(route.distance ?? 20),
      duration: String(route.duration ?? 40),
      bus: route.bus || "",
      status: route.status || "Active",
    });
    setError("");
    setShowForm(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const distance = Number(form.distance);
    const duration = Number(form.duration);

    if (
      !form.name.trim() ||
      !form.code.trim() ||
      !form.start.trim() ||
      !form.destination.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      !Number.isFinite(distance) ||
      !Number.isFinite(duration) ||
      distance <= 0 ||
      duration <= 0
    ) {
      setError("Distance and duration must be greater than zero.");
      return;
    }

    const duplicate = routes.some(
      (route) =>
        route.id !== editingId &&
        route.code.toLowerCase() === form.code.trim().toLowerCase()
    );

    if (duplicate) {
      setError("This route code already exists.");
      return;
    }

    const routeData = {
      name: form.name.trim(),
      code: form.code.trim(),
      start: form.start.trim(),
      destination: form.destination.trim(),
      stops: form.stops.trim(),
      distance,
      duration,
      bus: form.bus.trim(),
      status: form.status,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await API.put(`/routes/${editingId}`, routeData);
      } else {
        await API.post("/routes", routeData);
      }

      await loadRoutes();
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyRoute });
      setError("");
    } catch (err) {
      console.error("Failed to save route:", err);
      setError(
        err.response?.data?.message ||
          "Could not save route. Check the server and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoute(id) {
    if (!window.confirm("Are you sure you want to delete this route?")) {
      return;
    }

    try {
      await API.delete(`/routes/${id}`);
      setRoutes((previous) =>
        previous.filter((route) => route.id !== id)
      );
      setError("");
    } catch (err) {
      console.error("Failed to delete route:", err);
      setError(
        err.response?.data?.message ||
          "Could not delete route. Please try again."
      );
    }
  }

  return (
    <div className="route-management">
      <div className="route-page-heading">
        <div>
          <span className="route-eyebrow">TRANSPORT OPERATIONS</span>
          <h1>Route Management</h1>
          <p>Create and manage college transport routes and stops.</p>
        </div>

        <button className="route-primary-btn" onClick={openAddForm}>
          <Plus size={18} /> Add New Route
        </button>
      </div>

      <div className="route-stats-grid">
        <div className="route-stat-card">
          <span className="route-stat-icon"><RouteIcon /></span>
          <div><p>Total Routes</p><h2>{routes.length}</h2></div>
        </div>

        <div className="route-stat-card">
          <span className="route-stat-icon"><MapPin /></span>
          <div><p>Active Routes</p><h2>{activeCount}</h2></div>
        </div>

        <div className="route-stat-card">
          <span className="route-stat-icon"><Bus /></span>
          <div>
            <p>Assigned Buses</p>
            <h2>{routes.filter((route) => route.bus).length}</h2>
          </div>
        </div>

        <div className="route-stat-card">
          <span className="route-stat-icon"><Clock /></span>
          <div><p>Combined Distance</p><h2>{totalDistance} km</h2></div>
        </div>
      </div>

      <div className="route-table-panel">
        <div className="route-toolbar">
          <div>
            <h2>College Routes</h2>
            <p>{filteredRoutes.length} routes found</p>
          </div>

          <div className="route-filters">
            <div className="route-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search routes..."
                aria-label="Search routes"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter routes by status"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="route-form-error" role="alert">{error}</p>
        )}

        {loading ? (
          <p style={{ padding: "24px" }}>Loading routes from database...</p>
        ) : (
          <div className="route-table-scroll">
            <table className="route-table">
              <thead>
                <tr>
                  <th>ROUTE</th>
                  <th>JOURNEY</th>
                  <th>DISTANCE</th>
                  <th>DURATION</th>
                  <th>ASSIGNED BUS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredRoutes.map((route) => (
                  <tr key={route.id}>
                    <td>
                      <div className="route-name-cell">
                        <span className="route-mini-icon">
                          <RouteIcon size={19} />
                        </span>
                        <div>
                          <strong>{route.name}</strong>
                          <small>{route.code}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="route-journey">
                        <strong>{route.start}</strong>
                        <span>↓</span>
                        <strong>{route.destination}</strong>
                        <small>{route.stops || "No intermediate stops"}</small>
                      </div>
                    </td>

                    <td>{route.distance} km</td>
                    <td>{route.duration} min</td>
                    <td>{route.bus || "Not assigned"}</td>

                    <td>
                      <span
                        className={`route-status ${
                          route.status === "Active"
                            ? "is-active"
                            : "is-inactive"
                        }`}
                      >
                        {route.status}
                      </span>
                    </td>

                    <td>
                      <div className="route-actions">
                        <button
                          className="route-icon-btn"
                          onClick={() => openEditForm(route)}
                          aria-label={`Edit ${route.name}`}
                          title="Edit route"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="route-icon-btn delete"
                          onClick={() => deleteRoute(route.id)}
                          aria-label={`Delete ${route.name}`}
                          title="Delete route"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRoutes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="route-empty">
                      {routes.length === 0
                        ? "No routes found. Add your first route."
                        : "No routes match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="route-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div
            className="route-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="route-form-title"
          >
            <div className="route-modal-heading">
              <div>
                <h2 id="route-form-title">
                  {editingId !== null ? "Edit Route" : "Add New Route"}
                </h2>
                <p>Enter the route details below.</p>
              </div>

              <button
                className="route-icon-btn"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="route-form-grid">
                <label>
                  Route Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Mathura City Route"
                    required
                  />
                </label>

                <label>
                  Route Code *
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="e.g. RT-005"
                    required
                  />
                </label>

                <label>
                  Starting Point *
                  <input
                    name="start"
                    value={form.start}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Destination *
                  <input
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    placeholder="Enter destination"
                    required
                  />
                </label>

                <label className="route-full-field">
                  Intermediate Stops
                  <textarea
                    name="stops"
                    value={form.stops}
                    onChange={handleChange}
                    placeholder="Separate stops with commas"
                    rows="2"
                  />
                </label>

                <label>
                  Distance (km) *
                  <input
                    name="distance"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.distance}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Duration (minutes) *
                  <input
                    name="duration"
                    type="number"
                    min="1"
                    step="1"
                    value={form.duration}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Assigned Bus
                  <input
                    name="bus"
                    value={form.bus}
                    onChange={handleChange}
                    placeholder="e.g. BUS-001"
                  />
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              {error && (
                <p className="route-form-error" role="alert">{error}</p>
              )}

              <div className="route-modal-actions">
                <button
                  type="button"
                  className="route-secondary-btn"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="route-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Add Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Routes;
