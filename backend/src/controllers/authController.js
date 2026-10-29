const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const hasSupportedPasswordLength = (password, minimum = 6) =>
    typeof password === "string" &&
    password.length >= minimum &&
    Buffer.byteLength(password, "utf8") <= 72;

// Register User
const registerUser = async (req, res) => {
    try {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const { password } = body;
        const requestedRole = body.requestedRole ?? "student";

        if (!name || !email || typeof password !== "string") {
            return res.status(400).json({
                message: "Please provide name, email and password"
            });
        }

        if (!["student", "driver", "admin"].includes(requestedRole)) {
            return res.status(400).json({
                message: "Choose a valid account type."
            });
        }

        if (name.length > 100 || email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            !hasSupportedPasswordLength(password)) {
            return res.status(400).json({
                message: "Provide a valid name/email and a password of at least 6 characters and at most 72 UTF-8 bytes."
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const requiresApproval = requestedRole !== "student";
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "student",
            requestedRole,
            approvalStatus: requiresApproval ? "Pending" : "Approved",
            status: requiresApproval ? "Inactive" : "Active"
        });

        res.status(201).json({
            message: requiresApproval
                ? "Your account request was submitted and is awaiting administrator approval."
                : "Student account created successfully. You can now sign in.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                requestedRole: user.requestedRole,
                approvalStatus: user.approvalStatus,
                status: user.status
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "A user with this email already exists." });
        }

        console.error("Registration failed:", error.message);
        res.status(500).json({
            message: "Server error"
        });
    }
};
// Login User
const loginUser = async (req, res) => {
    try {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const { password } = body;

        if (!email || email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            !hasSupportedPasswordLength(password)) {
            return res.status(400).json({
                message: "Please provide email and password"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
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

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Send response
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login failed:", error.message);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};