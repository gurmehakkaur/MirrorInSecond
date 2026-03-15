/**
 * launchSandbox.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Spins up a fully isolated sandbox for a given GitHub repo + synthetic data.
 *
 * Flow:
 *   1.  Generate unique sandbox ID
 *   2.  Derive container / image / DB names
 *   3.  Ensure Docker network exists
 *   4.  Start a MongoDB container with a mapped host port
 *   5.  Wait until MongoDB is accepting connections
 *   6.  Seed MongoDB with the provided synthetic data
 *   7.  Clone the GitHub repo to /tmp/<sandboxId>
 *   8.  Build a Docker image from the repo
 *   9.  Run the app container with MONGODB_URL injected
 *  10.  Discover the randomly assigned host port
 *  11.  Return { status, sandboxId, url }
 *
 * On any failure every resource created up to that point is torn down cleanly.
 */

"use strict";

const express    = require("express");
const { exec }   = require("child_process");
const { MongoClient } = require("mongodb");
const util       = require("util");

const router = express.Router();

// ── Constants ─────────────────────────────────────────────────────────────────

const DOCKER_NETWORK  = "sandbox_network";
const APP_PORT        = 3000;          // port the cloned app listens on inside its container
const MONGO_RETRIES   = 24;            // × 2 500 ms = 60 s max wait
const MONGO_RETRY_MS  = 2500;

// ── promisify exec with per-call timeouts ─────────────────────────────────────

const execRaw = util.promisify(exec);

function run(cmd, label, timeoutMs = 30_000) {
  console.log(`[${label}] $ ${cmd}`);
  return execRaw(cmd, { timeout: timeoutMs }).then(({ stdout, stderr }) => {
    if (stdout.trim()) console.log(`[${label}] stdout: ${stdout.trim()}`);
    if (stderr.trim()) console.log(`[${label}] stderr: ${stderr.trim()}`);
    return stdout.trim();
  });
}

// ── Input validation ──────────────────────────────────────────────────────────

/**
 * Only allow well-formed HTTPS GitHub URLs.
 * Prevents command injection through the repoUrl field.
 */
function validateRepoUrl(url) {
  const RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\.git)?$/;
  if (typeof url !== "string" || !RE.test(url.trim())) {
    throw new Error(
      "Invalid repoUrl — must be a public HTTPS GitHub URL " +
      "(https://github.com/org/repo)"
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
  const mongoContainer = `${sandboxId}_mongo`;
  const appContainer   = `${sandboxId}_app`;
  const imageName      = `${sandboxId}_image`;
  const dbName         = sandboxId;                      // unique DB per sandbox
  const clonePath      = `/tmp/${sandboxId}`;

  return { sandboxId, mongoContainer, appContainer, imageName, dbName, clonePath, repoUrl };
}

// ── Step 3: Docker network ────────────────────────────────────────────────────

async function ensureNetwork() {
  try {
    await run(`docker network inspect ${DOCKER_NETWORK}`, "network");
    console.log(`[network] '${DOCKER_NETWORK}' already exists — reusing`);
  } catch {
    await run(`docker network create ${DOCKER_NETWORK}`, "network");
    console.log(`[network] Created '${DOCKER_NETWORK}'`);
  }
}

// ── Step 4: Start MongoDB container ──────────────────────────────────────────
// Maps 127.0.0.1:0 → 27017 so the host Node process can seed it without
// colliding with other sandboxes running on the same machine.

async function startMongo(mongoContainer) {
  await run(
    `docker run -d --name ${mongoContainer} --network ${DOCKER_NETWORK} ` +
    `-p 127.0.0.1:0:27017 mongo:7`,
    "mongo"
  );
  console.log(`[mongo] Container '${mongoContainer}' started`);
}

// ── Step 5: Wait until MongoDB is ready ──────────────────────────────────────

async function waitForMongo(mongoContainer) {
  console.log(`[mongo] Polling '${mongoContainer}' for readiness…`);
  for (let attempt = 1; attempt <= MONGO_RETRIES; attempt++) {
    try {
      await run(
        `docker exec ${mongoContainer} mongosh --quiet --norc ` +
        `--eval "db.adminCommand({ping:1}).ok"`,
        "mongo-ping",
        10_000
      );
      console.log(`[mongo] Ready after ${attempt} attempt(s)`);
      return;
    } catch {
      console.log(`[mongo] Not ready (attempt ${attempt}/${MONGO_RETRIES}) — retrying in ${MONGO_RETRY_MS}ms`);
      await sleep(MONGO_RETRY_MS);
    }
  }
  throw new Error(
    `MongoDB container '${mongoContainer}' did not become ready after ` +
    `${MONGO_RETRIES} attempts`
  );
}

// ── Discover the host port that Docker assigned to a container port ───────────
// 'docker port' output may include both IPv4 and IPv6 lines, e.g.:
//   0.0.0.0:32768
//   :::32768

function parsePort(dockerPortOutput) {
  for (const line of dockerPortOutput.trim().split("\n")) {
    const m = line.trim().match(/:(\d+)$/);
    if (m) return m[1];
  }
  throw new Error(`Cannot parse port from docker port output:\n${dockerPortOutput}`);
}

async function getHostPort(containerName, containerPort) {
  const out = await run(`docker port ${containerName} ${containerPort}`, "port");
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

    for (const [collectionName, documents] of Object.entries(syntheticData)) {
      if (!Array.isArray(documents) || documents.length === 0) {
        console.log(`[seed] Skipping '${collectionName}' — empty or not an array`);
        continue;
      }
      await db.collection(collectionName).insertMany(documents);
      console.log(`[seed] '${collectionName}' — inserted ${documents.length} document(s)`);
    }

    console.log(`[seed] Seeding complete — database: '${dbName}'`);
  } finally {
    await client.close();
  }
}

