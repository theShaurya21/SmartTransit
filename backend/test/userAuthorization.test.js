const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const Bus = require("../src/models/Bus");
const Incident = require("../src/models/Incident");
const Trip = require("../src/models/Trip");
const User = require("../src/models/User");
const userRoutes = require("../src/routes/userRoutes");

async function startUserApi() {
    const app = express();
    app.use(express.json());
    app.use("/api/users", userRoutes);
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    return server;
}

async function stopUserApi(server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
}

test("student tokens cannot read users or process registration approvals", async () => {
    const originalFindById = User.findById;
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
    User.findById = () => ({
        select: async () => ({
            _id: "student-account",
            role: "student",
            status: "Active",
            approvalStatus: "Approved"
        })
    });

    const server = await startUserApi();

    try {
        const address = server.address();
        const token = jwt.sign({ userId: "student-account" }, process.env.JWT_SECRET);
        const response = await fetch(`http://127.0.0.1:${address.port}/api/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const approvalResponse = await fetch(
            `http://127.0.0.1:${address.port}/api/users/507f1f77bcf86cd799439011/approve`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        assert.equal(response.status, 403);
        assert.equal(approvalResponse.status, 403);
    } finally {
        await stopUserApi(server);
        User.findById = originalFindById;
        if (previousSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = previousSecret;
        }
    }
});

test("admin approval persists the requested staff role and activates the account", async () => {
    const originalFindById = User.findById;
    const originalFindOne = User.findOne;
    const originalFindOneAndUpdate = User.findOneAndUpdate;
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
    let updateValues;
    User.findById = () => ({
        select: async () => ({
            _id: "administrator-account",
            role: "admin",
            status: "Active",
            approvalStatus: "Approved"
        })
    });
    User.findOne = async () => ({
        _id: "507f1f77bcf86cd799439011",
        requestedRole: "driver"
    });
    User.findOneAndUpdate = (filter, update) => {
        updateValues = { filter, update };
        return {
            select: async () => ({
                _id: filter._id,
                role: update.$set.role,
                requestedRole: "driver",
                status: update.$set.status,
                approvalStatus: update.$set.approvalStatus
            })
        };
    };

    const server = await startUserApi();
    try {
        const address = server.address();
        const token = jwt.sign({ userId: "administrator-account" }, process.env.JWT_SECRET);
        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/users/507f1f77bcf86cd799439011/approve`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.user.role, "driver");
        assert.equal(body.user.status, "Active");
        assert.equal(body.user.approvalStatus, "Approved");
        assert.equal(Object.hasOwn(body.user, "password"), false);
        assert.deepEqual(updateValues.update.$set, {
            role: "driver",
            approvalStatus: "Approved",
            status: "Active"
        });
        assert.equal(updateValues.filter.approvalStatus, "Pending");
    } finally {
        await stopUserApi(server);
        User.findById = originalFindById;
        User.findOne = originalFindOne;
        User.findOneAndUpdate = originalFindOneAndUpdate;
        if (previousSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = previousSecret;
        }
    }
});

test("the last active administrator cannot be demoted or deleted", async () => {
    const originalFindById = User.findById;
    const originalCountDocuments = User.countDocuments;
    const originalBusExists = Bus.exists;
    const originalTripExists = Trip.exists;
    const originalIncidentExists = Incident.exists;
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
    User.findById = (id) => ({
        select: async () => ({
            _id: id,
            role: "admin",
            status: "Active",
            approvalStatus: "Approved"
        }),
        then(resolve, reject) {
            return Promise.resolve({
                _id: id,
                role: "admin",
                status: "Active",
                approvalStatus: "Approved"
            }).then(resolve, reject);
        }
    });


    User.countDocuments = async () => 1;
    Bus.exists = async () => null;
    Trip.exists = async () => null;
    Incident.exists = async () => null;
    const server = await startUserApi();

    try {
        const address = server.address();
        const token = jwt.sign({ userId: "administrator-account" }, process.env.JWT_SECRET);
        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
        const baseUrl = `http://127.0.0.1:${address.port}/api/users/507f1f77bcf86cd799439011`;
        const demotion = await fetch(baseUrl, {
            method: "PUT",
            headers,
            body: JSON.stringify({ role: "student" })
        });
        const deletion = await fetch(baseUrl, { method: "DELETE", headers });

        assert.equal(demotion.status, 409);
        assert.equal(deletion.status, 409);
    } finally {
        await stopUserApi(server);
        User.findById = originalFindById;
        User.countDocuments = originalCountDocuments;
        Bus.exists = originalBusExists;
        Trip.exists = originalTripExists;
        Incident.exists = originalIncidentExists;
        if (previousSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = previousSecret;
        }
    }
});

test("the last inactive administrator cannot be demoted", async () => {
    const originalFindById = User.findById;
    const originalCountDocuments = User.countDocuments;
    const originalBusExists = Bus.exists;
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
    User.findById = (id) => {
        const account = {
            _id: id,
            role: "admin",
            status: id === "administrator-account" ? "Active" : "Inactive",
            approvalStatus: "Approved"
        };
        return {
            select: async () => account,
            then(resolve, reject) {
                return Promise.resolve(account).then(resolve, reject);
            }
        };
    };
    User.countDocuments = async () => 1;
    Bus.exists = async () => null;
    const server = await startUserApi();

    try {
        const address = server.address();
        const token = jwt.sign({ userId: "administrator-account" }, process.env.JWT_SECRET);
        const response = await fetch(
            `http://127.0.0.1:${address.port}/api/users/507f1f77bcf86cd799439011`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role: "student" })
            }
        );

        assert.equal(response.status, 409);
    } finally {
        await stopUserApi(server);
        User.findById = originalFindById;
        User.countDocuments = originalCountDocuments;
        Bus.exists = originalBusExists;
        if (previousSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = previousSecret;
        }
    }
});
