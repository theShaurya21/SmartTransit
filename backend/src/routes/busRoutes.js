const express = require("express");
const Bus = require("../models/Bus");
const mongoose = require("mongoose");
const User = require("../models/User");
const Trip = require("../models/Trip");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);
const busFields = ["busNumber", "driver", "driverId", "route", "capacity", "status", "registrationNumber"];
const selectBusFields = (body = {}) => Object.fromEntries(
    busFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
);

async function validateDriverAssignment(fields) {
    if (fields.driverId === undefined) return null;
    if (fields.driverId === null || fields.driverId === "") {
        fields.driverId = null;
        return null;
    }
    if (!mongoose.isValidObjectId(fields.driverId)) {
        return "Invalid driver account ID.";
    }

    const driver = await User.findOne({
        _id: fields.driverId,
        role: "driver",
        status: "Active"
    }).select("name");
    if (!driver) return "The selected account is not an active driver.";

    fields.driverId = driver._id;
    fields.driver = driver.name;
    return null;
}

// GET: Fetch all buses
router.get("/", async (req, res) => {
    try {
        const buses = await Bus.find().sort({ createdAt: -1 });
        res.status(200).json(buses);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch buses" });
    }
});

// GET: Fetch one bus by ID
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid bus ID" });
        }
        const bus = await Bus.findById(req.params.id);

        if (!bus) {
            return res.status(404).json({ message: "Bus not found" });
        }

        res.status(200).json(bus);
    } catch (error) {
        res.status(400).json({ message: "Invalid bus ID" });
    }
});

// POST: Add a bus
router.post("/", authorizeRoles("admin"), async (req, res) => {
    try {
        const fields = selectBusFields(req.body);
        const assignmentError = await validateDriverAssignment(fields);
        if (assignmentError) {
            return res.status(400).json({ message: assignmentError });
        }
        const bus = await Bus.create(fields);
        res.status(201).json(bus);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This bus number already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({ message: "Failed to add bus" });
    }
});

// PUT: Update a bus
router.put("/:id", authorizeRoles("admin"), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid bus ID" });
        }
        const updates = selectBusFields(req.body);
        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: "No supported bus fields were provided." });
        }
        const assignmentError = await validateDriverAssignment(updates);
        if (assignmentError) {
            return res.status(400).json({ message: assignmentError });
        }
        if (updates.driverId !== undefined || updates.route !== undefined || updates.status !== undefined) {
            const activeTrip = await Trip.exists({ bus: req.params.id, status: "Active" });
            if (activeTrip) {
                return res.status(409).json({ message: "End the active trip before changing its bus assignment or status." });
            }
        }
        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!bus) {
            return res.status(404).json({ message: "Bus not found" });
        }

        res.status(200).json(bus);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This bus number already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(400).json({ message: "Failed to update bus" });
    }
});

// DELETE: Remove a bus
router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid bus ID" });
        }
        if (await Trip.exists({ bus: req.params.id })) {
            return res.status(409).json({ message: "Buses with trip records cannot be deleted." });
        }

        const bus = await Bus.findByIdAndDelete(req.params.id);

        if (!bus) {
            return res.status(404).json({ message: "Bus not found" });
        }

        res.status(200).json({ message: "Bus deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete bus" });
    }
});

module.exports = router;