const express = require("express");
const Bus = require("../models/Bus");

const router = express.Router();

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
router.post("/", async (req, res) => {
    try {
        const bus = await Bus.create(req.body);
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
router.put("/:id", async (req, res) => {
    try {
        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            req.body,
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
router.delete("/:id", async (req, res) => {
    try {
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