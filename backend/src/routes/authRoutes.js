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