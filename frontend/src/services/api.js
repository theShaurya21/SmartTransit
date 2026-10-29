
import axios from "axios";

const API = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}`.replace(/\/+$/, "")
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const inactiveAccount = error.response?.status === 403 &&
            error.response?.data?.message === "This account is inactive.";
        const publicAuthRequest = /\/auth\/(login|register)$/.test(error.config?.url || "");
        if (!publicAuthRequest &&
            (error.response?.status === 401 || inactiveAccount) &&
            localStorage.getItem("token")) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event("userUpdated"));
            if (!["/login", "/register"].includes(window.location.pathname)) {
                window.location.assign("/login");
            }
        }

        return Promise.reject(error);
    }
);

export default API;
