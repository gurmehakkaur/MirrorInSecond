require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Project = require("./models/Project");
const Scenario = require("./models/Scenario");
const generateSyntheticData = require("./routes/generateSyntheticData");

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

// ── Project Routes ────────────────────────────────────────────────────────────

app.get("/api/projects", async (_req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.json(projects);
});

app.get("/api/projects/:id", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

app.post("/api/projects", async (req, res) => {
  const project = await Project.create({
    githubUrl: req.body.githubUrl || "",
    roles:     req.body.roles     || ["user"],
    dbSchema:  req.body.dbSchema  || {},
  });
  res.status(201).json(project);
});

app.patch("/api/projects/:id", async (req, res) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

app.delete("/api/projects/:id", async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  // Also delete all scenarios for this project
  await Scenario.deleteMany({ projectId: req.params.id });
  res.json(project);
});

// ── Scenario Routes ───────────────────────────────────────────────────────────

// GET scenarios for a project
app.get("/api/scenarios", async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: "projectId query param required" });
  const scenarios = await Scenario.find({ projectId }).sort({ createdAt: -1 });
  res.json(scenarios);
});

app.get("/api/scenarios/:id", async (req, res) => {
  const scenario = await Scenario.findById(req.params.id);
  if (!scenario) return res.status(404).json({ error: "Not found" });
  res.json(scenario);
});

app.post("/api/scenarios", async (req, res) => {
  const scenario = await Scenario.create({
    projectId:    req.body.projectId    || "",
    scenario:     req.body.scenario     || "",
    role:         req.body.role         || "user",
    userId:       req.body.userId       || "",
    userPassword: req.body.userPassword || "",
    syntheticData:req.body.syntheticData|| {},
    isLive:       req.body.isLive       ?? false,
  });
  res.status(201).json(scenario);
});

app.patch("/api/scenarios/:id", async (req, res) => {
  const scenario = await Scenario.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );
  if (!scenario) return res.status(404).json({ error: "Not found" });
  res.json(scenario);
});

app.delete("/api/scenarios/:id", async (req, res) => {
  const scenario = await Scenario.findByIdAndDelete(req.params.id);
  if (!scenario) return res.status(404).json({ error: "Not found" });
  res.json(scenario);
});

// ── Other Routes ──────────────────────────────────────────────────────────────

app.use("/api/generatesyntheticdata", generateSyntheticData);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
