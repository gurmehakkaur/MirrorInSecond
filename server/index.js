const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Project = require("./models/Project");

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/mirrorinseconds";

app.use(cors());
app.use(express.json());

// ── Connect to MongoDB ────────────────────────────────────────────────────────
mongoose
  .connect(MONGODB_URL)
  .then(() => console.log(`MongoDB connected: ${MONGODB_URL}`))
  .catch((err) => { console.error("MongoDB connection error:", err); process.exit(1); });

// ── Routes ────────────────────────────────────────────────────────────────────

// GET all projects
app.get("/api/projects", async (_req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.json(projects);
});

// GET single project
app.get("/api/projects/:id", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

// POST create project
app.post("/api/projects", async (req, res) => {
  const project = await Project.create({
    scenario:     req.body.scenario     || "",
    githubUrl:    req.body.githubUrl    || "",
    syntheticData:req.body.syntheticData|| {},
    role:         req.body.role         || "user",
    userId:       req.body.userId       || "",
    userPassword: req.body.userPassword || "",
    isLive:       req.body.isLive       ?? false,
  });
  res.status(201).json(project);
});

// PATCH update project
app.patch("/api/projects/:id", async (req, res) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

// DELETE project
app.delete("/api/projects/:id", async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
