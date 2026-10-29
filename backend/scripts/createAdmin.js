require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../src/models/User");

async function createAdmin() {
    const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

    if (!name || name.length > 100 || !email || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== "string" || password.length < 12 ||
        Buffer.byteLength(password, "utf8") > 72) {
        throw new Error("Provide valid bootstrap admin name/email and a 12-character minimum password (max 72 UTF-8 bytes).");
    }
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI must be configured.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    try {
        if (await User.exists({ email })) {
            throw new Error("An account with that email already exists; no account was changed.");
        }

        await User.create({
            name,
            email,
            password: await bcrypt.hash(password, 12),
            role: "admin",
            status: "Active"
        });
        console.log("Administrator account created. Remove the temporary bootstrap password from the environment.");
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin().catch((error) => {
    console.error("Administrator bootstrap failed. Verify the input and database configuration; sensitive values were not logged.");
    process.exitCode = 1;
});
