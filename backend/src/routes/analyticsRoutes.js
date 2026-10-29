const express = require("express");
const Bus = require("../models/Bus");
const Incident = require("../models/Incident");
const Route = require("../models/Route");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, authorizeRoles("admin"));

router.get("/", async (req, res, next) => {
    const days = Number(req.query.days || 7);
    if (![7, 30, 90].includes(days)) {
        return res.status(400).json({ message: "days must be 7, 30, or 90." });
    }

    try {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const [buses, routes, incidents] = await Promise.all([
            Bus.find().sort({ createdAt: -1 }).lean(),
            Route.find().sort({ createdAt: -1 }).lean(),
            Incident.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean()
        ]);
        res.json({ buses, routes, incidents, periodDays: days, generatedAt: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
