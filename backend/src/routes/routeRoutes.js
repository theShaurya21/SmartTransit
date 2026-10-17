const express = require("express");
const mongoose = require("mongoose");
const Route = require("../models/Route");

const router = express.Router();

// GET all routes
router.get("/", async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch routes." });
  }
});

// GET one route by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid route ID." });
    }

    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    res.status(200).json(route);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch route." });
  }
});

// CREATE a route
router.post("/", async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json(route);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This route code already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({ message: "Failed to create route." });
  }
});

// UPDATE a route
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid route ID." });
    }

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    res.status(200).json(route);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This route code already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({ message: "Failed to update route." });
  }
});

// DELETE a route
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid route ID." });
    }

    const route = await Route.findByIdAndDelete(req.params.id);

    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    res.status(200).json({ message: "Route deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete route." });
  }
});

module.exports = router;