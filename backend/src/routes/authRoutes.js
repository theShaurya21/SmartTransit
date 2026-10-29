const express = require("express");

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const {
    protect,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();
const User = require("../models/User");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route: any logged-in user
router.get("/me", protect, (req, res) => {
    res.status(200).json({
        message: "User authenticated successfully",
        user: req.user
    });
});

router.patch("/me", protect, async (req, res, next) => {
    try {
        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        if (!name || name.length > 100) {
            return res.status(400).json({ message: "Name must be between 1 and 100 characters." });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { name } },
            { new: true, runValidators: true }
        ).select("-password");

        return res.json({ user });
    } catch (error) {
        return next(error);
    }
});

// Admin-only test route
router.get(
    "/admin-test",
    protect,
    authorizeRoles("admin"),
    (req, res) => {
        res.status(200).json({
            message: "Welcome, Admin!"
        });
    }
);

module.exports = router;