const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
    {
        busNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        driver: {
            type: String,
            required: true,
            trim: true
        },
        route: {
            type: String,
            required: true,
            trim: true
        },
        capacity: {
            type: Number,
            required: true,
            min: 1
        },
        status: {
            type: String,
            enum: ["Active", "Maintenance", "Inactive"],
            default: "Active"
        },
        registrationNumber: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Bus", busSchema);