const mongoose = require("mongoose");

const latestLocationSchema = new mongoose.Schema(
    {
        latitude: { type: Number, required: true, min: -90, max: 90 },
        longitude: { type: Number, required: true, min: -180, max: 180 },
        accuracy: { type: Number, min: 0, max: 10000 },
        receivedAt: { type: Date, required: true },
        source: { type: String, enum: ["device-geolocation"], required: true }
    },
    { _id: false }
);

const tripSchema = new mongoose.Schema(
    {
        bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true, index: true },
        driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        route: { type: String, required: true, trim: true },
        status: { type: String, enum: ["Active", "Completed"], default: "Active", index: true },
        startedAt: { type: Date, required: true, default: Date.now },
        endedAt: { type: Date, default: null },
        latestLocation: { type: latestLocationSchema, default: null }
    },
    { timestamps: true }
);

tripSchema.index(
    { bus: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: "Active" } }
);
tripSchema.index(
    { driver: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: "Active" } }
);

module.exports = mongoose.model("Trip", tripSchema);
