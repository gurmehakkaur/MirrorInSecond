const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

const SYSTEM_PROMPT = `You are a synthetic data generator for software testing environments.
Given a database schema, a user role, and a short scenario description, generate realistic synthetic test data that:
- Matches the exact structure and field names of the provided schema
- Is appropriate for the given user role (e.g. admin sees more data, user sees their own records only)
- Reflects the scenario described by the user
- Uses plausible fake names, emails, numbers, and dates — never real personal data
- Returns ONLY a valid JSON object with no explanation, no markdown, no code fences`;

router.post("/", async (req, res) => {
  const { prompt, role, dbSchema } = req.body;

  if (!prompt || !role || !dbSchema) {
    return res.status(400).json({ error: "prompt, role, and dbSchema are required" });
  }

  if (prompt.length > 50) {
    return res.status(400).json({ error: "prompt must be 50 characters or less" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  const openai = new OpenAI({ apiKey });

  const userMessage = `
Scenario: ${prompt}
Role: ${role}
Database Schema:
${JSON.stringify(dbSchema, null, 2)}
  `.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content;
    const syntheticData = JSON.parse(raw);

    res.json({ syntheticData });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.status(500).json({ error: "Failed to generate synthetic data", detail: err.message });
  }
});

module.exports = router;
