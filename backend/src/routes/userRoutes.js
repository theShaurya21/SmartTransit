
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Bus = require("../models/Bus");
const Trip = require("../models/Trip");
const Incident = require("../models/Incident");
const {
  protect,
  authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only logged-in administrators can manage users.
router.use(protect, authorizeRoles("admin"));

// GET all users
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.role !== undefined) {
      if (!["student", "driver", "admin"].includes(req.query.role)) {
        return res.status(400).json({ message: "Invalid user role filter." });
      }
      filter.role = req.query.role;
    }

    if (req.query.status !== undefined) {
      if (!["Active", "Inactive"].includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid account status filter." });
      }
      filter.status = req.query.status;
    }

    if (req.query.approvalStatus !== undefined) {
      if (!["Pending", "Approved", "Rejected"].includes(req.query.approvalStatus)) {
        return res.status(400).json({ message: "Invalid approval status filter." });
      }
      if (req.query.approvalStatus === "Approved") {
        filter.$or = [
          { approvalStatus: "Approved" },
          { approvalStatus: { $exists: false } }
        ];
      } else {
        filter.approvalStatus = req.query.approvalStatus;
      }
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users."
    });
  }
});

router.post("/:id/approve", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const request = await User.findOne({
      _id: req.params.id,
      approvalStatus: "Pending"
    });
    if (!request) {
      return res.status(404).json({ message: "Pending registration request not found." });
    }

    if (!["driver", "admin"].includes(request.requestedRole)) {
      return res.status(409).json({ message: "This account has no approvable staff role request." });
    }

    const user = await User.findOneAndUpdate(
      { _id: request._id, approvalStatus: "Pending" },
      {
        $set: {
          role: request.requestedRole,
          approvalStatus: "Approved",
          status: "Active"
        }
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(409).json({ message: "This registration request has already been processed." });
    }

    return res.json({ message: "Registration request approved.", user });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/reject", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        approvalStatus: "Pending"
      },
      {
        $set: {
          approvalStatus: "Rejected",
          status: "Inactive"
        }
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Pending registration request not found." });
    }

    return res.json({ message: "Registration request rejected.", user });
  } catch (error) {
    return next(error);
  }
});

// CREATE a user
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body || {};

    if (typeof name !== "string" || !name.trim() ||
        typeof email !== "string" || !email.trim() ||
        typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required."
      });
    }

    if (password.length < 6 || Buffer.byteLength(password, "utf8") > 72 ||
        email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        message: "Provide a valid email address and a password between 6 characters and 72 UTF-8 bytes."
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ message: "Name cannot exceed 100 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      email: normalizedEmail
    });

    if (existing) {
      return res.status(409).json({
        message: "A user with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "student",
      requestedRole: role || "student",
      approvalStatus: "Approved",
      status: status || "Active"
    });

    const safeUser = await User.findById(user._id)
      .select("-password");

    res.status(201).json(safeUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A user with this email already exists."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: "Failed to create user."
    });
  }
});

// UPDATE a user
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID."
      });
    }

    const { name, email, role, status, password } = req.body || {};
    const updates = {};

    const currentUserId = String(req.user._id).toLowerCase();
    if (currentUserId === req.params.id.toLowerCase() &&
        ((role !== undefined && role !== req.user.role) ||
         (status !== undefined && status !== req.user.status))) {
      return res.status(400).json({
        message: "You cannot change your own role or account status."
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
        return res.status(400).json({ message: "Name must be between 1 and 100 characters." });
      }
      updates.name = name.trim();
    }
    if (email !== undefined) {
      if (typeof email !== "string" || email.trim().length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ message: "Provide a valid email address." });
      }
      updates.email = email.trim().toLowerCase();
    }
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 6 ||
          Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({
          message: "Password must be at least 6 characters and at most 72 UTF-8 bytes."
        });
      }

      updates.password = await bcrypt.hash(password, 10);
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (targetUser.approvalStatus === "Pending" &&
        (role !== undefined || status !== undefined)) {
      return res.status(409).json({
        message: "Approve or reject this registration request before changing its role or account status."
      });
    }

    if ((role !== undefined || status !== undefined) &&
        await Bus.exists({ driverId: req.params.id }) &&
        ((role !== undefined && role !== "driver") ||
         (status !== undefined && status !== "Active"))) {
      return res.status(409).json({
        message: "Reassign this driver's buses before changing the role or account status."
      });
    }

    if (targetUser.role === "admin" &&
        role !== undefined &&
        role !== "admin" &&
        await User.countDocuments({ role: "admin" }) <= 1) {
      return res.status(409).json({
        message: "The last administrator account cannot be demoted."
      });
    }

    if (targetUser.role === "admin" &&
        targetUser.status === "Active" &&
        status !== undefined &&
        status !== "Active" &&
        await User.countDocuments({ role: "admin", status: "Active" }) <= 1) {
      return res.status(409).json({
        message: "The last active administrator cannot be deactivated."
      });
    }

    if (role !== undefined) {
      updates.requestedRole = role;
    }
    if (targetUser.approvalStatus === "Rejected" && status === "Active") {
      updates.approvalStatus = "Approved";
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A user with this email already exists."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message
      });
    }

    res.status(500).json({
      message: "Failed to update user."
    });
  }
});

// DELETE a user
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID."
      });
    }

    const currentUserId = String(
      req.user._id || req.user.id || ""
    ).toLowerCase();

    if (currentUserId === req.params.id.toLowerCase()) {
      return res.status(400).json({
        message: "You cannot delete your own account."
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (targetUser.role === "admin" &&
        await User.countDocuments({ role: "admin" }) <= 1) {
      return res.status(409).json({
        message: "The last administrator account cannot be deleted."
      });
    }

    const hasReferences = await Promise.all([
      Bus.exists({ driverId: req.params.id }),
      Trip.exists({ driver: req.params.id }),
      Incident.exists({ reporterId: req.params.id })
    ]);
    if (hasReferences.some(Boolean)) {
      return res.status(409).json({
        message: "This account has transport records. Deactivate it instead of deleting it."
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.json({
      message: "User deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user."
    });
  }
});

module.exports = router;
