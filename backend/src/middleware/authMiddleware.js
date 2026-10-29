const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token
const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                message: "Not authorized. No token provided."
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({
                message: "Not authorized. Invalid or expired token."
            });
        }

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        if (user.approvalStatus === "Pending") {
            return res.status(403).json({
                message: "Your account request is awaiting administrator approval."
            });
        }

        if (user.approvalStatus === "Rejected") {
            return res.status(403).json({
                message: "Your account request was rejected. Contact an administrator."
            });
        }

        if (user.status !== "Active") {
            return res.status(403).json({
                message: "This account is inactive."
            });
        }

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
};

// Check user role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. Insufficient permissions."
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorizeRoles
};