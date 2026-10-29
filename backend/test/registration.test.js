const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const { registerUser } = require("../src/controllers/authController");

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

async function submitRegistration(requestedRole) {
    const originalFindOne = User.findOne;
    const originalCreate = User.create;
    let created;
    User.findOne = async () => null;
    User.create = async (data) => {
        created = { _id: "test-user", ...data };
        return created;
    };

    try {
        const req = {
            body: {
                name: "Test Applicant",
                email: "applicant@example.test",
                password: "passphrase123",
                requestedRole
            }
        };
        const res = createResponse();
        await registerUser(req, res);
        return { res, created };
    } finally {
        User.findOne = originalFindOne;
        User.create = originalCreate;
    }
}

test("public administrator request remains a pending student until approval", async () => {
    const { res, created } = await submitRegistration("admin");
    assert.equal(res.statusCode, 201);
    assert.equal(created.role, "student");
    assert.equal(created.requestedRole, "admin");
    assert.equal(created.approvalStatus, "Pending");
    assert.equal(created.status, "Inactive");
});

test("public student registration is immediately active with student permissions", async () => {
    const { res, created } = await submitRegistration("student");
    assert.equal(res.statusCode, 201);
    assert.equal(created.role, "student");
    assert.equal(created.requestedRole, "student");
    assert.equal(created.approvalStatus, "Approved");
    assert.equal(created.status, "Active");
});

test("public registration rejects an invalid account type", async () => {
    const originalFindOne = User.findOne;
    User.findOne = async () => null;
    try {
        const res = createResponse();
        await registerUser({
            body: {
                name: "Test Applicant",
                email: "applicant@example.test",
                password: "passphrase123",
                requestedRole: "superadmin"
            }
        }, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, "Choose a valid account type.");
    } finally {
        User.findOne = originalFindOne;
    }
});

test("legacy active users default to approved without a destructive data migration", () => {
    const user = User.hydrate({
        _id: new mongoose.Types.ObjectId(),
        name: "Existing Student",
        email: "existing@example.test",
        password: "existing-hash",
        role: "student",
        status: "Active"
    });

    assert.equal(user.approvalStatus, "Approved");
    assert.equal(user.status, "Active");
});
