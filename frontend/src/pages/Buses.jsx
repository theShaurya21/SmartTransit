
import { useEffect, useState } from "react";
import {
  Bus,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Route,
  Activity,
} from "lucide-react";
import API from "../services/api";
import "../App.css";

const emptyBus = {
  busNumber: "",
  registration: "",
  route: "",
  driver: "",
  driverId: "",
  capacity: "50",
  status: "Active",
};

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function normalizeBuses(responseData) {
  const data = Array.isArray(responseData) ? responseData : responseData.buses || [];
  return data.map((bus) => ({
    ...bus,
    id: bus._id,
    registration: bus.registrationNumber || "",
    capacity: Number(bus.capacity),
  }));
}

function Buses() {
  const isAdmin = getCurrentUser().role === "admin";
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyBus);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadBuses() {
    try {
      const response = await API.get("/buses");
      setError("");
      setBuses(normalizeBuses(response.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load buses. Check that the backend and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    API.get("/buses").then(({ data }) => {
      if (!cancelled) {
        setBuses(normalizeBuses(data));
        setError("");
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err.response?.data?.message || "Could not load buses. Check that the backend and MongoDB are running.");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    if (isAdmin) {
      API.get("/users", { params: { role: "driver", status: "Active" } }).then(({ data }) => {
        if (!cancelled) setDrivers(data);
      }).catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Unable to load driver accounts.");
      });
    }
    return () => { cancelled = true; };
  }, [isAdmin]);

  const activeCount = buses.filter(
    (bus) => bus.status === "Active"
  ).length;

  const totalCapacity = buses.reduce(
    (sum, bus) => sum + Number(bus.capacity || 0),
    0
  );

  const filteredBuses = buses.filter((bus) => {
    const term = search.toLowerCase();

    const matchesSearch = [
      bus.busNumber,
      bus.registration,
      bus.route,
      bus.driver,
    ].some((value) =>
      String(value || "").toLowerCase().includes(term)
    );

    const matchesStatus =
      statusFilter === "All" || bus.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function openAddForm() {
    setEditingId(null);
    setForm(emptyBus);
    setError("");
    setShowForm(true);
  }

  function openEditForm(bus) {
    setEditingId(bus.id);
    setForm({
      busNumber: bus.busNumber || "",
      registration: bus.registration || "",
      route: bus.route || "",
      driver: bus.driver || "",
      driverId: bus.driverId || "",
      capacity: String(bus.capacity ?? 50),
      status: bus.status || "Active",
    });
    setError("");
    setShowForm(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    if (name === "driverId") {
      const selectedDriver = drivers.find((driver) => driver._id === value);
      setForm((previous) => ({
        ...previous,
        driverId: value,
        driver: selectedDriver?.name || (previous.driverId ? "" : previous.driver),
      }));
      return;
    }
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const capacity = Number(form.capacity);

    if (
      !form.busNumber.trim() ||
      !form.registration.trim() ||
      !form.route.trim() ||
      !form.driver.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      setError("Enter a valid passenger capacity.");
      return;
    }

    const duplicate = buses.some(
      (bus) =>
        bus.id !== editingId &&
        (bus.busNumber.toLowerCase() ===
          form.busNumber.trim().toLowerCase() ||
          bus.registration.toLowerCase() ===
            form.registration.trim().toLowerCase())
    );

    if (duplicate) {
      setError("Bus number or registration already exists.");
      return;
    }

    const busData = {
      busNumber: form.busNumber.trim(),
      registrationNumber: form.registration.trim(),
      route: form.route.trim(),
      driver: form.driver.trim(),
      driverId: form.driverId || null,
      capacity,
      status: form.status,
    };

    setSaving(true);

    try {
      if (editingId) {
        await API.put(`/buses/${editingId}`, busData);
      } else {
        await API.post("/buses", busData);
      }

      setShowForm(false);
      setForm(emptyBus);
      setEditingId(null);
      await loadBuses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save the bus. Please check the backend."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteBus(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this bus?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await API.delete(`/buses/${id}`);
      await loadBuses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete the bus."
      );
    }
  }

  return (
    <div className="bus-management">
      <div className="bus-page-heading">
        <div>
          <span className="bus-eyebrow">TRANSPORT OPERATIONS</span>
          <h1>Bus Management</h1>
          <p>Manage bus records, driver details, and vehicle capacity.</p>
        </div>

        {isAdmin && <button className="bus-primary-btn" onClick={openAddForm}>
          <Plus size={18} /> Add New Bus
        </button>}
      </div>

      {error && !showForm && (
        <p className="bus-form-error" role="alert">{error}</p>
      )}

      <div className="bus-stats-grid">
        <div className="bus-stat-card">
          <span className="bus-stat-icon"><Bus /></span>
          <div><p>Total Buses</p><h2>{buses.length}</h2></div>
        </div>

        <div className="bus-stat-card">
          <span className="bus-stat-icon"><Activity /></span>
          <div><p>Active Buses</p><h2>{activeCount}</h2></div>
        </div>

        <div className="bus-stat-card">
          <span className="bus-stat-icon"><Route /></span>
          <div><p>Total Capacity</p><h2>{totalCapacity}</h2></div>
        </div>
      </div>

      <div className="bus-table-panel">
        <div className="bus-toolbar">
          <div>
            <h2>College Fleet</h2>
            <p>{filteredBuses.length} buses found</p>
          </div>

          <div className="bus-filters">
            <div className="bus-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search buses, routes..."
                aria-label="Search buses"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="bus-table-scroll">
          <table className="bus-table">
            <thead>
              <tr>
                <th>BUS DETAILS</th>
                <th>ROUTE</th>
                <th>DRIVER</th>
                <th>CAPACITY</th>
                <th>STATUS</th>
                {isAdmin && <th>ACTIONS</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="bus-empty">
                    Loading buses...
                  </td>
                </tr>
              ) : filteredBuses.map((bus) => (
                <tr key={bus.id}>
                  <td>
                    <div className="bus-name-cell">
                      <span className="bus-mini-icon">
                        <Bus size={19} />
                      </span>
                      <div>
                        <strong>{bus.busNumber}</strong>
                        <small>{bus.registration || "No registration"}</small>
                      </div>
                    </div>
                  </td>

                  <td>{bus.route}</td>
                  <td>{bus.driver}</td>

                  <td>{bus.capacity}</td>

                  <td>
                    <span
                      className={`bus-status ${
                        bus.status === "Active"
                          ? "is-active"
                          : "is-inactive"
                      }`}
                    >
                      {bus.status}
                    </span>
                  </td>

                  {isAdmin && <td>
                    <div className="bus-actions">
                      <button
                        className="bus-icon-btn"
                        onClick={() => openEditForm(bus)}
                        aria-label={`Edit ${bus.busNumber}`}
                        title="Edit bus"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="bus-icon-btn delete"
                        onClick={() => deleteBus(bus.id)}
                        aria-label={`Delete ${bus.busNumber}`}
                        title="Delete bus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>}
                </tr>
              ))}

              {!loading && filteredBuses.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="bus-empty">
                    No buses match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div
          className="bus-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
              setError("");
            }
          }}
        >
          <div
            className="bus-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bus-form-title"
          >
            <div className="bus-modal-heading">
              <div>
                <h2 id="bus-form-title">
                  {editingId ? "Edit Bus" : "Add New Bus"}
                </h2>
                <p>Enter the bus and transport details below.</p>
              </div>

              <button
                className="bus-icon-btn"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                aria-label="Close form"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bus-form-grid">
                <label>
                  Bus Number *
                  <input
                    name="busNumber"
                    value={form.busNumber}
                    onChange={handleChange}
                    placeholder="e.g. BUS-005"
                    required
                  />
                </label>

                <label>
                  Registration Number *
                  <input
                    name="registration"
                    value={form.registration}
                    onChange={handleChange}
                    placeholder="e.g. UP85 XY 1234"
                    required
                  />
                </label>

                <label>
                  Route *
                  <input
                    name="route"
                    value={form.route}
                    onChange={handleChange}
                    placeholder="e.g. Mathura City"
                    required
                  />
                </label>

                <label>
                  Assigned Driver Account
                  <select
                    name="driverId"
                    value={form.driverId}
                    onChange={handleChange}
                  >
                    <option value="">Not linked to an account</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>{driver.name} ({driver.email})</option>
                    ))}
                  </select>
                </label>

                <label>
                  Driver Name *
                  <input
                    name="driver"
                    value={form.driver}
                    onChange={handleChange}
                    placeholder="Enter driver name"
                    required
                  />
                </label>

                <label>
                  Passenger Capacity *
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    step="1"
                    value={form.capacity}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="bus-full-field">
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </label>
              </div>

              {error && <p className="bus-form-error">{error}</p>}

              <div className="bus-modal-actions">
                <button
                  type="button"
                  className="bus-secondary-btn"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bus-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Bus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Buses;
