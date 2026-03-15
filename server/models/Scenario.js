const mongoose = require("mongoose");

const scenarioSchema = new mongoose.Schema(
  {
    projectId:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    scenario:     { type: String, required: true },
    role:         { type: String, default: "user" },
    userId:       { type: String, default: "" },
    userPassword: { type: String, default: "" },
    syntheticData:{ type: mongoose.Schema.Types.Mixed, default: {} },
    url:          { type: String, default: "" },
    isLive:       { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scenario", scenarioSchema);
