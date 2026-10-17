
import { useEffect, useMemo, useState } from "react";
import {
    Users as UsersIcon,
    UserPlus,
    Search,
    Pencil,
    Trash2,
    X,
    ShieldCheck,
    GraduationCap,
    Bus,
} from "lucide-react";
import API from "../services/api";

const emptyForm = {
    name: "",
    email: "",
    password: "",
    role: "student",
    status: "Active",
};

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await API.get("/users");
            setUsers(
                response.data.map((user) => ({
                    ...user,
                    id: user._id,
                    role: user.role.toLowerCase(),
                    status: user.status || "Active",
                }))
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not load users. Please log in as an administrator."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase());

            const matchesRole =
                roleFilter === "All" ||
                user.role === roleFilter.toLowerCase();

            const matchesStatus =
                statusFilter === "All" ||
                user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    const counts = useMemo(() => ({
        total: users.length,
        students: users.filter((u) => u.role === "student").length,
        drivers: users.filter((u) => u.role === "driver").length,
        admins: users.filter((u) => u.role === "admin").length,
    }), [users]);

    const openAddModal = () => {
        setEditingUser(null);
        setFormData(emptyForm);
        setError("");
        setNotice("");
        setModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            status: user.status,
        });
        setError("");
        setNotice("");
        setModalOpen(true);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setNotice("");

        if (!formData.name.trim() || !formData.email.trim()) {
            setError("Name and email are required.");
            return;
        }

        if (!editingUser && formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            role: formData.role,
            status: formData.status,
        };

        if (formData.password) {
            payload.password = formData.password;
        }

        setSaving(true);

        try {
            if (editingUser) {
                await API.put(`/users/${editingUser.id}`, payload);
                setNotice("User updated successfully.");
            } else {
                await API.post("/users", payload);
                setNotice("User added successfully.");
            }

            setModalOpen(false);
            setFormData(emptyForm);
            await loadUsers();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not save user. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${user.name}?`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");

        try {
            await API.delete(`/users/${user.id}`);
            setUsers((current) =>
                current.filter((item) => item.id !== user.id)
            );
            setNotice("User deleted successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not delete user."
            );
        }
    };

    return (
        <div className="users-page">
            <div className="users-heading">
                <div>
                    <div className="users-eyebrow">ADMINISTRATION</div>
                    <h1>User Management</h1>
                    <p className="users-subtitle">
                        Manage SmartTransit students, drivers, and administrators.
                    </p>
                </div>

                <button
                    className="users-add-button"
                    onClick={openAddModal}
                >
                    <UserPlus size={18} />
                    Add User
                </button>
            </div>

            {error && (
                <div className="users-form-error" role="alert">
                    {error}
                </div>
            )}

            {notice && (
                <p role="status">{notice}</p>
            )}

            <div className="users-stats">
                <div className="users-stat-card">
                    <div className="users-stat-icon blue">
                        <UsersIcon size={22} />
                    </div>
                    <div>
                        <p>Total Users</p>
                        <h2>{counts.total}</h2>
                    </div>
                </div>

                <div className="users-stat-card">
                    <div className="users-stat-icon purple">
                        <GraduationCap size={22} />
                    </div>
                    <div>
                        <p>Students</p>
                        <h2>{counts.students}</h2>
                    </div>
                </div>

                <div className="users-stat-card">
                    <div className="users-stat-icon green">
                        <Bus size={22} />
                    </div>
                    <div>
                        <p>Drivers</p>
                        <h2>{counts.drivers}</h2>
                    </div>
                </div>

                <div className="users-stat-card">
                    <div className="users-stat-icon orange">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <p>Administrators</p>
                        <h2>{counts.admins}</h2>
                    </div>
                </div>
            </div>

            <div className="users-panel">
                <div className="users-panel-heading">
                    <div>
                        <h2>All Users</h2>
                        <p>Accounts stored in the database</p>
                    </div>
                </div>

                <div className="users-filters">
                    <div className="users-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        aria-label="Filter by role"
                    >
                        <option value="All">All Roles</option>
                        <option value="Student">Student</option>
                        <option value="Driver">Driver</option>
                        <option value="Admin">Admin</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filter by status"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div className="users-table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="users-empty">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="users-empty">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="users-identity">
                                                <div className="users-avatar">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <strong>{user.name}</strong>
                                                    <p>{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className={`users-role ${user.role}`}>
                                                {user.role.charAt(0).toUpperCase() +
                                                    user.role.slice(1)}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`users-status ${user.status.toLowerCase()}`}>
                                                {user.status}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="users-row-actions">
                                                <button
                                                    className="users-icon-button"
                                                    title="Edit user"
                                                    aria-label={`Edit ${user.name}`}
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    className="users-icon-button"
                                                    title="Delete user"
                                                    aria-label={`Delete ${user.name}`}
                                                    onClick={() => handleDelete(user)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <div className="users-modal-overlay">
                    <div className="users-modal">
                        <div className="users-modal-heading">
                            <div>
                                <h2>
                                    {editingUser ? "Edit User" : "Add New User"}
                                </h2>
                                <p>
                                    {editingUser
                                        ? "Update account information."
                                        : "Create a new SmartTransit account."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="users-icon-button"
                                aria-label="Close dialog"
                                onClick={() => setModalOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label>
                                Full Name
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </label>

                            <label>
                                Email Address
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                    required
                                />
                            </label>

                            <label>
                                {editingUser
                                    ? "New Password (leave blank to keep current)"
                                    : "Password"}
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={
                                        editingUser
                                            ? "Optional"
                                            : "At least 6 characters"
                                    }
                                    minLength={6}
                                    required={!editingUser}
                                />
                            </label>

                            <div className="users-form-row">
                                <label>
                                    Role
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="student">Student</option>
                                        <option value="driver">Driver</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </label>

                                <label>
                                    Status
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </label>
                            </div>

                            {error && (
                                <p className="users-form-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <div className="users-modal-actions">
                                <button
                                    type="button"
                                    className="users-cancel-button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="users-add-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingUser
                                            ? "Save Changes"
                                            : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersPage;
