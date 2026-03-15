"use strict";

const express             = require("express");
const { exec, execFile }  = require("child_process");
const { MongoClient }     = require("mongodb");
const util                = require("util");

const router        = express.Router();
const execRaw       = util.promisify(exec);        // for shell commands  (git, rm)
const execFileAsync = util.promisify(execFile);    // for Docker — bypasses /bin/sh entirely

// ── Constants ─────────────────────────────────────────────────────────────────

const DOCKER         = "/usr/bin/docker";
const GIT            = "/usr/bin/git";
const DOCKER_NETWORK = "sandbox_network";
const APP_PORT       = 3000;
const MONGO_RETRIES  = 24;
const MONGO_RETRY_MS = 2500;

// ── Core runners ──────────────────────────────────────────────────────────────

/**
 * docker(args, label, timeoutMs)
 * Calls the Docker binary directly via execFile — no shell involved.
 * This avoids "/bin/sh: docker: not found" on Ubuntu snap/wrapper installs.
 */
function docker(args, label, timeoutMs = 30_000) {
  console.log(`[${label}] $ docker ${args.join(" ")}`);
  return execFileAsync(DOCKER, args, { timeout: timeoutMs }).then(({ stdout, stderr }) => {
    if (stdout.trim()) console.log(`[${label}] stdout: ${stdout.trim()}`);
    if (stderr.trim()) console.log(`[${label}] stderr: ${stderr.trim()}`);
    return stdout.trim();
  });
}

/**
 * shell(cmd, label, timeoutMs)
 * Used only for commands that genuinely need a shell (git clone, rm -rf).
 */
function shell(cmd, label, timeoutMs = 60_000) {
  console.log(`[${label}] $ ${cmd}`);
  return execRaw(cmd, { timeout: timeoutMs }).then(({ stdout, stderr }) => {
    if (stdout.trim()) console.log(`[${label}] stdout: ${stdout.trim()}`);
    if (stderr.trim()) console.log(`[${label}] stderr: ${stderr.trim()}`);
    return stdout.trim();
  });
}

// ── Input validation ──────────────────────────────────────────────────────────

function validateRepoUrl(url) {
  const RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\.git)?$/;
  if (typeof url !== "string" || !RE.test(url.trim())) {
    throw new Error(
      "Invalid repoUrl — must be a public HTTPS GitHub URL (https://github.com/org/repo)"
    );
  }
}

function validateSyntheticData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("syntheticData must be a non-empty plain object");
  }
}

// ── ID / name generation ──────────────────────────────────────────────────────

function buildMeta(repoUrl) {
  const sandboxId      = `sandbox_${Date.now()}`;
  return {
    sandboxId,
    mongoContainer : `${sandboxId}_mongo`,
    appContainer   : `${sandboxId}_app`,
    imageName      : `${sandboxId}_image`,
    dbName         : sandboxId,
    clonePath      : `/tmp/${sandboxId}`,
    repoUrl,
  };
}

// ── Step 3: Docker network ────────────────────────────────────────────────────

async function ensureNetwork() {
  try {
    await docker(["network", "inspect", DOCKER_NETWORK], "network");
    console.log(`[network] '${DOCKER_NETWORK}' already exists — reusing`);
  } catch {
    await docker(["network", "create", DOCKER_NETWORK], "network");
    console.log(`[network] Created '${DOCKER_NETWORK}'`);
  }
}

// ── Step 4: Start MongoDB container ──────────────────────────────────────────

async function startMongo(mongoContainer) {
  await docker([
    "run", "-d",
    "--name", mongoContainer,
    "--network", DOCKER_NETWORK,
    "-p", "127.0.0.1:0:27017",
    "mongo:7",
  ], "mongo");
  console.log(`[mongo] Container '${mongoContainer}' started`);
}

// ── Step 5: Wait until MongoDB is ready ──────────────────────────────────────

async function waitForMongo(mongoContainer) {
  console.log(`[mongo] Polling '${mongoContainer}' for readiness…`);
  for (let attempt = 1; attempt <= MONGO_RETRIES; attempt++) {
    try {
      await docker([
        "exec", mongoContainer,
        "mongosh", "--quiet", "--norc",
        "--eval", "db.adminCommand({ping:1}).ok",
      ], "mongo-ping", 10_000);
      console.log(`[mongo] Ready after ${attempt} attempt(s)`);
      return;
    } catch {
      console.log(`[mongo] Not ready (${attempt}/${MONGO_RETRIES}) — retrying in ${MONGO_RETRY_MS}ms`);
      await sleep(MONGO_RETRY_MS);
    }
  }
  throw new Error(
    `MongoDB '${mongoContainer}' did not become ready after ${MONGO_RETRIES} attempts`
  );
}

