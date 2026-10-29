import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        requestedRole: "student"
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await API.post("/auth/register", formData);

            setMessage(response.data.message);
            if (response.data.user?.approvalStatus === "Approved") {
                navigate("/login", { state: { message: response.data.message } });
            }
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Create Account</h1>
                <p>Join SmartTransit and choose the account access you need.</p>

                <label htmlFor="register-name">Full name</label>
                <input
                    id="register-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <fieldset className="register-role-options">
                    <legend>Account type</legend>
                    <label className={`register-role-choice ${formData.requestedRole === "student" ? "selected" : ""}`}>
                        <input
                            type="radio"
                            name="requestedRole"
                            value="student"
                            checked={formData.requestedRole === "student"}
                            onChange={handleChange}
                        />
                        <span><strong>Student</strong><small>Student transport access</small></span>
                    </label>
                    <label className={`register-role-choice ${formData.requestedRole === "driver" ? "selected" : ""}`}>
                        <input
                            type="radio"
                            name="requestedRole"
                            value="driver"
                            checked={formData.requestedRole === "driver"}
                            onChange={handleChange}
                        />
                        <span><strong>Driver</strong><small>Requires administrator approval</small></span>
                    </label>
                    <label className={`register-role-choice ${formData.requestedRole === "admin" ? "selected" : ""}`}>
                        <input
                            type="radio"
                            name="requestedRole"
                            value="admin"
                            checked={formData.requestedRole === "admin"}
                            onChange={handleChange}
                        />
                        <span><strong>Administrator</strong><small>Requires administrator approval</small></span>
                    </label>
                </fieldset>

                <label htmlFor="register-email">Email address</label>
                <input
                    id="register-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="register-password">Password</label>
                <input
                    id="register-password"
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="Password (6+ characters)"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    maxLength={72}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : formData.requestedRole === "student" ? "Create student account" : "Request staff access"}
                </button>

                {message && <p role="alert">{message}</p>}

                <p>
                    Already registered? <Link to="/login">Sign in</Link>
                </p>
                <p><Link to="/">Back to SmartTransit</Link></p>
            </form>
        </div>
    );
}

export default Register;