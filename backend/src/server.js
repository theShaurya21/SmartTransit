const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const tripRoutes = require("./routes/tripRoutes");
const Trip = require("./models/Trip");

const app = express();
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (allowedOrigins.length === 0 && process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:5173");
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        const error = new Error("Origin is not allowed by CORS");
        error.status = 403;
        return callback(error);
    }
}));
app.use(express.json({ limit: "100kb" }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Try again later." }
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many requests. Try again later." }
}));
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/trips", tripRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "SmartTransit Backend is running!"
    });
});

app.get("/api/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;
    res.status(databaseConnected ? 200 : 503).json({
        status: databaseConnected ? "ok" : "unavailable",
        database: databaseConnected ? "connected" : "disconnected"
    });
});

app.use("/api", (req, res) => {
    res.status(404).json({ message: "API endpoint not found." });
});

app.use((error, req, res, next) => {
    console.error("API request failed:", {
        name: error.name,
        code: error.code,
        path: req.path
    });
    if (res.headersSent) {
        return next(error);
    }

    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
        ? error.status
        : 500;
    return res.status(status).json({
        message: status === 403
            ? "Origin is not allowed."
            : status === 400
                ? "Invalid request."
                : status === 413
                    ? "Request body is too large."
                    : "Internal server error."
    });
});

async function startServer() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI must be configured before starting SmartTransit.");
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must be configured with at least 32 characters.");
    }

    if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
        throw new Error("CORS_ORIGINS must include the approved frontend origin in production.");
    }

    await connectDB();
    await Trip.init();
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`SmartTransit API listening on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("SmartTransit startup failed:", error.message);
    process.exitCode = 1;
});

module.exports = app;