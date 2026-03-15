"use strict";

const express                    = require("express");
const { execFile, execSync }     = require("child_process");
const { MongoClient }            = require("mongodb");
const util                       = require("util");
const fs                         = require("fs");
const os                         = require("os");
const path                       = require("path");

const router        = express.Router();
const execFileAsync = util.promisify(execFile);

// ── Resolve binary paths ──────────────────────────────────────────────────────

function resolveBin(name, fallback) {
  const cmd = process.platform === "win32" ? `where ${name}` : `which ${name}`;
  try {
    return execSync(cmd, { encoding: "utf8" }).trim().split(/\r?\n/)[0].trim();
  } catch {
    return fallback;
  }
}

const DOCKER = resolveBin("docker", "/usr/bin/docker");
const GIT    = resolveBin("git",    "/usr/bin/git");

console.log(`[sandbox] docker → ${DOCKER}`);
console.log(`[sandbox] git    → ${GIT}`);

const DOCKER_NETWORK = "sandbox_network";
const APP_PORT       = 3000;
const HOST_PORT_MIN  = 3001;
const HOST_PORT_MAX  = 4999;
const MONGO_RETRIES  = 24;
const MONGO_RETRY_MS = 2500;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function docker(args, label, timeoutMs = 30_000) {
  console.log(`[${label}] $ docker ${args.join(" ")}`);
  return execFileAsync(DOCKER, args, { timeout: timeoutMs }).then(({ stdout, stderr }) => {
    if (stdout.trim()) console.log(`[${label}] stdout: ${stdout.trim()}`);
    if (stderr.trim()) console.log(`[${label}] stderr: ${stderr.trim()}`);
    return stdout.trim();
  });
}

function validateRepoUrl(url) {
  const RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\.git)?$/;
  if (typeof url !== "string" || !RE.test(url.trim())) {
    throw new Error("Invalid repoUrl — must be a public HTTPS GitHub URL");
  }
}

function validateSyntheticData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("syntheticData must be a non-empty plain object");
  }
}

function buildMeta(repoUrl) {
  const sandboxId = `sandbox_${Date.now()}`;
  return {
    sandboxId,
    mongoContainer: `${sandboxId}_mongo`,
    appContainer:   `${sandboxId}_app`,
    imageName:      `${sandboxId}_image`,
    dbName:         sandboxId,
    clonePath:      path.join(os.tmpdir(), sandboxId),
    repoUrl,
  };
}

// ── Steps ─────────────────────────────────────────────────────────────────────

async function ensureNetwork() {
  try {
    await docker(["network", "inspect", DOCKER_NETWORK], "network");
    console.log(`[network] already exists — reusing`);
  } catch {
    await docker(["network", "create", DOCKER_NETWORK], "network");
  }
}

async function startMongo(mongoContainer) {
  await docker([
    "run", "-d",
    "--name", mongoContainer,
    "--network", DOCKER_NETWORK,
    "-p", "127.0.0.1:0:27017",
    "mongo:7",
  ], "mongo");
}

async function waitForMongo(mongoContainer) {
  for (let i = 1; i <= MONGO_RETRIES; i++) {
    try {
      await docker(["exec", mongoContainer, "mongosh", "--quiet", "--norc", "--eval", "db.adminCommand({ping:1}).ok"], "mongo-ping", 10_000);
      console.log(`[mongo] Ready after ${i} attempt(s)`);
      return;
    } catch {
      console.log(`[mongo] Not ready (${i}/${MONGO_RETRIES}) — retrying…`);
      await sleep(MONGO_RETRY_MS);
    }
  }
  throw new Error(`MongoDB did not become ready after ${MONGO_RETRIES} attempts`);
}

async function getHostPort(containerName, containerPort) {
  const out = await docker(["port", containerName, String(containerPort)], "port");
  const m   = out.trim().split("\n").map(l => l.trim().match(/:(\d+)$/)).find(Boolean);
  if (!m) throw new Error(`Cannot parse port from: ${out}`);
  return m[1];
}

async function seedMongo(mongoContainer, dbName, syntheticData) {
  const hostPort = await getHostPort(mongoContainer, 27017);
  const client   = new MongoClient(`mongodb://127.0.0.1:${hostPort}`, { serverSelectionTimeoutMS: 10_000 });
  await client.connect();
  try {
    const db = client.db(dbName);
    for (const [col, docs] of Object.entries(syntheticData)) {
      if (!Array.isArray(docs) || docs.length === 0) continue;
      await db.collection(col).insertMany(docs);
      console.log(`[seed] '${col}' — inserted ${docs.length} doc(s)`);
    }
  } finally {
    await client.close();
  }
}

async function cloneRepo(repoUrl, clonePath) {
  await execFileAsync(
    process.platform === "win32" ? "cmd" : "rm",
    process.platform === "win32" ? ["/c", `rmdir /s /q "${clonePath}"`] : ["-rf", clonePath],
    { timeout: 10_000 }
  ).catch(() => {});
  await execFileAsync(GIT, ["clone", "--depth=1", repoUrl, clonePath], { timeout: 180_000 });
  console.log(`[clone] Cloned to ${clonePath}`);
}