// ── Discover host port ────────────────────────────────────────────────────────

function parsePort(output) {
  for (const line of output.trim().split("\n")) {
    const m = line.trim().match(/:(\d+)$/);
    if (m) return m[1];
  }
  throw new Error(`Cannot parse port from:\n${output}`);
}

async function getHostPort(containerName, containerPort) {
  const out  = await docker(["port", containerName, String(containerPort)], "port");
  const port = parsePort(out);
  console.log(`[port] ${containerName}:${containerPort} → host:${port}`);
  return port;
}

// ── Step 6: Seed MongoDB ──────────────────────────────────────────────────────

async function seedMongo(mongoContainer, dbName, syntheticData) {
  const hostPort = await getHostPort(mongoContainer, 27017);
  const uri      = `mongodb://127.0.0.1:${hostPort}`;

  console.log(`[seed] Connecting to ${uri}`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
  await client.connect();

  try {
    const db = client.db(dbName);
    for (const [col, docs] of Object.entries(syntheticData)) {
      if (!Array.isArray(docs) || docs.length === 0) {
        console.log(`[seed] Skipping '${col}' — empty`);
        continue;
      }
      await db.collection(col).insertMany(docs);
      console.log(`[seed] '${col}' — inserted ${docs.length} doc(s)`);
    }
    console.log(`[seed] Done — database: '${dbName}'`);
  } finally {
    await client.close();
  }
}

// ── Step 7: Clone repo ────────────────────────────────────────────────────────

async function cloneRepo(repoUrl, clonePath) {
  await shell(`rm -rf ${clonePath}`, "clone-clean").catch(() => {});
  await shell(`${GIT} clone --depth=1 ${repoUrl} ${clonePath}`, "clone", 180_000);
  console.log(`[clone] Cloned to ${clonePath}`);
}

// ── Step 8: Build Docker image ────────────────────────────────────────────────

async function buildDockerImage(imageName, clonePath) {
  await docker(["build", "-t", imageName, clonePath], "build", 600_000);
  console.log(`[build] Image '${imageName}' ready`);
}

// ── Step 9: Start app container ───────────────────────────────────────────────

async function startAppContainer(imageName, appContainer, mongoContainer, dbName) {
  const mongoUrl = `mongodb://${mongoContainer}:27017/${dbName}`;
  await docker([
    "run", "-d",
    "--name", appContainer,
    "--network", DOCKER_NETWORK,
    "-e", `MONGODB_URL=${mongoUrl}`,
    "-p", `0:${APP_PORT}`,
    imageName,
  ], "app");
  console.log(`[app] Container '${appContainer}' started`);
}

// ── Cleanup on failure ────────────────────────────────────────────────────────

async function cleanup(meta) {
  console.log(`[cleanup] Tearing down '${meta.sandboxId}'…`);
  const silentDocker = (args) =>
    execFileAsync(DOCKER, args, { timeout: 15_000 }).catch(() => {});

  await silentDocker(["stop",  meta.appContainer]);
  await silentDocker(["rm",    "-f", meta.appContainer]);
  await silentDocker(["stop",  meta.mongoContainer]);
  await silentDocker(["rm",    "-f", meta.mongoContainer]);
  await silentDocker(["rmi",   "-f", meta.imageName]);
  await shell(`rm -rf ${meta.clonePath}`, "cleanup-fs").catch(() => {});
  console.log(`[cleanup] Done`);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Route: POST /api/launchSandbox ────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { repoUrl, syntheticData } = req.body;

  try {
    validateRepoUrl(repoUrl);
    validateSyntheticData(syntheticData);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const meta          = buildMeta(repoUrl.trim());
  const EC2_PUBLIC_IP = process.env.EC2_PUBLIC_IP || "localhost";

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
    await buildDockerImage(meta.imageName, meta.clonePath);
    await startAppContainer(meta.imageName, meta.appContainer, meta.mongoContainer, meta.dbName);

    const port = await getHostPort(meta.appContainer, APP_PORT);
    const url  = `http://${EC2_PUBLIC_IP}:${port}`;

    console.log(`[launch] ✓ Live → ${url}`);
    console.log(`${"─".repeat(72)}\n`);

    return res.json({ status: "live", sandboxId: meta.sandboxId, url });

  } catch (err) {
    console.error(`[launch] ✗ FAILED — ${err.message}`);
    await cleanup(meta);
    return res.status(500).json({ error: "Sandbox launch failed", detail: err.message });
  }
});

module.exports = router;
