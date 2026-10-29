const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const { authorizeRoles, protect } = require("../src/middleware/authMiddleware");

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

test("protect rejects a disabled user even when their JWT is valid", async () => {
    const originalFindById = User.findById;
    process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
    User.findById = () => ({
        select: async () => ({ _id: "driver-id", role: "driver", status: "Inactive" })
    });

    try {
        const req = {
            headers: {
                authorization: `Bearer ${jwt.sign({ userId: "driver-id" }, process.env.JWT_SECRET)}`
            }
        };
        const res = createResponse();
        await protect(req, res, () => assert.fail("inactive user must not pass"));
        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, "This account is inactive.");
    } finally {
        User.findById = originalFindById;
    }
});

for (const approvalStatus of ["Pending", "Rejected"]) {
    test(`protect rejects a ${approvalStatus.toLowerCase()} account`, async () => {
        const originalFindById = User.findById;
        process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
        User.findById = () => ({
            select: async () => ({
                _id: "requested-account",
                role: "student",
                status: "Inactive",
                approvalStatus
            })
        });

        try {
            const req = {
                headers: {
                    authorization: `Bearer ${jwt.sign({ userId: "requested-account" }, process.env.JWT_SECRET)}`
                }
            };
            const res = createResponse();
            await protect(req, res, () => assert.fail("unapproved account must not pass"));
            assert.equal(res.statusCode, 403);
            assert.match(res.body.message, approvalStatus === "Pending" ? /awaiting/ : /rejected/i);
        } finally {
            User.findById = originalFindById;
        }
    });
}

test("role middleware denies non-admin users", () => {
    const res = createResponse();
    authorizeRoles("admin")({ user: { role: "student" } }, res, () => assert.fail("student must not pass"));
    assert.equal(res.statusCode, 403);
});