async function ensureDockerfile(clonePath) {
  const dockerfilePath = path.join(clonePath, "Dockerfile");
  const stat = fs.existsSync(dockerfilePath) ? fs.statSync(dockerfilePath) : null;
  if (stat && stat.size > 10) return;

  console.log(`[dockerfile] Auto-generating`);
  let appDir = ".";
  let main = "index.js";
  let hasPackageJson = false;
  let hasDevScript = false;
  let startScript = null;

  function readPkg(pkgPath) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.scripts?.dev)   hasDevScript = true;
      if (pkg.scripts?.start) startScript = pkg.scripts.start;
      if (pkg.main) main = pkg.main;
      hasPackageJson = true;
    } catch { /* ignore */ }
  }

  const rootPkg = path.join(clonePath, "package.json");
  if (fs.existsSync(rootPkg)) {
    readPkg(rootPkg);
  } else {
    for (const entry of fs.readdirSync(clonePath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const subPkg = path.join(clonePath, entry.name, "package.json");
      if (fs.existsSync(subPkg)) {
        appDir = entry.name;
        readPkg(subPkg);
        break;
      }
    }
  }

  const workdir    = appDir === "." ? "/app" : `/app/${appDir}`;
  const copySource = appDir === "." ? "." : `${appDir}/`;
  const cmd        = hasDevScript ? `["npm", "run", "dev"]` : startScript ? `["npm", "start"]` : `["node", "${main}"]`;

  const lines = ["FROM node:20-alpine", `WORKDIR ${workdir}`, `COPY ${copySource} .`];
  if (hasPackageJson) lines.push("RUN npm install");
  lines.push("EXPOSE 3000", `CMD ${cmd}`);

  fs.writeFileSync(dockerfilePath, lines.join("\n"));
  console.log(`[dockerfile] Generated (cmd: ${cmd})`);
}

async function buildDockerImage(imageName, clonePath) {
  await docker(["build", "-t", imageName, clonePath], "build", 600_000);
}

async function startAppContainer(imageName, appContainer, mongoContainer, dbName) {
  const mongoUrl = `mongodb://${mongoContainer}:27017/${dbName}`;
  const hostPort = HOST_PORT_MIN + Math.floor(Math.random() * (HOST_PORT_MAX - HOST_PORT_MIN + 1));
  await docker([
    "run", "-d",
    "--name", appContainer,
    "--network", DOCKER_NETWORK,
    "-e", `MONGODB_URL=${mongoUrl}`,
    "-p", `${hostPort}:${APP_PORT}`,
    imageName,
  ], "app");
  console.log(`[app] Container '${appContainer}' started on host port ${hostPort}`);
  return String(hostPort);
}

async function cleanup(meta) {
  const silent = (args) => execFileAsync(DOCKER, args, { timeout: 15_000 }).catch(() => {});
  await silent(["stop", meta.appContainer]);
  await silent(["rm",   "-f", meta.appContainer]);
  await silent(["stop", meta.mongoContainer]);
  await silent(["rm",   "-f", meta.mongoContainer]);
  await silent(["rmi",  "-f", meta.imageName]);
  await execFileAsync(
    process.platform === "win32" ? "cmd" : "rm",
    process.platform === "win32" ? ["/c", `rmdir /s /q "${meta.clonePath}"`] : ["-rf", meta.clonePath],
    { timeout: 10_000 }
  ).catch(() => {});
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { repoUrl, syntheticData } = req.body;

  try {
    validateRepoUrl(repoUrl);
    validateSyntheticData(syntheticData);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // ── DEMO MODE — temporary override ────────────────────────────────────────
  // Remove DEMO_MODE from .env to re-enable real Docker sandbox launching.
  if (process.env.DEMO_MODE === "true") {
    const demoUrl   = process.env.DEMO_URL || "https://demo-production-5026.up.railway.app/";
    const delayMs   = parseInt(process.env.DEMO_DELAY_MS || "304000", 10);
    console.log(`[launch] DEMO MODE — waiting ${delayMs / 1000}s then returning ${demoUrl}`);
    await sleep(delayMs);
    console.log(`[launch] DEMO MODE — returning ${demoUrl}`);
    return res.json({ status: "live", sandboxId: `demo_${Date.now()}`, url: demoUrl });
  }
  // ── END DEMO MODE ──────────────────────────────────────────────────────────

  const meta         = buildMeta(repoUrl.trim());
  const PUBLIC_HOST  = process.env.EC2_PUBLIC_IP || "localhost";

  console.log(`\n${"─".repeat(72)}`);
  console.log(`[launch] Sandbox : ${meta.sandboxId}`);
  console.log(`[launch] Repo    : ${meta.repoUrl}`);
  console.log(`${"─".repeat(72)}`);

  try {
    await ensureNetwork();
    await startMongo(meta.mongoContainer);
    await waitForMongo(meta.mongoContainer);
    await seedMongo(meta.mongoContainer, meta.dbName, syntheticData);
    await cloneRepo(meta.repoUrl, meta.clonePath);
    await ensureDockerfile(meta.clonePath);
    await buildDockerImage(meta.imageName, meta.clonePath);
    const port = await startAppContainer(meta.imageName, meta.appContainer, meta.mongoContainer, meta.dbName);
    const url  = `http://${PUBLIC_HOST}:${port}`;

    console.log(`[launch] ✓ Live → ${url}`);
    return res.json({ status: "live", sandboxId: meta.sandboxId, url });

  } catch (err) {
    console.error(`[launch] ✗ ${err.message}`);
    await cleanup(meta);
    return res.status(500).json({ error: "Sandbox launch failed", detail: err.message });
  }
});

module.exports = router;