// ── Step 7: Clone repo ────────────────────────────────────────────────────────

async function cloneRepo(repoUrl, clonePath) {
  // Guard: remove any leftover directory from a previous attempt
  await execRaw(`rm -rf ${clonePath}`).catch(() => {});

  await run(
    `git clone --depth=1 ${repoUrl} ${clonePath}`,
    "clone",
    180_000          // 3-minute timeout for slow repos
  );
  console.log(`[clone] Repo cloned to ${clonePath}`);
}

// ── Step 8: Build Docker image ────────────────────────────────────────────────

async function buildDockerImage(imageName, clonePath) {
  await run(
    `docker build -t ${imageName} ${clonePath}`,
    "build",
    600_000           // 10-minute timeout for long builds
  );
  console.log(`[build] Image '${imageName}' built successfully`);
}

// ── Step 9: Start app container ───────────────────────────────────────────────

async function startAppContainer(imageName, appContainer, mongoContainer, dbName) {
  const mongoUrl = `mongodb://${mongoContainer}:27017/${dbName}`;

  await run(
    `docker run -d ` +
    `--name ${appContainer} ` +
    `--network ${DOCKER_NETWORK} ` +
    `-e MONGODB_URL="${mongoUrl}" ` +
    `-p 0:${APP_PORT} ` +
    `${imageName}`,
    "app"
  );
  console.log(`[app] Container '${appContainer}' started — MONGODB_URL=${mongoUrl}`);
}

// ── Cleanup on failure ────────────────────────────────────────────────────────

async function cleanup(meta) {
  console.log(`[cleanup] Starting teardown for '${meta.sandboxId}'…`);

  const steps = [
    `docker stop  ${meta.appContainer}   2>/dev/null || true`,
    `docker rm -f ${meta.appContainer}   2>/dev/null || true`,
    `docker stop  ${meta.mongoContainer} 2>/dev/null || true`,
    `docker rm -f ${meta.mongoContainer} 2>/dev/null || true`,
    `docker rmi -f ${meta.imageName}     2>/dev/null || true`,
    `rm -rf ${meta.clonePath}`,
  ];

  for (const cmd of steps) {
    await execRaw(cmd, { timeout: 15_000 }).catch(e =>
      console.warn(`[cleanup] Non-fatal: ${e.message}`)
    );
  }

  console.log(`[cleanup] Teardown complete for '${meta.sandboxId}'`);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Route: POST /api/launchSandbox ────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { repoUrl, syntheticData } = req.body;

  // ── Validate inputs before touching Docker
  try {
    validateRepoUrl(repoUrl);
    validateSyntheticData(syntheticData);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const meta = buildMeta(repoUrl.trim());
  const EC2_PUBLIC_IP = process.env.EC2_PUBLIC_IP || "localhost";

  console.log(`\n${"─".repeat(72)}`);
  console.log(`[launch] Sandbox  : ${meta.sandboxId}`);
  console.log(`[launch] Repo     : ${meta.repoUrl}`);
  console.log(`[launch] DB       : ${meta.dbName}`);
  console.log(`${"─".repeat(72)}`);

  try {
    // 3. Docker network
    await ensureNetwork();

    // 4. MongoDB container
    await startMongo(meta.mongoContainer);

    // 5. Wait for MongoDB
    await waitForMongo(meta.mongoContainer);

    // 6. Seed
    await seedMongo(meta.mongoContainer, meta.dbName, syntheticData);

    // 7. Clone repo
    await cloneRepo(meta.repoUrl, meta.clonePath);

    // 8. Build image
    await buildDockerImage(meta.imageName, meta.clonePath);

    // 9. Start app container
    await startAppContainer(meta.imageName, meta.appContainer, meta.mongoContainer, meta.dbName);

    // 10. Discover assigned host port
    const port = await getHostPort(meta.appContainer, APP_PORT);

    // 11. Construct public URL
    const url = `http://${EC2_PUBLIC_IP}:${port}`;

    console.log(`[launch] ✓ Sandbox live → ${url}`);
    console.log(`${"─".repeat(72)}\n`);

    return res.status(200).json({
      status   : "live",
      sandboxId: meta.sandboxId,
      url,
    });

  } catch (err) {
    console.error(`[launch] ✗ FAILED — ${err.message}`);
    await cleanup(meta);
    return res.status(500).json({
      error : "Sandbox launch failed",
      detail: err.message,
    });
  }
});

module.exports = router;
