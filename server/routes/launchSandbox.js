"use strict";

const express = require("express");
const router  = express.Router();

/**
 * POST /api/launchSandbox
 * Forwards the request to the EC2 sandbox service which has Docker installed.
 */
router.post("/", async (req, res) => {
  const sandboxServiceUrl = process.env.SANDBOX_SERVICE_URL;
  if (!sandboxServiceUrl) {
    return res.status(503).json({ error: "SANDBOX_SERVICE_URL is not configured" });
  }

  try {
    const upstream = await fetch(`${sandboxServiceUrl}/launch`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(req.body),
      signal:  AbortSignal.timeout(660_000), // 11 min — docker build can be slow
    });

    const text = await upstream.text();
    let data = {};
    try { data = JSON.parse(text); } catch { /* non-JSON */ }

    return res.status(upstream.status).json(
      upstream.ok ? data : { error: data.error || text || "Sandbox launch failed", detail: data.detail }
    );
  } catch (err) {
    console.error("[launchSandbox proxy] Error:", err.message);
    return res.status(500).json({ error: "Failed to reach sandbox service", detail: err.message });
  }
});

module.exports = router;
