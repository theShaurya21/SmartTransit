const express = require("express");
const Bus = require("../models/Bus");
const Incident = require("../models/Incident");
const Route = require("../models/Route");
const User = require("../models/User");
const Trip = require("../models/Trip");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", protect, async (req, res, next) => {
    try {
        const [totalBuses, activeBuses, activeRoutes, unresolvedIncidents, totalStudents, activeTrips] = await Promise.all([
            Bus.countDocuments(),
            Bus.countDocuments({ status: "Active" }),
            Route.countDocuments({ status: "Active" }),
            Incident.countDocuments({ status: { $ne: "Resolved" } }),
            req.user.role === "admin"
                ? User.countDocuments({ role: "student", status: "Active" })
                : Promise.resolve(null),
            Trip.countDocuments({ status: "Active" })
        ]);

        res.json({
            totalBuses,
            activeBuses,
            activeRoutes,
            unresolvedIncidents,
            totalStudents,
            activeTrips,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
