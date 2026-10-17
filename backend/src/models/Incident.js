const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    bus: {
      type: String,
      required: true,
      trim: true,
    },
    route: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Delay",
        "Breakdown",
        "Safety",
        "Route Deviation",
        "Overcrowding",
        "Other",
      ],
      default: "Other",
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    reporter: {
      type: String,
      default: "Transport Admin",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Reported", "Investigating", "Resolved"],
      default: "Reported",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema);