const express = require("express");
const mongoose = require("mongoose");
const Incident = require("../models/Incident");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

// GET: Fetch all incidents
router.get("/", async (req, res) => {
  try {
    const query = req.user.role === "admin"
      ? {}
      : { reporterId: req.user._id };
    const incidents = await Incident.find(query).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch incidents." });
  }
});

// GET: Fetch one incident
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid incident ID." });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found." });
    }

    if (req.user.role !== "admin" && String(incident.reporterId) !== String(req.user._id)) {
      return res.status(403).json({ message: "You cannot access this incident." });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch incident." });
  }
});

// POST: Create an incident
router.post("/", async (req, res) => {
  try {
    const { bus, route, category, severity, description } = req.body || {};
    const incident = await Incident.create({
      bus,
      route,
      category,
      severity,
      description,
      reporter: req.user.name,
      reporterId: req.user._id
    });
    res.status(201).json(incident);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create incident." });
  }
});

// Only administrators can change incident records.
router.use(authorizeRoles("admin"));

// PUT: Update an incident
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid incident ID." });
    }

    const updates = {};
    for (const field of ["bus", "route", "category", "severity", "description", "status"]) {
      if (req.body?.[field] !== undefined) updates[field] = req.body[field];
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No supported incident fields were provided." });
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found." });
    }

    res.json(incident);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update incident." });
  }
});

// DELETE: Remove an incident
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid incident ID." });
    }

    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found." });
    }

    res.json({ message: "Incident deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete incident." });
  }
});

module.exports = router;