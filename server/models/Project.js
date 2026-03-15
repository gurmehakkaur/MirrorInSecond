const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    githubUrl: { type: String, required: true },
    roles:           { type: [String], default: ["user"] },
    dbSchema:        { type: mongoose.Schema.Types.Mixed, default: {} },
    roleCredentials: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
