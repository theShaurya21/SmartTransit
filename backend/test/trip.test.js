const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const Trip = require("../src/models/Trip");

function createTrip(latestLocation) {
    return new Trip({
        bus: new mongoose.Types.ObjectId(),
        driver: new mongoose.Types.ObjectId(),
        route: "North campus route",
        latestLocation
    });
}

test("accepts a device GPS location within coordinate bounds", async () => {
    const trip = createTrip({
        latitude: 27.5,
        longitude: 77.6,
        accuracy: 18,
        receivedAt: new Date(),
        source: "device-geolocation"
    });

    await assert.doesNotReject(trip.validate());
});

test("rejects out-of-range GPS coordinates", async () => {
    const trip = createTrip({
        latitude: 91,
        longitude: 77.6,
        receivedAt: new Date(),
        source: "device-geolocation"
    });

    await assert.rejects(trip.validate(), { name: "ValidationError" });
});

test("rejects unsupported location sources", async () => {
    const trip = createTrip({
        latitude: 27.5,
        longitude: 77.6,
        receivedAt: new Date(),
        source: "simulated"
    });

    await assert.rejects(trip.validate(), { name: "ValidationError" });
});
