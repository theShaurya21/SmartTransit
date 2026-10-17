
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
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
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users."
    });
  }
});

// CREATE a user
router.post("/", async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters."
      });
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
      status: status || "Active"
    });

    const safeUser = await User.findById(user._id)
      .select("-password");

    res.status(201).json(safeUser);
  } catch (error) {
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

    const { name, email, role, status, password } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) {
      updates.email = email.trim().toLowerCase();
    }
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters."
        });
      }

      updates.password = await bcrypt.hash(password, 10);
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
    );

    if (currentUserId === req.params.id) {
      return res.status(400).json({
        message: "You cannot delete your own account."
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
