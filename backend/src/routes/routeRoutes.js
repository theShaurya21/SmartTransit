const express = require("express");
const mongoose = require("mongoose");
const Route = require("../models/Route");
const Bus = require("../models/Bus");
const Trip = require("../models/Trip");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);
const routeFields = ["name", "code", "start", "destination", "stops", "distance", "duration", "bus", "status"];
const selectRouteFields = (body = {}) => Object.fromEntries(
  routeFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
);

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
router.post("/", authorizeRoles("admin"), async (req, res) => {
  try {
    const route = await Route.create(selectRouteFields(req.body));
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
router.put("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid route ID." });
    }

    const updates = selectRouteFields(req.body);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No supported route fields were provided." });
    }

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      updates,
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
router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid route ID." });
    }

    const routeToDelete = await Route.findById(req.params.id);
    if (!routeToDelete) {
      return res.status(404).json({ message: "Route not found." });
    }

    const routeNames = [routeToDelete.name, routeToDelete.code];
    const hasReferences = await Promise.all([
      Bus.exists({ route: { $in: routeNames } }),
      Trip.exists({ route: { $in: routeNames } })
    ]);
    if (hasReferences.some(Boolean)) {
      return res.status(409).json({ message: "Reassign buses and resolve trip records before deleting this route." });
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