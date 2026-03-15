const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    scenario:      { type: String, required: true },
    githubUrl:     { type: String, required: true },
    syntheticData: { type: mongoose.Schema.Types.Mixed, default: {} },
    role:          { type: String, default: "user" },
    userId:        { type: String, default: "" },
    userPassword:  { type: String, default: "" },
    isLive:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
