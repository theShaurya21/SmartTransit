const express = require("express");
const mongoose = require("mongoose");
const Bus = require("../models/Bus");
const Trip = require("../models/Trip");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

router.get("/assigned", authorizeRoles("driver"), async (req, res, next) => {
    try {
        const buses = await Bus.find({
            driverId: req.user._id,
            status: "Active"
        }).select("busNumber driver route capacity status").sort({ busNumber: 1 });
        res.json(buses);
    } catch (error) {
        next(error);
    }
});

router.get("/active", async (req, res, next) => {
    try {
        const query = req.user.role === "driver"
            ? { status: "Active", driver: req.user._id }
            : { status: "Active" };
        const trips = await Trip.find(query)
            .populate("bus", "busNumber driver route")
            .populate("driver", "name")
            .sort({ startedAt: -1 })
            .lean();
        const now = Date.now();
        res.json(trips.map((trip) => ({
            ...trip,
            locationFresh: Boolean(
                trip.latestLocation &&
                now - new Date(trip.latestLocation.receivedAt).getTime() <= 120000
            )
        })));
    } catch (error) {
        next(error);
    }
});

router.post("/start", authorizeRoles("driver"), async (req, res, next) => {
    try {
        const busId = req.body?.busId;
        if (!mongoose.isValidObjectId(busId)) {
            return res.status(400).json({ message: "A valid assigned bus ID is required." });
        }

        const bus = await Bus.findOne({
            _id: busId,
            driverId: req.user._id,
            status: "Active"
        });
        if (!bus) {
            return res.status(403).json({ message: "This bus is not actively assigned to you." });
        }

        const existingTrip = await Trip.exists({
            $or: [{ bus: bus._id }, { driver: req.user._id }],
            status: "Active"
        });
        if (existingTrip) {
            return res.status(409).json({ message: "You or this bus already have an active trip." });
        }

        let trip;
        try {
            trip = await Trip.create({
                bus: bus._id,
                driver: req.user._id,
                route: bus.route,
                status: "Active",
                startedAt: new Date()
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ message: "You or this bus already have an active trip." });
            }
            throw error;
        }
        await trip.populate([
            { path: "bus", select: "busNumber driver route" },
            { path: "driver", select: "name" }
        ]);
        res.status(201).json(trip);
    } catch (error) {
        next(error);
    }
});

router.patch("/:id/location", authorizeRoles("driver"), async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid trip ID." });
        }

        const { latitude, longitude, accuracy } = req.body || {};
        if (
            typeof latitude !== "number" || !Number.isFinite(latitude) ||
            typeof longitude !== "number" || !Number.isFinite(longitude) ||
            latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ||
            (accuracy !== undefined && (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 10000))
        ) {
            return res.status(400).json({ message: "Provide valid GPS coordinates and accuracy." });
        }

        const trip = await Trip.findOneAndUpdate(
            { _id: req.params.id, driver: req.user._id, status: "Active" },
            {
                $set: {
                    latestLocation: {
                        latitude,
                        longitude,
                        ...(accuracy !== undefined ? { accuracy } : {}),
                        receivedAt: new Date(),
                        source: "device-geolocation"
                    }
                }
            },
            { new: true, runValidators: true }
        );
        if (!trip) {
            return res.status(404).json({ message: "Active trip not found for this driver." });
        }

        res.json(trip);
    } catch (error) {
        next(error);
    }
});

router.patch("/:id/end", async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid trip ID." });
        }
        if (req.user.role !== "admin" && req.user.role !== "driver") {
            return res.status(403).json({ message: "Only the assigned driver or an administrator can end this trip." });
        }

        const query = { _id: req.params.id, status: "Active" };
        if (req.user.role === "driver") query.driver = req.user._id;
        const trip = await Trip.findOneAndUpdate(
            query,
            { $set: { status: "Completed", endedAt: new Date() } },
            { new: true, runValidators: true }
        );
        if (!trip) {
            return res.status(404).json({ message: "Active trip not found or you are not assigned to it." });
        }

        res.json(trip);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
