import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [message, setMessage] = useState(location.state?.message || "");
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
            const response = await API.post(
                "/auth/login",
                formData
            );

            localStorage.setItem(
                "token",
                response.data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            setMessage("Login successful!");

            navigate("/dashboard");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Welcome Back</h1>
                <p>Login to SmartTransit</p>

                <label htmlFor="login-email">Email address</label>
                <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="login-password">Password</label>
                <input
                    id="login-password"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    maxLength={72}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                {message && <p role="alert">{message}</p>}

                <p>
                    New to SmartTransit?{" "}
                    <Link to="/register">Register</Link>
                </p>
                <p><Link to="/">Back to home</Link></p>
            </form>
        </div>
    );
}

export default Login;