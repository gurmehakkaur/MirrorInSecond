const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, "data", "projects.json");

// MongoDB URL available for future use
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/mirrorinseconds";
console.log(`MongoDB URL configured: ${MONGODB_URL} (not connected yet — using JSON store)`);

app.use(cors());
app.use(express.json());

const readProjects = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
const writeProjects = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// GET all projects
app.get("/api/projects", (req, res) => {
  res.json(readProjects());
});

// GET single project
app.get("/api/projects/:id", (req, res) => {
  const project = readProjects().find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

// POST create project
app.post("/api/projects", (req, res) => {
  const projects = readProjects();
  const newProject = {
    id: Date.now().toString(),
    scenario: req.body.scenario || "",
    githubUrl: req.body.githubUrl || "",
    syntheticData: req.body.syntheticData || {},
    role: req.body.role || "user",
    userId: req.body.userId || "",
    userPassword: req.body.userPassword || "",
    isLive: req.body.isLive ?? false,
  };
  projects.push(newProject);
  writeProjects(projects);
  res.status(201).json(newProject);
});

// PATCH update project
app.patch("/api/projects/:id", (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  projects[idx] = { ...projects[idx], ...req.body };
  writeProjects(projects);
  res.json(projects[idx]);
});

// DELETE project
app.delete("/api/projects/:id", (req, res) => {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const [deleted] = projects.splice(idx, 1);
  writeProjects(projects);
  res.json(deleted);
});

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
