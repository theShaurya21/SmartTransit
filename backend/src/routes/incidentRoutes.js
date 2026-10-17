const express = require("express");
const mongoose = require("mongoose");
const Incident = require("../models/Incident");

const router = express.Router();

// GET: Fetch all incidents
router.get("/", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
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

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch incident." });
  }
});

// POST: Create an incident
router.post("/", async (req, res) => {
  try {
    const incident = await Incident.create(req.body);
    res.status(201).json(incident);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create incident." });
  }
});

// PUT: Update an incident
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid incident ID." });
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
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